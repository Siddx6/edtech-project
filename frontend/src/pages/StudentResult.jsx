import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Target, TrendingUp, Zap } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import "./StudentResult.css";

function StudentResult() {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = useMemo(
    () =>
      buildResultViewModel(
        location.state?.resultData,
        location.state?.examMeta,
        examId,
      ),
    [examId, location.state],
  );
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    setSelectedGoal(normalizeGoalSelection(result?.suggestedGoal));
  }, [result?.suggestedGoal]);

  const goals = [
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 90, label: "90%" },
    { value: 100, label: "100%" },
  ];

  if (!result) {
    return (
      <div className="student-result-container">
        <Card className="no-hover">
          <h2 className="section-title">Result Not Loaded</h2>
          <p className="feedback-text">
            Live result data is not available for this visit yet. Submit an offline
            answer sheet to see the AI analysis here.
          </p>
          <div className="action-section">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => navigate("/")}
              className="action-btn-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleGenerateQuiz = () => {
    navigate("/quiz", {
      state: {
        preferredSubject: result.subject,
      },
    });
  };

  return (
    <div className="student-result-container">
      <div className="score-section">
        <Card className="score-card no-hover">
          {result.needsManualReview && (
            <div style={{ backgroundColor: "#fff3cd", color: "#856404", padding: "8px 12px", textAlign: "center", marginBottom: 16, borderRadius: 4, fontSize: 14, border: "1px solid #ffeeba" }}>
              ⚠️ <strong>Low Confidence:</strong> Handwriting was difficult to read. Results may require manual verification.
            </div>
          )}
          <div className="score-display">
            <div className="score-circle">
              <div className="score-inner">
                <span className="score-percentage">{result.percentage}%</span>
                <span className="score-label">Score</span>
              </div>
            </div>
            <div className="score-info">
              <h2 className="result-title">{result.examName}</h2>
              <p className="result-subject">{result.subject}</p>
              <p className="result-marks">
                Marks obtained:{" "}
                <strong>
                  {result.score}/{result.totalMarks}
                </strong>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="section">
        <h3 className="section-title">Chapter-wise Performance</h3>
        <Card className="no-hover">
          {result.chapters.length === 0 ? (
            <p className="goal-desc">
              Question-level chapter breakdown is not available for this result.
            </p>
          ) : (
            <div className="chapters-performance">
              {result.chapters.map((chapter) => {
                const percentage =
                  chapter.maxScore > 0
                    ? Math.round((chapter.score / chapter.maxScore) * 100)
                    : 0;
                let progressStatus = "low";

                if (percentage >= 70) {
                  progressStatus = "high";
                } else if (percentage >= 50) {
                  progressStatus = "medium";
                }

                return (
                  <div key={chapter.name} className="chapter-performance-item">
                    <div className="chapter-info">
                      <span className="chapter-name">{chapter.name}</span>
                      <span className="chapter-marks">
                        {chapter.score}/{chapter.maxScore}
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className={`progress-bar progress-${progressStatus}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="chapter-percentage">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="feedback-card">
        <h3 className="section-title">AI Feedback</h3>
        <p className="feedback-text">{result.feedback}</p>

        <div className="feedback-grid">
          <div className="feedback-section">
            <h4 className="feedback-subtitle">
              <span className="feedback-icon success">S</span> Strong Topics
            </h4>
            <div className="topics-list">
              {result.strongTopics.length === 0 ? (
                <Badge variant="success">No strong topics recorded yet</Badge>
              ) : (
                result.strongTopics.map((topic) => (
                  <Badge key={topic} variant="success">
                    {topic}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="feedback-section">
            <h4 className="feedback-subtitle">
              <span className="feedback-icon warning">!</span> Focus Areas
            </h4>
            <div className="topics-list">
              {result.weakTopics.length === 0 ? (
                <Badge variant="warning">No urgent focus areas recorded</Badge>
              ) : (
                result.weakTopics.map((topic) => (
                  <Badge key={topic} variant="warning">
                    {topic}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="goal-card">
        <div className="goal-header">
          <Target size={24} className="goal-icon" />
          <h3 className="section-title">Set Your Target</h3>
        </div>
        <p className="goal-desc">What is your target score for the next exam?</p>
        <div className="goal-buttons">
          {goals.map((goal) => (
            <button
              key={goal.value}
              className={`goal-btn ${selectedGoal === goal.value ? "selected" : ""}`}
              onClick={() => setSelectedGoal(goal.value)}
            >
              {goal.label}
            </button>
          ))}
        </div>
        {selectedGoal && (
          <p className="goal-message">
            Your next target is <strong>{selectedGoal}%</strong>. Keep practicing
            toward it.
          </p>
        )}
      </Card>

      <div className="action-section">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleGenerateQuiz}
          className="action-btn-full"
        >
          <Zap size={20} /> Generate Revision Quiz
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => navigate("/")}
          className="action-btn-full"
        >
          Back to Dashboard
        </Button>
      </div>

      <Card className="insights-card">
        <div className="insights-header">
          <TrendingUp size={24} className="insights-icon" />
          <h4 className="insights-title">Performance Insights</h4>
        </div>
        <ul className="insights-list">
          {result.insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function buildResultViewModel(resultData, examMeta, examId) {
  if (!resultData || typeof resultData !== "object") {
    return null;
  }

  const studentInfo = resultData.student_info || {};
  const questions = Array.isArray(resultData.questions) ? resultData.questions : [];
  const strongTopics = extractTopicLabels(resultData.strong_chapters);
  const weakTopics = extractTopicLabels(resultData.weak_chapters);
  const priorityTopics = Array.isArray(resultData.ai_recommendation?.priority_topics)
    ? resultData.ai_recommendation.priority_topics.filter(Boolean)
    : [];
  const chapterPerformance = buildChapterPerformance(questions);
  const totalMarks =
    normalizeNumber(studentInfo.total_marks) ||
    chapterPerformance.reduce((sum, chapter) => sum + chapter.maxScore, 0);
  const score =
    normalizeNumber(resultData.total_scored) ||
    chapterPerformance.reduce((sum, chapter) => sum + chapter.score, 0);
  const percentage =
    typeof resultData.percentage === "number"
      ? resultData.percentage
      : totalMarks > 0
        ? Number(((score / totalMarks) * 100).toFixed(2))
        : 0;
  const suggestedGoal = resultData.ai_recommendation?.suggested_goal || null;
  const feedback = buildFeedback({
    resultData,
    percentage,
    suggestedGoal,
    weakTopics,
    priorityTopics,
  });

  return {
    examName:
      examMeta?.name ||
      (studentInfo.exam_type ? `${studentInfo.exam_type} Result` : `Exam ${examId}`),
    subject: studentInfo.subject || examMeta?.subject || "Unknown Subject",
    score,
    totalMarks,
    percentage,
    feedback,
    chapters: chapterPerformance,
    strongTopics: strongTopics.slice(0, 6),
    weakTopics: (weakTopics.length > 0 ? weakTopics : priorityTopics).slice(0, 6),
    suggestedGoal,
    needsManualReview: Boolean(resultData.needs_manual_review),
    insights: buildInsights({
      strongTopics,
      weakTopics,
      priorityTopics,
      suggestedGoal,
      comparisonWithHistory: resultData.comparison_with_history,
      percentage,
    }),
  };
}

function buildChapterPerformance(questions) {
  const chapterMap = new Map();

  for (const question of questions) {
    const chapterName =
      question.chapter_name ||
      question.chapter ||
      `Question ${question.question_no || chapterMap.size + 1}`;
    const marksAvailable = normalizeNumber(question.marks_available);
    const marksScored = normalizeNumber(question.marks_scored);
    const currentChapter = chapterMap.get(chapterName) || {
      name: chapterName,
      score: 0,
      maxScore: 0,
    };

    currentChapter.score += marksScored;
    currentChapter.maxScore += marksAvailable;
    chapterMap.set(chapterName, currentChapter);
  }

  return [...chapterMap.values()].sort((left, right) => right.maxScore - left.maxScore);
}

function buildFeedback({
  resultData,
  percentage,
  suggestedGoal,
  weakTopics,
  priorityTopics,
}) {
  const historyFeedback = String(resultData.history_feedback || "").trim();

  if (historyFeedback) {
    return historyFeedback;
  }

  const focusTopics = weakTopics.length > 0 ? weakTopics : priorityTopics;

  if (focusTopics.length > 0 && suggestedGoal) {
    return `You scored ${percentage}%. Focus next on ${formatTopicList(
      focusTopics,
    )} to work toward ${suggestedGoal}.`;
  }

  if (focusTopics.length > 0) {
    return `You scored ${percentage}%. Focus next on ${formatTopicList(
      focusTopics,
    )} before the next exam.`;
  }

  return `You scored ${percentage}%. Keep revising consistently and build on your current progress.`;
}

function buildInsights({
  strongTopics,
  weakTopics,
  priorityTopics,
  suggestedGoal,
  comparisonWithHistory,
  percentage,
}) {
  const insights = [];
  const improvedTopics = extractComparisonTopics(
    comparisonWithHistory?.improved_topics,
  );
  const declinedTopics = extractComparisonTopics(
    comparisonWithHistory?.declined_topics,
  );

  if (strongTopics.length > 0) {
    insights.push(`You are performing best in ${formatTopicList(strongTopics, 2)}.`);
  }

  if (weakTopics.length > 0) {
    insights.push(`The next revision should focus on ${formatTopicList(weakTopics)}.`);
  } else if (priorityTopics.length > 0) {
    insights.push(`Your priority topics are ${formatTopicList(priorityTopics)}.`);
  }

  if (improvedTopics.length > 0) {
    insights.push(`Improvement is visible in ${formatTopicList(improvedTopics)}.`);
  }

  if (declinedTopics.length > 0) {
    insights.push(`Spend extra time on ${formatTopicList(declinedTopics)}.`);
  }

  if (suggestedGoal) {
    insights.push(`A realistic next target is ${suggestedGoal}.`);
  } else {
    insights.push(`Your current result stands at ${percentage}%.`);
  }

  return insights.slice(0, 4);
}

function extractTopicLabels(chapters) {
  if (!Array.isArray(chapters)) {
    return [];
  }

  return chapters
    .flatMap((chapter) => {
      const chapterName = String(chapter?.chapter_name || chapter?.chapter || "").trim();
      const subTopics = Array.isArray(chapter?.sub_topics)
        ? chapter.sub_topics.filter(Boolean)
        : [];

      if (!chapterName && subTopics.length === 0) {
        return [];
      }

      if (subTopics.length === 0) {
        return [chapterName];
      }

      return subTopics.map((subTopic) => `${chapterName} - ${subTopic}`);
    })
    .filter(Boolean);
}

function extractComparisonTopics(topics) {
  if (!Array.isArray(topics)) {
    return [];
  }

  return topics
    .map((topic) => {
      if (typeof topic === "string") {
        return topic.trim();
      }

      const chapterName = String(
        topic?.chapter_name || topic?.chapter || topic?.name || "",
      ).trim();
      const subTopicName = String(
        topic?.sub_topic || topic?.subtopic || topic?.topic || "",
      ).trim();

      if (chapterName && subTopicName) {
        return `${chapterName} - ${subTopicName}`;
      }

      return chapterName || subTopicName;
    })
    .filter(Boolean);
}

function formatTopicList(topics, maxItems = 3) {
  const uniqueTopics = [...new Set(topics)].slice(0, maxItems);

  if (uniqueTopics.length === 0) {
    return "your key topics";
  }

  if (uniqueTopics.length === 1) {
    return uniqueTopics[0];
  }

  if (uniqueTopics.length === 2) {
    return `${uniqueTopics[0]} and ${uniqueTopics[1]}`;
  }

  return `${uniqueTopics.slice(0, -1).join(", ")}, and ${uniqueTopics.at(-1)}`;
}

function normalizeGoalSelection(goalValue) {
  const parsedGoal = Number.parseInt(String(goalValue || "").replace("%", ""), 10);

  if (!Number.isInteger(parsedGoal)) {
    return null;
  }

  return parsedGoal;
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default StudentResult;
