import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import StudentSelector from "../components/StudentSelector";
import useStudentWorkspace from "../hooks/useStudentWorkspace";
import useStudentOverview from "../hooks/useStudentOverview";
import "./PortalPages.css";

function RecommendationsPage({ userRole }) {
  const navigate = useNavigate();
  const {
    students,
    loading: studentLoading,
    error: studentError,
    creating,
    currentStudent,
    selectStudent,
    createStudentProfile,
  } = useStudentWorkspace();
  const {
    overview,
    loading: overviewLoading,
    error: overviewError,
  } = useStudentOverview(currentStudent?.id);

  if (userRole !== "student") {
    return (
      <div className="portal-page">
        <div className="portal-empty">
          Switch to student mode to view AI recommendations and focus topics.
        </div>
      </div>
    );
  }

  const recommendations = overview?.recommendations || {};
  const topicHealth = overview?.topic_health || [];
  const latestExam = overview?.latest_exam;

  return (
    <div className="portal-page">
      <div className="portal-header">
        <div>
          <h1 className="portal-title">Recommendations</h1>
          <p className="portal-subtitle">
            Use AI-generated focus areas, goal suggestions, and topic health signals to guide the next revision session.
          </p>
        </div>
      </div>

      <StudentSelector
        students={students}
        loading={studentLoading}
        creating={creating}
        error={studentError}
        currentStudent={currentStudent}
        onSelectStudent={selectStudent}
        onCreateStudent={createStudentProfile}
      />

      {studentLoading && !currentStudent ? (
        <div className="portal-loading">Loading student profiles...</div>
      ) : overviewLoading ? (
        <div className="portal-loading">Loading recommendations...</div>
      ) : overviewError ? (
        <div className="portal-error">{overviewError}</div>
      ) : !currentStudent ? (
        <div className="portal-empty">
          Your student profile appears automatically after the first analyzed answer sheet. AI recommendations will unlock after that analysis is saved.
        </div>
      ) : (
        <>
          <div className="portal-grid portal-grid-3">
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Suggested Goal</span>
                <span className="portal-metric-value">
                  {recommendations.suggested_goal || "N/A"}
                </span>
                <span className="portal-metric-help">
                  Based on the most recent analyzed exam
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Priority Topics</span>
                <span className="portal-metric-value">
                  {(recommendations.priority_topics || []).length}
                </span>
                <span className="portal-metric-help">
                  Topics to revise first before the next exam
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Weak Topics</span>
                <span className="portal-metric-value">
                  {(recommendations.weak_topics || []).length}
                </span>
                <span className="portal-metric-help">
                  Derived from analyzed chapter-level performance
                </span>
              </div>
            </Card>
          </div>

          <div className="portal-section">
            <Card className="portal-card">
              <h2 className="portal-section-title">AI Guidance</h2>
              <p>
                {recommendations.history_feedback ||
                  "Analyze an exam to unlock personalized guidance for this student."}
              </p>
              <div className="portal-actions" style={{ marginTop: 16 }}>
                <Button
                  variant="primary"
                  onClick={() =>
                    navigate("/quiz", {
                      state: {
                        preferredSubject: latestExam?.subject || overview?.summary?.subjects?.[0],
                      },
                    })
                  }
                >
                  Open Revision Quiz
                </Button>
              </div>
            </Card>
          </div>

          <div className="portal-grid portal-grid-2 portal-section">
            <Card className="portal-card">
              <h2 className="portal-section-title">Priority Topics</h2>
              <div className="portal-chip-row">
                {(recommendations.priority_topics || []).length === 0 ? (
                  <span className="portal-chip">No priority topics yet</span>
                ) : (
                  recommendations.priority_topics.map((topic) => (
                    <span key={topic} className="portal-chip portal-chip-warning">
                      {topic}
                    </span>
                  ))
                )}
              </div>
            </Card>

            <Card className="portal-card">
              <h2 className="portal-section-title">Weak Topics</h2>
              <div className="portal-chip-row">
                {(recommendations.weak_topics || []).length === 0 ? (
                  <span className="portal-chip">No weak topics yet</span>
                ) : (
                  recommendations.weak_topics.map((topic) => (
                    <span key={topic} className="portal-chip portal-chip-warning">
                      {topic}
                    </span>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="portal-section">
            <Card className="portal-card">
              <h2 className="portal-section-title">Topic Health</h2>
              {topicHealth.length === 0 ? (
                <div className="portal-empty">
                  Topic health data will appear here after analyzed exams are processed.
                </div>
              ) : (
                <div className="portal-list">
                  {topicHealth.flatMap((subjectEntry) =>
                    (subjectEntry.topic_health || []).map((chapter) => {
                      const crystalClearCount = (chapter.sub_topics || []).filter(
                        (subTopic) => subTopic.status === "crystal_clear",
                      ).length;
                      const partialCount = (chapter.sub_topics || []).filter(
                        (subTopic) => subTopic.status === "partial_understanding",
                      ).length;
                      const noKnowledgeCount = (chapter.sub_topics || []).filter(
                        (subTopic) => subTopic.status === "no_knowledge",
                      ).length;

                      return (
                        <div
                          key={`${subjectEntry.subject}-${chapter.chapter_name}`}
                          className="portal-list-item"
                        >
                          <div className="portal-list-main">
                            <span className="portal-list-title">
                              {subjectEntry.subject} | {chapter.chapter_name}
                            </span>
                            <span className="portal-list-subtitle">
                              {crystalClearCount} clear, {partialCount} partial, {noKnowledgeCount} gaps
                            </span>
                          </div>
                          <div className="portal-chip-row">
                            {noKnowledgeCount > 0 && (
                              <span className="portal-chip portal-chip-warning">
                                {noKnowledgeCount} needs attention
                              </span>
                            )}
                            {partialCount > 0 && (
                              <span className="portal-chip">
                                {partialCount} building
                              </span>
                            )}
                            {crystalClearCount > 0 && (
                              <span className="portal-chip portal-chip-success">
                                {crystalClearCount} strong
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }),
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default RecommendationsPage;
