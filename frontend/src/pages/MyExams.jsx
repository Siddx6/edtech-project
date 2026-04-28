import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ExternalLink, FileText } from "lucide-react";
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
import "./PortalPages.css";

function MyExams({ userRole }) {
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
  const [studentPapers, setStudentPapers] = useState([]);
  const [studentPapersLoading, setStudentPapersLoading] = useState(userRole !== "teacher");
  const [studentPapersError, setStudentPapersError] = useState(null);
  const [teacherPapers, setTeacherPapers] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(userRole === "teacher");
  const [teacherError, setTeacherError] = useState(null);

  useEffect(() => {
    if (userRole !== "teacher") {
      return;
    }

    const fetchPapers = async () => {
      try {
        setTeacherLoading(true);
        const papers = await getAllPapers();
        setTeacherPapers(papers);
        setTeacherError(null);
      } catch (error) {
        console.error("Error fetching teacher exams:", error);
        setTeacherPapers([]);
        setTeacherError(error.message || "Failed to load papers");
      } finally {
        setTeacherLoading(false);
      }
    };

    fetchPapers();
  }, [userRole]);

  useEffect(() => {
    if (userRole === "teacher" || currentStudent) {
      setStudentPapersLoading(false);
      setStudentPapersError(null);
      return;
    }

    let ignore = false;

    const fetchStudentPapers = async () => {
      try {
        setStudentPapersLoading(true);
        const papers = await getAllPapers();

        if (!ignore) {
          setStudentPapers(papers);
          setStudentPapersError(null);
        }
      } catch (fetchError) {
        console.error("Error fetching student papers:", fetchError);

        if (!ignore) {
          setStudentPapers([]);
          setStudentPapersError(fetchError.message || "Failed to load available papers");
        }
      } finally {
        if (!ignore) {
          setStudentPapersLoading(false);
        }
      }
    };

    fetchStudentPapers();

    return () => {
      ignore = true;
    };
  }, [currentStudent, userRole]);

  const handleDownload = async (paperId, fileName) => {
    try {
      const blob = await downloadPaperPDF(paperId);
      triggerPDFDownload(blob, fileName || "paper");
    } catch (error) {
      console.error("Error downloading paper:", error);
      alert("Failed to download this paper.");
    }
  };

  if (userRole === "teacher") {
    return (
      <div className="portal-page">
        <div className="portal-header">
          <div>
            <h1 className="portal-title">My Exams</h1>
            <p className="portal-subtitle">
              Review every generated paper in one place and jump back into download or preview flows.
            </p>
          </div>
        </div>

        {teacherLoading ? (
          <div className="portal-loading">Loading your generated papers...</div>
        ) : teacherError ? (
          <div className="portal-error">{teacherError}</div>
        ) : teacherPapers.length === 0 ? (
          <div className="portal-empty">
            No papers have been generated yet. Create one from the paper generation screen.
          </div>
        ) : (
          <Card className="portal-card">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Format</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teacherPapers.map((paper) => (
                  <tr key={paper._id}>
                    <td>{paper.title}</td>
                    <td>{paper.subject}</td>
                    <td>{paper.class}</td>
                    <td>
                      <Badge variant="success">PDF</Badge>
                    </td>
                    <td>{formatDate(paper.created_at)}</td>
                    <td>
                      <div className="portal-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(paper._id, paper.title)}
                        >
                          <Download size={16} /> Download
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            navigate("/paper-generated", {
                              state: {
                                paperData: {
                                  paperId: paper._id,
                                  downloadUrl: `/api/papers/${paper._id}/download`,
                                  paper_info: {
                                    exam_type: paper.exam_type,
                                    subject: paper.subject,
                                    class: paper.class,
                                    total_marks: paper.total_marks,
                                    num_questions: paper.num_questions,
                                    duration: paper.duration,
                                    format: "pdf",
                                  },
                                  questions: [],
                                },
                              },
                            })
                          }
                        >
                          <ExternalLink size={16} /> Open
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    );
  }

  const availablePapers = currentStudent
    ? overview?.available_papers || []
    : studentPapers;
  const examHistory = overview?.exam_history || [];
  const papersLoading = currentStudent ? overviewLoading : studentPapersLoading;
  const papersError = currentStudent ? overviewError : studentPapersError;

  return (
    <div className="portal-page">
      <div className="portal-header">
        <div>
          <h1 className="portal-title">My Exams</h1>
          <p className="portal-subtitle">
            Browse available papers for your class and review previously analyzed exams for the active student.
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

      {!currentStudent && (
        <div className="portal-empty">
          Your student profile will be created automatically after the first analyzed
          answer sheet. You can still browse papers below, and exam history will
          appear as soon as one answer sheet is checked.
        </div>
      )}

      <div className="portal-section">
        <h2 className="portal-section-title">Available Papers</h2>
        {papersLoading ? (
          <div className="portal-loading">Loading student exams...</div>
        ) : papersError ? (
          <div className="portal-error">{papersError}</div>
        ) : availablePapers.length === 0 ? (
          <div className="portal-empty">
            {currentStudent
              ? `No papers are available for ${currentStudent.class} yet.`
              : "No papers are available yet. Once an answer sheet is analyzed, your profile and history will appear automatically."}
          </div>
        ) : (
          <div className="portal-grid portal-grid-2">
            {availablePapers.map((paper) => (
              <Card key={paper._id} className="portal-card">
                <div className="portal-stack">
                  <div>
                    <h3 className="portal-list-title">{paper.title}</h3>
                    <p className="portal-list-subtitle">
                      {paper.subject} | {paper.total_marks} marks | {paper.duration}
                    </p>
                  </div>
                  <div className="portal-chip-row">
                    <span className="portal-chip">{paper.class}</span>
                    <span className="portal-chip">PDF</span>
                  </div>
                  <div className="portal-actions">
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(paper._id, paper.title)}
                    >
                      <Download size={16} /> Download
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/exam/${paper._id}`)}
                    >
                      <FileText size={16} /> Open PDF Workflow
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="portal-section">
        <h2 className="portal-section-title">Exam History</h2>
        {!currentStudent ? (
          <div className="portal-empty">
            Exam history will be created automatically after your first analyzed
            answer sheet.
          </div>
        ) : overviewLoading ? (
          <div className="portal-loading">Loading exam history...</div>
        ) : overviewError ? (
          <div className="portal-error">{overviewError}</div>
        ) : examHistory.length === 0 ? (
          <div className="portal-empty">
            No analyzed exams yet. Upload an answer sheet from the offline exam flow to build this history.
          </div>
        ) : (
          <Card className="portal-card">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Exam Type</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Focus</th>
                </tr>
              </thead>
              <tbody>
                {examHistory.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.subject}</td>
                    <td>{exam.exam_type}</td>
                    <td>
                      {exam.scored_marks ?? 0}/{exam.total_marks} ({exam.percentage ?? 0}%)
                    </td>
                    <td>{formatDate(exam.exam_date)}</td>
                    <td>{(exam.priority_topics || []).slice(0, 2).join(", ") || "Review weak chapters"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

export default MyExams;
