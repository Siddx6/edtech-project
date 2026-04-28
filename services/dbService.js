import Student from "../models/Student.js";
import TopicHealth from "../models/TopicHealth.js";
import Exam from "../models/Exam.js";
import { buildClassMatcher, normalizeClassLabel } from "../utils/classUtils.js";

export async function getStudentHistory({
  student_name,
  class: studentClass,
  subject,
}) {
  const normalizedStudentClass = normalizeClassLabel(studentClass);

  if (!student_name || !normalizedStudentClass) {
    return null;
  }

  const student = await Student.findOne({
    name: student_name,
    class: buildClassMatcher(normalizedStudentClass),
  });

  if (!student) {
    console.log("Student not found in DB - treating as new student");
    return null;
  }

  await student.populate({
    path: "exams",
    match: subject ? { subject } : {},
    options: { sort: { exam_date: 1 } },
  });

  await student.populate({
    path: "topic_health_records",
    match: subject ? { subject } : {},
    options: { sort: { updatedAt: -1 } },
  });

  const pastExams = (student.exams || []).map((exam) => ({
    exam_id: exam._id,
    exam_type: exam.exam_type,
    exam_date: exam.exam_date,
    subject: exam.subject,
    total_marks: exam.total_marks,
    scored_marks: exam.scored_marks,
    percentage: exam.percentage,
    weak_chapters: exam.weak_chapters || [],
    strong_chapters: exam.strong_chapters || [],
    priority_topics: exam.priority_topics || [],
    suggested_goal: exam.suggested_goal || null,
  }));

  if (!pastExams.length) {
    pastExams.push(
      ...(await getLegacyExamReportsForStudent({
        studentId: student._id,
        subject,
      })),
    );
  }

  if (!pastExams.length) {
    console.log("Student found but no past exams - treating as first exam");
    return null;
  }

  pastExams.sort(
    (left, right) =>
      new Date(left.exam_date || 0).getTime() -
      new Date(right.exam_date || 0).getTime(),
  );

  const topicHealthDoc =
    Array.isArray(student.topic_health_records) &&
    student.topic_health_records.length > 0
      ? student.topic_health_records[0]
      : null;

  return {
    student_id: student._id,
    past_exams: pastExams,
    topic_health: (topicHealthDoc?.topic_health || []).map((chapter) => ({
      chapter_code: chapter.chapter || null,
      chapter_name: chapter.chapter_name || chapter.chapter || null,
      sub_topics: chapter.sub_topics || [],
      updated_at: topicHealthDoc?.updatedAt || null,
    })),
  };
}

