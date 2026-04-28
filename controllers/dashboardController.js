import Student from "../models/Student.js";
import Exam from "../models/Exam.js";
import GeneratedPaper from "../models/GeneratedPaper.js";
import TopicHealth from "../models/TopicHealth.js";
import { buildClassMatcher, normalizeClassLabel } from "../utils/classUtils.js";

export async function getStudentsList(_req, res) {
  try {
    const [students, exams, papers, topicHealthDocs] = await Promise.all([
      Student.find().sort({ created_at: -1 }).lean(),
      Exam.find().sort({ exam_date: -1 }).lean(),
      GeneratedPaper.find().select("_id class").lean(),
      TopicHealth.find().sort({ updatedAt: -1 }).lean(),
    ]);

    const examsByStudent = groupById(exams, "student_id");
    const paperCountByClass = papers.reduce((accumulator, paper) => {
      const key = normalizeClassLabel(paper.class);
      if (key) {
        accumulator.set(key, (accumulator.get(key) || 0) + 1);
      }

      return accumulator;
    }, new Map());
    const latestTopicHealthByStudent = new Map();

    for (const topicHealthDoc of topicHealthDocs) {
      const studentId = String(topicHealthDoc.student_id || "");
      if (!studentId || latestTopicHealthByStudent.has(studentId)) {
        continue;
      }

      latestTopicHealthByStudent.set(studentId, topicHealthDoc);
    }

    const studentList = students.map((student) => {
      const studentId = String(student._id);
      const studentExams = examsByStudent.get(studentId) || [];
      const latestExam = studentExams[0] || null;
      const averagePercentage = calculateAveragePercentage(studentExams);
      const topicHealthDoc = latestTopicHealthByStudent.get(studentId) || null;

      return {
        id: student._id,
        name: student.name,
        class: normalizeClassLabel(student.class) || student.class,
        school: student.school,
        exam_count: studentExams.length,
        available_papers:
          paperCountByClass.get(normalizeClassLabel(student.class)) || 0,
        average_percentage: averagePercentage,
        latest_exam: latestExam ? serializeExamSummary(latestExam) : null,
        subjects: [...new Set(studentExams.map((exam) => exam.subject).filter(Boolean))],
        focus_topics: deriveFocusTopics({
          latestExam,
          topicHealthDocs: topicHealthDoc ? [topicHealthDoc] : [],
        }).slice(0, 4),
      };
    });

    return res.status(200).json({
      success: true,
      data: studentList,
    });
  } catch (error) {
    console.error("Error fetching students list:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getStudentOverview(req, res) {
  try {
    const { studentId } = req.params;

    const [student, exams, topicHealthDocs, availablePapers] = await Promise.all([
      Student.findById(studentId).lean(),
      Exam.find({ student_id: studentId }).sort({ exam_date: -1 }).lean(),
      TopicHealth.find({ student_id: studentId }).sort({ updatedAt: -1 }).lean(),
      Student.findById(studentId)
        .lean()
        .then((studentDoc) =>
          studentDoc?.class
            ? GeneratedPaper.find({
                class: buildClassMatcher(studentDoc.class),
              })
                .sort({ created_at: -1 })
                .select(
                  "_id title subject exam_type class total_marks num_questions duration format created_at",
                )
                .lean()
            : [],
        ),
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const latestExam = exams[0] || null;
    const previousExam = exams[1] || null;
    const averagePercentage = calculateAveragePercentage(exams);
    const subjectBreakdown = buildSubjectBreakdown(exams);
    const recentScores = exams
      .slice(0, 6)
      .reverse()
      .map((exam) => ({
        exam_id: exam._id,
        subject: exam.subject,
        exam_type: exam.exam_type,
        percentage: exam.percentage,
        exam_date: exam.exam_date,
      }));
    const focusTopics = deriveFocusTopics({
      latestExam,
      topicHealthDocs,
    });
    const weakTopics = flattenWeakChapters(latestExam?.weak_chapters || []);
    const normalizedAvailablePapers = availablePapers.map((paper) => ({
      ...paper,
      class: normalizeClassLabel(paper.class) || paper.class,
    }));

    const data = {
      student: {
        id: student._id,
        name: student.name,
        class: normalizeClassLabel(student.class) || student.class,
        school: student.school,
      },
      summary: {
        available_papers_count: normalizedAvailablePapers.length,
        exam_count: exams.length,
        average_percentage: averagePercentage,
        latest_percentage: latestExam?.percentage ?? null,
        improvement_from_previous: calculateImprovement(latestExam, previousExam),
        subjects: [
          ...new Set(
            [
              ...exams.map((exam) => exam.subject),
              ...normalizedAvailablePapers.map((paper) => paper.subject),
            ]
              .filter(Boolean),
          ),
        ],
      },
      available_papers: normalizedAvailablePapers,
      exam_history: exams.map(serializeExamSummary),
      latest_exam: latestExam ? serializeExamDetail(latestExam) : null,
      performance: {
        subject_breakdown: subjectBreakdown,
        recent_scores: recentScores,
        strongest_subject:
          subjectBreakdown.length > 0
            ? [...subjectBreakdown].sort((left, right) => right.average_percentage - left.average_percentage)[0]
            : null,
      },
      recommendations: {
        suggested_goal:
          latestExam?.suggested_goal ||
          (latestExam?.percentage != null
            ? `${Math.min(100, Math.max(50, Math.ceil((latestExam.percentage + 8) / 5) * 5))}%`
            : null),
        priority_topics: latestExam?.priority_topics || focusTopics,
        weak_topics: weakTopics,
        history_feedback: buildHistoryFeedback(latestExam, previousExam),
      },
      topic_health: topicHealthDocs.map(serializeTopicHealth),
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching student overview:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getTeacherAnalytics(_req, res) {
  try {
    const [papers, students, exams] = await Promise.all([
      GeneratedPaper.find()
        .sort({ created_at: -1 })
        .select(
          "_id title subject exam_type class total_marks num_questions duration format created_at",
        )
        .lean(),
      Student.find().sort({ created_at: -1 }).lean(),
      Exam.find().sort({ exam_date: -1 }).lean(),
    ]);

    const papersBySubject = countByField(papers, "subject");
    const papersByClass = countByField(papers, "class");
    const performanceBySubject = buildSubjectBreakdown(exams);
    const averageScore = calculateAveragePercentage(exams);
    const recentActivity = [
      ...papers.slice(0, 5).map((paper) => ({
        id: `paper-${paper._id}`,
        type: "paper",
        title: paper.title,
        subtitle: `${paper.subject} | ${normalizeClassLabel(paper.class) || paper.class}`,
        timestamp: paper.created_at,
      })),
      ...exams.slice(0, 5).map((exam) => ({
        id: `exam-${exam._id}`,
        type: "exam",
        title: `${exam.subject} ${exam.exam_type}`,
        subtitle: `${exam.percentage ?? "N/A"}% | ${exam.total_marks} marks`,
        timestamp: exam.exam_date,
      })),
    ]
      .sort(
        (left, right) =>
          new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime(),
      )
      .slice(0, 8);

    const examsByStudent = groupById(exams, "student_id");
    const topStudents = students
      .map((student) => {
        const studentExams = examsByStudent.get(String(student._id)) || [];

        return {
          id: student._id,
          name: student.name,
          class: normalizeClassLabel(student.class) || student.class,
          exam_count: studentExams.length,
          average_percentage: calculateAveragePercentage(studentExams),
        };
      })
      .filter((student) => student.exam_count > 0)
      .sort(
        (left, right) =>
          right.average_percentage - left.average_percentage ||
          right.exam_count - left.exam_count,
      )
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_papers: papers.length,
          total_students: students.length,
          analyzed_exams: exams.length,
          average_score: averageScore,
          pdf_papers: papers.length,
        },
        papers_by_subject: papersBySubject,
        papers_by_class: papersByClass,
        performance_by_subject: performanceBySubject,
        recent_activity: recentActivity,
        top_students: topStudents,
      },
    });
  } catch (error) {
    console.error("Error fetching teacher analytics:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

function buildHistoryFeedback(latestExam, previousExam) {
  if (!latestExam) {
    return null;
  }

  if (!previousExam || latestExam.percentage == null || previousExam.percentage == null) {
    if (latestExam.priority_topics?.length) {
      return `Focus next on ${latestExam.priority_topics.slice(0, 3).join(", ")} to improve your score further.`;
    }

    return "Keep practicing consistently and review your weak chapters before the next exam.";
  }

  const delta = Number(latestExam.percentage) - Number(previousExam.percentage);

  if (delta > 0) {
    return `You improved by ${delta.toFixed(1)} points compared with your previous exam. Keep building on that momentum.`;
  }

  if (delta < 0) {
    return `Your score dropped by ${Math.abs(delta).toFixed(1)} points compared with the previous exam. Revisit your recent weak topics before the next test.`;
  }

  return "Your score is steady compared with the previous exam. A little more practice can help push it higher.";
}

function buildSubjectBreakdown(exams) {
  const subjectMap = new Map();

  for (const exam of exams) {
    const key = String(exam.subject || "").trim();
    if (!key) {
      continue;
    }

    if (!subjectMap.has(key)) {
      subjectMap.set(key, []);
    }

    subjectMap.get(key).push(exam);
  }

  return [...subjectMap.entries()].map(([subject, subjectExams]) => ({
    subject,
    exam_count: subjectExams.length,
    average_percentage: calculateAveragePercentage(subjectExams),
    latest_percentage:
      subjectExams.find((exam) => typeof exam.percentage === "number")?.percentage ?? null,
  }));
}

function calculateAveragePercentage(exams) {
  const validPercentages = exams
    .map((exam) => exam.percentage)
    .filter((percentage) => typeof percentage === "number");

  if (!validPercentages.length) {
    return 0;
  }

  const total = validPercentages.reduce((sum, percentage) => sum + percentage, 0);
  return Number((total / validPercentages.length).toFixed(2));
}

function calculateImprovement(latestExam, previousExam) {
  if (
    !latestExam ||
    !previousExam ||
    typeof latestExam.percentage !== "number" ||
    typeof previousExam.percentage !== "number"
  ) {
    return null;
  }

  return Number((latestExam.percentage - previousExam.percentage).toFixed(2));
}

function countByField(items, field) {
  const counts = new Map();

  for (const item of items) {
    const key =
      field === "class"
        ? normalizeClassLabel(item[field])
        : String(item[field] || "").trim();
    if (!key) {
      continue;
    }

    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}

function deriveFocusTopics({ latestExam, topicHealthDocs }) {
  const directTopics = Array.isArray(latestExam?.priority_topics)
    ? latestExam.priority_topics.filter(Boolean)
    : [];

  if (directTopics.length > 0) {
    return directTopics;
  }

  const derivedTopics = [];

  for (const topicHealthDoc of topicHealthDocs) {
    for (const chapter of topicHealthDoc.topic_health || []) {
      for (const subTopic of chapter.sub_topics || []) {
        if (subTopic.status !== "crystal_clear") {
          derivedTopics.push(
            `${chapter.chapter_name || chapter.chapter}${subTopic.code ? ` - ${subTopic.code}` : ""}`,
          );
        }
      }
    }
  }

  return [...new Set(derivedTopics)];
}

function flattenWeakChapters(weakChapters) {
  if (!Array.isArray(weakChapters)) {
    return [];
  }

  return weakChapters.flatMap((chapter) => {
    const chapterName = chapter.chapter_name || chapter.chapter || "Topic";
    if (Array.isArray(chapter.sub_topics) && chapter.sub_topics.length > 0) {
      return chapter.sub_topics.map((subTopic) => `${chapterName} - ${subTopic}`);
    }

    return [chapterName];
  });
}

function groupById(items, field) {
  return items.reduce((accumulator, item) => {
    const key = String(item[field] || "");
    if (!key) {
      return accumulator;
    }

    if (!accumulator.has(key)) {
      accumulator.set(key, []);
    }

    accumulator.get(key).push(item);
    return accumulator;
  }, new Map());
}

function serializeExamSummary(exam) {
  return {
    id: exam._id,
    subject: exam.subject,
    exam_type: exam.exam_type,
    total_marks: exam.total_marks,
    scored_marks: exam.scored_marks,
    percentage: exam.percentage,
    exam_date: exam.exam_date,
    weak_chapters: exam.weak_chapters || [],
    strong_chapters: exam.strong_chapters || [],
    suggested_goal: exam.suggested_goal || null,
    priority_topics: exam.priority_topics || [],
  };
}

function serializeExamDetail(exam) {
  return {
    ...serializeExamSummary(exam),
    has_sections: exam.has_sections || false,
  };
}

function serializeTopicHealth(topicHealthDoc) {
  return {
    subject: topicHealthDoc.subject,
    updated_at: topicHealthDoc.updatedAt || null,
    topic_health: (topicHealthDoc.topic_health || []).map((chapter) => ({
      chapter: chapter.chapter,
      chapter_name: chapter.chapter_name || chapter.chapter,
      sub_topics: chapter.sub_topics || [],
    })),
  };
}
