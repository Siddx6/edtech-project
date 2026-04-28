import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  FileText,
  Loader,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import StudentSelector from "../components/StudentSelector";
import useStudentWorkspace from "../hooks/useStudentWorkspace";
import useStudentOverview from "../hooks/useStudentOverview";
import {
  downloadPaperPDF,
  formatDate,
  getAllPapers,
  triggerPDFDownload,
} from "../services/api";
import "./StudentDashboard.css";
import "./PortalPages.css";

function StudentDashboard() {
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
  const [fallbackPapers, setFallbackPapers] = useState([]);
  const [fallbackLoading, setFallbackLoading] = useState(true);
  const [fallbackError, setFallbackError] = useState(null);

  useEffect(() => {
    if (currentStudent) {
      setFallbackLoading(false);
      setFallbackError(null);
      return;
    }

    let ignore = false;

    const fetchFallbackPapers = async () => {
      try {
        setFallbackLoading(true);
        const papers = await getAllPapers();

        if (!ignore) {
          setFallbackPapers(papers);
          setFallbackError(null);
        }
      } catch (fetchError) {
        console.error("Error loading fallback papers:", fetchError);

        if (!ignore) {
          setFallbackPapers([]);
          setFallbackError(fetchError.message || "Failed to load papers");
        }
      } finally {
        if (!ignore) {
          setFallbackLoading(false);
        }
      }
    };

    fetchFallbackPapers();

    return () => {
      ignore = true;
    };
  }, [currentStudent]);

  const handleDownloadPDF = async (paperId, title) => {
    try {
      const blob = await downloadPaperPDF(paperId);
      triggerPDFDownload(blob, title || "paper");
    } catch (error) {
      console.error("Error downloading paper:", error);
      alert("Failed to download paper. Please try again.");
    }
  };

  const handleOpenPaperWorkflow = (paperId) => {
    navigate(`/exam/${paperId}`);
  };

  const availablePapers = currentStudent
    ? overview?.available_papers || []
    : fallbackPapers;
  const performance = overview?.performance || {};
  const recommendations = overview?.recommendations || {};
  const summary = overview?.summary || {};

  return (
    <div className="student-dashboard-container">
      <div className="welcome-section">
        <Card className="welcome-card no-hover">
          <div className="welcome-content">
            <h2 className="welcome-title">
              Hello, {currentStudent?.name || "Student"}! Ready to learn today?
            </h2>
            <p className="welcome-subtitle">
              {currentStudent
                ? `${availablePapers.length} papers are ready for ${currentStudent.class}`
                : "Your student profile will appear automatically after the first analyzed answer sheet"}
            </p>
          </div>
        </Card>
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
        <Card className="loading-card">
          <div className="loading-content">
            <Loader size={32} className="loading-spinner" />
            <p>Loading student profiles...</p>
          </div>
        </Card>
      ) : currentStudent && overviewLoading ? (
        <Card className="loading-card">
          <div className="loading-content">
            <Loader size={32} className="loading-spinner" />
            <p>Loading student dashboard...</p>
          </div>
        </Card>
      ) : currentStudent && overviewError ? (
        <Card className="error-card">
          <p className="error-text">{overviewError}</p>
        </Card>
      ) : !currentStudent && fallbackLoading ? (
        <Card className="loading-card">
          <div className="loading-content">
            <Loader size={32} className="loading-spinner" />
            <p>Loading available papers...</p>
          </div>
        </Card>
      ) : !currentStudent && fallbackError ? (
        <Card className="error-card">
          <p className="error-text">{fallbackError}</p>
        </Card>
      ) : !currentStudent ? (
        <>
          <div
            className="portal-grid portal-grid-3"
            style={{ marginBottom: 32 }}
          >
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Available Papers</span>
                <span className="portal-metric-value">
                  {availablePapers.length}
                </span>
                <span className="portal-metric-help">
                  Ready to attempt right away
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Student Profile</span>
                <span className="portal-metric-value">Auto</span>
                <span className="portal-metric-help">
                  Created after the first analyzed answer sheet
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Insights</span>
                <span className="portal-metric-value">Soon</span>
                <span className="portal-metric-help">
                  Performance and recommendations unlock after analysis
                </span>
              </div>
            </Card>
          </div>

          <div className="section">
            <h3 className="section-title">Available Papers</h3>
            {availablePapers.length === 0 ? (
              <Card className="empty-card">
                <p className="empty-text">
                  No papers are available yet.
                </p>
              </Card>
            ) : (
              <div className="exams-grid">
                {availablePapers.map((paper) => (
                  <Card key={paper._id} className="exam-card">
                    <div className="exam-content">
                      <div className="exam-info">
                        <h4 className="exam-name">{paper.title}</h4>
                        <p className="exam-subject">{paper.subject}</p>
                        <p className="exam-date">
                          {formatDate(paper.created_at)}
                        </p>
                        <p className="exam-meta">
                          {paper.total_marks} marks | {paper.duration}
                        </p>
                      </div>
                      <Badge variant="success">{paper.class}</Badge>
                    </div>
                    <div className="exam-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        className="action-btn"
                        onClick={() =>
                          handleDownloadPDF(paper._id, paper.title)
                        }
                      >
                        <Download size={16} /> Download PDF
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        className="action-btn"
                        onClick={() => handleOpenPaperWorkflow(paper._id)}
                      >
                        <FileText size={16} /> Open PDF Workflow
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card className="recommendation-card">
            <div className="recommendation-header">
              <Target size={24} className="recommendation-icon" />
              <h3 className="recommendation-title">What Happens Next</h3>
            </div>
            <div className="recommendation-content">
              <p className="recommendation-text">
                Once you upload an answer sheet and it gets analyzed, we will
                extract the student details automatically and unlock
                performance trends, recommendations, and revision quizzes.
              </p>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div
            className="portal-grid portal-grid-3"
            style={{ marginBottom: 32 }}
          >
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Available Papers</span>
                <span className="portal-metric-value">
                  {availablePapers.length}
                </span>
                <span className="portal-metric-help">
                  Assigned to {currentStudent.class}
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Average Score</span>
                <span className="portal-metric-value">
                  {summary.average_percentage || 0}%
                </span>
                <span className="portal-metric-help">
                  Across {summary.exam_count || 0} analyzed exams
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Target Goal</span>
                <span className="portal-metric-value">
                  {recommendations.suggested_goal || "N/A"}
                </span>
                <span className="portal-metric-help">
                  Suggested from the latest result
                </span>
              </div>
            </Card>
          </div>

          <div className="section">
            <h3 className="section-title">Available Papers</h3>
            {availablePapers.length === 0 ? (
              <Card className="empty-card">
                <p className="empty-text">
                  No papers are available for this class yet. Check back soon.
                </p>
              </Card>
            ) : (
              <div className="exams-grid">
                {availablePapers.map((paper) => (
                  <Card key={paper._id} className="exam-card">
                    <div className="exam-content">
                      <div className="exam-info">
                        <h4 className="exam-name">{paper.title}</h4>
                        <p className="exam-subject">{paper.subject}</p>
                        <p className="exam-date">
                          {formatDate(paper.created_at)}
                        </p>
                        <p className="exam-meta">
                          {paper.total_marks} marks | {paper.duration}
                        </p>
                      </div>
                      <Badge variant="success">Available</Badge>
                    </div>
                    <div className="exam-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        className="action-btn"
                        onClick={() =>
                          handleDownloadPDF(paper._id, paper.title)
                        }
                      >
                        <Download size={16} /> Download PDF
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        className="action-btn"
                        onClick={() => handleOpenPaperWorkflow(paper._id)}
                      >
                        <FileText size={16} /> Open PDF Workflow
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="performance-section">
            <h3 className="section-title">Performance Summary</h3>
            <Card className="performance-card no-hover">
              {(performance.subject_breakdown || []).length === 0 ? (
                <p className="empty-text">
                  Upload and analyze an exam to unlock score trends.
                </p>
              ) : (
                <div className="performance-chart">
                  <div className="score-display">
                    <div className="average-score">
                      <span className="score-number">
                        {summary.average_percentage || 0}%
                      </span>
                      <span className="score-label">Average</span>
                    </div>
                  </div>

                  <div className="score-details">
                    {performance.subject_breakdown.map((item) => {
                      const progressWidth = Math.min(
                        item.average_percentage || 0,
                        100,
                      );

                      return (
                        <div key={item.subject} className="score-item">
                          <span className="score-name">{item.subject}</span>
                          <div className="score-bar">
                            <div
                              className="score-progress"
                              style={{
                                width: `${progressWidth}%`,
                                backgroundColor:
                                  progressWidth >= 75
                                    ? "var(--success-color)"
                                    : progressWidth >= 50
                                      ? "var(--warning-color)"
                                      : "var(--danger-color)",
                              }}
                            />
                          </div>
                          <span className="score-value">
                            {item.average_percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="portal-actions" style={{ marginTop: 20 }}>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/performance")}
                >
                  <TrendingUp size={16} /> View Performance
                </Button>
              </div>
            </Card>
          </div>

          <Card className="recommendation-card">
            <div className="recommendation-header">
              <Target size={24} className="recommendation-icon" />
              <h3 className="recommendation-title">AI Recommendations</h3>
            </div>
            <div className="recommendation-content">
              <p className="recommendation-text">
                {recommendations.history_feedback ||
                  "Analyze a recent exam to get personalized next steps."}
              </p>
              <div className="portal-actions">
                <Button
                  variant="primary"
                  onClick={() =>
                    navigate("/quiz", {
                      state: {
                        preferredSubject:
                          overview?.latest_exam?.subject ||
                          overview?.summary?.subjects?.[0],
                      },
                    })
                  }
                >
                  <Zap size={16} /> Revision Quiz
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/recommendations")}
                >
                  <Target size={16} /> View Plan
                </Button>
              </div>
            </div>
            <div className="portal-chip-row" style={{ marginTop: 20 }}>
              {(recommendations.priority_topics || []).length === 0 ? (
                <span className="portal-chip">No focus topics yet</span>
              ) : (
                recommendations.priority_topics.slice(0, 4).map((topic) => (
                  <span key={topic} className="portal-chip portal-chip-warning">
                    {topic}
                  </span>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default StudentDashboard;
