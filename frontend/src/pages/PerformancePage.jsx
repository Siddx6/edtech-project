import React from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import StudentSelector from "../components/StudentSelector";
import useStudentWorkspace from "../hooks/useStudentWorkspace";
import useStudentOverview from "../hooks/useStudentOverview";
import { formatDate } from "../services/api";
import "./PortalPages.css";

function PerformancePage({ userRole }) {
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
          Switch to student mode to review performance history and score trends.
        </div>
      </div>
    );
  }

  const summary = overview?.summary || {};
  const performance = overview?.performance || {};
  const latestExam = overview?.latest_exam;
  const strongestSubject = performance.strongest_subject;

  return (
    <div className="portal-page">
      <div className="portal-header">
        <div>
          <h1 className="portal-title">Performance</h1>
          <p className="portal-subtitle">
            Track average scores, subject-wise performance, and recent exam progress for the active student.
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
        <div className="portal-loading">Loading performance insights...</div>
      ) : overviewError ? (
        <div className="portal-error">{overviewError}</div>
      ) : !currentStudent ? (
        <div className="portal-empty">
          Your student profile appears automatically after the first analyzed answer sheet. Performance insights will unlock after that analysis is saved.
        </div>
      ) : (
        <>
          <div className="portal-grid portal-grid-3">
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Average Score</span>
                <span className="portal-metric-value">{summary.average_percentage || 0}%</span>
                <span className="portal-metric-help">
                  Across {summary.exam_count || 0} analyzed exams
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Latest Exam</span>
                <span className="portal-metric-value">{summary.latest_percentage ?? "N/A"}%</span>
                <span className="portal-metric-help">
                  Improvement: {summary.improvement_from_previous ?? 0} points
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Strongest Subject</span>
                <span className="portal-metric-value">
                  {strongestSubject?.subject || "N/A"}
                </span>
                <span className="portal-metric-help">
                  {strongestSubject?.average_percentage ?? 0}% average
                </span>
              </div>
            </Card>
          </div>

          <div className="portal-grid portal-grid-2 portal-section">
            <Card className="portal-card">
              <h2 className="portal-section-title">Subject Breakdown</h2>
              {(performance.subject_breakdown || []).length === 0 ? (
                <div className="portal-empty">No subject performance data yet.</div>
              ) : (
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Exams</th>
                      <th>Average</th>
                      <th>Latest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.subject_breakdown.map((entry) => (
                      <tr key={entry.subject}>
                        <td>{entry.subject}</td>
                        <td>{entry.exam_count}</td>
                        <td>{entry.average_percentage}%</td>
                        <td>{entry.latest_percentage ?? "N/A"}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card className="portal-card">
              <h2 className="portal-section-title">Recent Score Trend</h2>
              {(performance.recent_scores || []).length === 0 ? (
                <div className="portal-empty">Recent score history will appear here.</div>
              ) : (
                <div className="portal-list">
                  {performance.recent_scores.map((entry) => (
                    <div key={entry.exam_id} className="portal-list-item">
                      <div className="portal-list-main">
                        <span className="portal-list-title">
                          {entry.subject} | {entry.exam_type}
                        </span>
                        <span className="portal-list-subtitle">
                          {formatDate(entry.exam_date)}
                        </span>
                      </div>
                      <Badge variant="info">{entry.percentage ?? 0}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="portal-section">
            <Card className="portal-card">
              <h2 className="portal-section-title">Latest Exam Snapshot</h2>
              {!latestExam ? (
                <div className="portal-empty">
                  Upload and analyze an exam to unlock topic-level snapshots.
                </div>
              ) : (
                <div className="portal-grid portal-grid-2">
                  <div className="portal-stack">
                    <div>
                      <span className="portal-label">Strong Topics</span>
                      <div className="portal-chip-row" style={{ marginTop: 10 }}>
                        {(latestExam.strong_chapters || []).length === 0 ? (
                          <span className="portal-chip">No strong topics recorded yet</span>
                        ) : (
                          latestExam.strong_chapters.map((chapter) => (
                            <span
                              key={chapter.chapter_name}
                              className="portal-chip portal-chip-success"
                            >
                              {chapter.chapter_name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="portal-stack">
                    <div>
                      <span className="portal-label">Weak Topics</span>
                      <div className="portal-chip-row" style={{ marginTop: 10 }}>
                        {(latestExam.weak_chapters || []).length === 0 ? (
                          <span className="portal-chip">No weak topics recorded yet</span>
                        ) : (
                          latestExam.weak_chapters.map((chapter) => (
                            <span
                              key={chapter.chapter_name}
                              className="portal-chip portal-chip-warning"
                            >
                              {chapter.chapter_name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default PerformancePage;