export async function getPracticeQuizContext({
  student_id,
  student_name,
  class: studentClass,
  subject,
}) {
  if (!subject) {
    return null;
  }

  let student = null;

  if (student_id) {
    student = await Student.findById(student_id);
  } else if (student_name && studentClass) {
    student = await Student.findOne({
      name: student_name,
      class: buildClassMatcher(studentClass),
    });
  }

  if (!student) {
    return null;
  }

  await student.populate({
    path: "exams",
    match: { subject },
    options: { sort: { exam_date: -1 } },
  });

  await student.populate({
    path: "topic_health_records",
    match: { subject },
    options: { sort: { updatedAt: -1 } },
  });

  const latestReport =
    Array.isArray(student.exams) && student.exams.length > 0
      ? student.exams[0]
      : null;
  const legacyReports = latestReport
    ? []
    : await getLegacyExamReportsForStudent({
        studentId: student._id,
        subject,
      });
  const fallbackLatestReport = legacyReports[0] || null;

  const topicHealthDoc =
    Array.isArray(student.topic_health_records) &&
    student.topic_health_records.length > 0
      ? student.topic_health_records[0]
      : null;

  const normalizedTopicHealth = (topicHealthDoc?.topic_health || [])
    .map((chapter) => ({
      chapter_code: chapter.chapter || null,
      chapter_name: chapter.chapter_name || chapter.chapter || null,
      sub_topics: Array.isArray(chapter.sub_topics)
        ? chapter.sub_topics.map((subTopic) => ({
            code: String(subTopic.code || "").trim(),
            status: subTopic.status,
          }))
        : [],
    }))
    .filter((chapter) => chapter.chapter_name);

  let weakChapters = buildChapterSummaries(normalizedTopicHealth).weak;

  if (!weakChapters.length && latestReport?.weak_chapters?.length) {
    weakChapters = latestReport.weak_chapters;
  }

  if (!weakChapters.length && fallbackLatestReport?.weak_chapters?.length) {
    weakChapters = fallbackLatestReport.weak_chapters;
  }

  const priorityTopics =
    latestReport?.priority_topics || fallbackLatestReport?.priority_topics || [];
  const weakTopicLabels = weakChapters.flatMap((chapter) => {
    if (Array.isArray(chapter.sub_topics) && chapter.sub_topics.length) {
      return chapter.sub_topics.map((subTopic) => ({
        chapter_name: chapter.chapter_name,
        sub_topic: subTopic,
      }));
    }

    return [
      {
        chapter_name: chapter.chapter_name,
        sub_topic: null,
      },
    ];
  });

  return {
    student: {
      id: student._id,
      name: student.name,
      class: student.class,
      school: student.school,
    },
    subject,
    weak_chapters: weakChapters,
    weak_topics: weakTopicLabels,
    priority_topics: priorityTopics,
    latest_exam: latestReport
      ? {
          exam_id: latestReport._id,
          exam_type: latestReport.exam_type,
          exam_date: latestReport.exam_date,
          percentage: latestReport.percentage,
          suggested_goal: latestReport.suggested_goal || null,
        }
      : fallbackLatestReport
        ? {
            exam_id: fallbackLatestReport.exam_id || null,
            exam_type: fallbackLatestReport.exam_type,
            exam_date: fallbackLatestReport.exam_date,
            percentage: fallbackLatestReport.percentage,
            suggested_goal: fallbackLatestReport.suggested_goal || null,
          }
        : null,
  };
}

