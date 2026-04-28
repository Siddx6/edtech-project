import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { formatDate, getStudentOverview, getStudents } from "../services/api";
import "./PortalPages.css";

function StudentsPage({ userRole }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedOverview, setSelectedOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    if (userRole !== "teacher") {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const studentList = await getStudents();
        setStudents(studentList);
        setSelectedStudentId(studentList[0]?.id || null);
        setError(null);
      } catch (fetchError) {
        console.error("Error fetching students page data:", fetchError);
        setStudents([]);
        setError(fetchError.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [userRole]);

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedOverview(null);
      return;
    }

    const fetchOverview = async () => {
      try {
        setOverviewLoading(true);
        const overview = await getStudentOverview(selectedStudentId);
        setSelectedOverview(overview);
      } catch (fetchError) {
        console.error("Error loading selected student overview:", fetchError);
        setSelectedOverview(null);
      } finally {
        setOverviewLoading(false);
      }
    };

    fetchOverview();
  }, [selectedStudentId]);

  if (userRole !== "teacher") {
    return (
      <div className="portal-page">
        <div className="portal-empty">
          Switch to teacher mode to view the student roster.
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-header">
        <div>
          <h1 className="portal-title">Students</h1>
          <p className="portal-subtitle">
            Track the student roster, see who has exam history, and inspect the latest focus areas for each learner.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="portal-loading">Loading students...</div>
      ) : error ? (
        <div className="portal-error">{error}</div>
      ) : students.length === 0 ? (
        <div className="portal-empty">
          No students are available yet. Analyze an exam or create a student from the student workspace.
        </div>
      ) : (
        <div className="portal-grid portal-grid-2">
          <Card className="portal-card">
            <h2 className="portal-section-title">Roster</h2>
            <div className="portal-list">
              {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className="portal-list-item"
                  onClick={() => setSelectedStudentId(student.id)}
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedStudentId === student.id ? "#eef2ff" : "var(--white)",
                  }}
                >
                  <div className="portal-list-main">
                    <span className="portal-list-title">
                      {student.name} | {student.class}
                    </span>
                    <span className="portal-list-subtitle">
                      {student.school} | {student.exam_count} exams
                    </span>
                  </div>
                  <Badge variant={student.latest_exam ? "success" : "warning"}>
                    {student.latest_exam ? `${student.average_percentage}% avg` : "No exams"}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card className="portal-card">
            <h2 className="portal-section-title">Student Details</h2>
            {overviewLoading ? (
              <div className="portal-loading">Loading student summary...</div>
            ) : !selectedOverview ? (
              <div className="portal-empty">Choose a student to inspect their progress.</div>
            ) : (
              <div className="portal-stack">
                <div className="portal-grid portal-grid-2">
                  <div className="portal-metric">
                    <span className="portal-metric-label">Average Score</span>
                    <span className="portal-metric-value">
                      {selectedOverview.summary.average_percentage}%
                    </span>
                  </div>
                  <div className="portal-metric">
                    <span className="portal-metric-label">Available Papers</span>
                    <span className="portal-metric-value">
                      {selectedOverview.summary.available_papers_count}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="portal-section-title">Latest Exam</h3>
                  {selectedOverview.latest_exam ? (
                    <div className="portal-list-item">
                      <div className="portal-list-main">
                        <span className="portal-list-title">
                          {selectedOverview.latest_exam.subject} | {selectedOverview.latest_exam.exam_type}
                        </span>
                        <span className="portal-list-subtitle">
                          {formatDate(selectedOverview.latest_exam.exam_date)} |{" "}
                          {selectedOverview.latest_exam.scored_marks}/
                          {selectedOverview.latest_exam.total_marks}
                        </span>
                      </div>
                      <Badge variant="info">
                        {selectedOverview.latest_exam.percentage ?? 0}%
                      </Badge>
                    </div>
                  ) : (
                    <div className="portal-empty">No exam result found for this student yet.</div>
                  )}
                </div>

                <div>
                  <h3 className="portal-section-title">Current Focus Topics</h3>
                  <div className="portal-chip-row">
                    {(selectedOverview.recommendations.priority_topics || []).length > 0 ? (
                      selectedOverview.recommendations.priority_topics.map((topic) => (
                        <span key={topic} className="portal-chip portal-chip-warning">
                          {topic}
                        </span>
                      ))
                    ) : (
                      <span className="portal-chip">No recommendation data yet</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default StudentsPage;