export async function saveExamAnalysis({
  finalAnalysis,
  questionPaperFile,
  answerSheetFile,
}) {
  const studentInfo = finalAnalysis?.student_info || {};
  const normalizedExamType = normalizeStoredExamType(studentInfo.exam_type);
  const studentName = String(studentInfo.name || "").trim();
  const studentClass = normalizeClassLabel(studentInfo.class);
  const studentSchool =
    String(studentInfo.school || "").trim() || "Unknown School";
  const examDate = new Date();

  if (!studentName || !studentClass) {
    console.warn("Student info incomplete - skipping DB persistence");
    return null;
  }

  let student = await Student.findOne({
    name: studentName,
    class: buildClassMatcher(studentClass),
  });

  if (student) {
    student.class = studentClass;

    if (studentInfo.school) {
      student.school = studentSchool;
    } else if (!student.school) {
      student.school = studentSchool;
    }

    await student.save();
  } else {
    student = await Student.create({
      name: studentName,
      class: studentClass,
      school: studentSchool,
    });
  }

  const topicHealthSnapshot = normalizeTopicHealth(finalAnalysis.topic_health);
  const chapterSummary = buildChapterSummaries(topicHealthSnapshot);

  const examDoc = await Exam.create({
    student_id: student._id,
    exam_type: normalizedExamType,
    subject: studentInfo.subject,
    total_marks: studentInfo.total_marks,
    scored_marks: finalAnalysis.total_scored,
    percentage: finalAnalysis.percentage,
    exam_date: examDate,
    has_sections: false,
    suggested_goal: finalAnalysis?.ai_recommendation?.suggested_goal || null,
    goal_set_by: finalAnalysis?.ai_recommendation?.suggested_goal
      ? "ai_suggested"
      : null,
    weak_chapters: chapterSummary.weak,
    strong_chapters: chapterSummary.strong,
    priority_topics: finalAnalysis?.ai_recommendation?.priority_topics || [],
    chapters_in_scope: topicHealthSnapshot.map((chapter) => ({
      chapter_code: chapter.chapter_code,
      chapter_name: chapter.chapter_name,
    })),
    uploads: {
      question_paper: {
        file_url: null,
        file_type: questionPaperFile?.mimetype || null,
        uploaded_at: examDate,
      },
      answer_sheet: {
        file_url: null,
        file_type: answerSheetFile?.mimetype || null,
        uploaded_at: examDate,
      },
    },
    ai_processed: true,
  });

  await TopicHealth.findOneAndUpdate(
    {
      student_id: student._id,
      subject: studentInfo.subject,
    },
    {
      student_id: student._id,
      subject: studentInfo.subject,
      topic_health: topicHealthSnapshot.map((chapter) => ({
        chapter: chapter.chapter_code || chapter.chapter_name,
        chapter_name: chapter.chapter_name,
        sub_topics: chapter.sub_topics,
      })),
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );

  return {
    student_id: student._id,
    exam_id: examDoc._id,
  };
}

function normalizeStoredExamType(examType) {
  const normalized = String(examType || "")
    .trim()
    .toLowerCase();

  if (normalized === "annual" || normalized === "annual exam") {
    return "Final";
  }

  if (normalized === "half yearly" || normalized === "half-yearly") {
    return "Mid-Term";
  }

  return examType;
}

async function getLegacyExamReportsForStudent({ studentId, subject }) {
  const legacyStudent = await Student.collection.findOne(
    { _id: studentId },
    { projection: { exam_reports: 1 } },
  );

  const reports = Array.isArray(legacyStudent?.exam_reports)
    ? legacyStudent.exam_reports
    : [];

  return reports
    .filter((report) => !subject || report.subject === subject)
    .sort(
      (left, right) =>
        new Date(right.exam_date || 0).getTime() -
        new Date(left.exam_date || 0).getTime(),
    )
    .map((report) => ({
      exam_id: report.exam_id || null,
      exam_type: report.exam_type,
      exam_date: report.exam_date || null,
      subject: report.subject,
      total_marks: report.total_marks,
      scored_marks: report.scored_marks,
      percentage: report.percentage,
      weak_chapters: report.weak_chapters || [],
      strong_chapters: report.strong_chapters || [],
      priority_topics: report.priority_topics || [],
      suggested_goal: report.suggested_goal || null,
    }));
}

export function normalizeTopicHealth(topicHealth) {
  if (!Array.isArray(topicHealth)) {
    return [];
  }

  return topicHealth
    .map((chapter) => ({
      chapter_code: chapter.chapter_code || chapter.chapter || null,
      chapter_name: chapter.chapter_name || chapter.chapter || null,
      sub_topics: Array.isArray(chapter.sub_topics)
        ? chapter.sub_topics
            .filter((subTopic) => subTopic?.code && subTopic?.status)
            .map((subTopic) => ({
              code: String(subTopic.code).trim(),
              status: subTopic.status,
            }))
        : [],
    }))
    .filter((chapter) => chapter.chapter_name);
}

export function buildChapterSummaries(topicHealthSnapshot) {
  const weak = [];
  const strong = [];

  for (const chapter of topicHealthSnapshot) {
    const weakSubTopics = chapter.sub_topics
      .filter((subTopic) => subTopic.status !== "crystal_clear")
      .map((subTopic) => subTopic.code);

    if (weakSubTopics.length > 0) {
      weak.push({
        chapter_name: chapter.chapter_name,
        sub_topics: weakSubTopics,
      });
    } else {
      strong.push({
        chapter_name: chapter.chapter_name,
        sub_topics: chapter.sub_topics.map((subTopic) => subTopic.code),
      });
    }
  }

  return { weak, strong };
}
