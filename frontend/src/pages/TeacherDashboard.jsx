import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Download,
  Share2,
  Loader,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import StatCard from "../components/StatCard";
import {
  downloadPaperPDF,
  formatDate,
  getAllPapers,
  getTeacherAnalytics,
  triggerPDFDownload,
} from "../services/api";
import "./TeacherDashboard.css";

function TeacherDashboard() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [papersData, analyticsData] = await Promise.all([
          getAllPapers(),
          getTeacherAnalytics(),
        ]);
        setPapers(papersData);
        setAnalytics(analyticsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching teacher dashboard papers:", err);
        setPapers([]);
        setAnalytics(null);
        setError(err.message || "Failed to load papers");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const summary = analytics?.summary || {};

  const stats = [
    {
      title: "Total Exams Created",
      value: loading ? "..." : String(summary.total_papers ?? papers.length),
      icon: BookOpen,
      color: "primary",
    },
    {
      title: "Papers Generated",
      value: loading ? "..." : String(summary.total_papers ?? papers.length),
      icon: FileText,
      color: "success",
    },
    {
      title: "Students Enrolled",
      value: loading ? "..." : String(summary.total_students ?? 0),
      icon: Users,
      color: "info",
    },
    {
      title: "Avg Class Score",
      value: loading ? "..." : `${summary.average_score ?? 0}%`,
      icon: TrendingUp,
      color: "warning",
    },
  ];

  const recentExams = papers.slice(0, 5).map((paper) => ({
    id: paper._id,
    name: paper.title,
    exam_type: paper.exam_type,
    class: paper.class,
    subject: paper.subject,
    total_marks: paper.total_marks,
    num_questions: paper.num_questions,
    duration: paper.duration,
    format: "pdf",
    date: paper.created_at,
    status: "PDF",
  }));

  const handleGeneratePaper = () => {
    navigate("/generate-paper");
  };

  const handleDownload = async (paperId, title) => {
    try {
      const blob = await downloadPaperPDF(paperId);
      triggerPDFDownload(blob, title || "paper");
    } catch (downloadError) {
      console.error("Error downloading paper:", downloadError);
      alert("Unable to download this paper right now.");
    }
  };

  const handleShare = async (paper) => {
    const paperId = paper._id || paper.id;
    const paperTitle = paper.title || paper.name || "Exam Paper";
    const shareText = `${paperTitle} | ${paper.subject} | ${paper.class}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: paperTitle,
          text: shareText,
          url: `${window.location.origin}/exam/${paperId}`,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        alert("Paper details copied to clipboard.");
        return;
      }

      alert(shareText);
    } catch (shareError) {
      console.error("Error sharing paper:", shareError);
      alert("Unable to share this paper right now.");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <Card className="welcome-card no-hover">
          <div className="welcome-content">
            <div>
              <h2 className="welcome-title">Welcome back, Mrs. Sharma!</h2>
              <p className="welcome-subtitle">
                {loading
                  ? "Loading your latest papers..."
                  : `You have ${papers.length} generated papers ready to review`}
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={handleGeneratePaper}>
              <Plus size={20} /> Generate New Paper
            </Button>
          </div>
        </Card>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="section">
        <h3 className="section-title">Recent Exams</h3>
        <Card className="no-hover">
          {loading ? (
            <div className="loading-content" style={{ padding: "40px 0" }}>
              <Loader size={32} className="loading-spinner" />
              <p>Loading recent papers...</p>
            </div>
          ) : error ? (
            <div className="error-card" style={{ padding: "24px" }}>
              <p className="error-text">{error}</p>
            </div>
          ) : recentExams.length === 0 ? (
            <div className="empty-card" style={{ padding: "24px" }}>
              <p className="empty-text">No papers generated yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="exams-table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExams.map((exam) => (
                    <tr key={exam.id}>
                      <td className="exam-name">{exam.name}</td>
                      <td>{exam.class}</td>
                      <td>{exam.subject}</td>
                      <td>{formatDate(exam.date)}</td>
                      <td>
                        <Badge variant="success">{exam.status}</Badge>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn"
                          title="View"
                          onClick={() =>
                            navigate("/paper-generated", {
                              state: {
                                paperData: {
                                  paperId: exam.id,
                                  downloadUrl: `/api/papers/${exam.id}/download`,
                                  paper_info: {
                                    exam_type: exam.exam_type,
                                    subject: exam.subject,
                                    class: exam.class,
                                    total_marks: exam.total_marks,
                                    num_questions: exam.num_questions,
                                    duration: exam.duration,
                                    format: exam.format,
                                  },
                                  questions: [],
                                },
                              },
                            })
                          }
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="action-btn"
                          title="Download"
                          onClick={() => handleDownload(exam.id, exam.name)}
                        >
                          <Download size={18} />
                        </button>
                        <button
                          className="action-btn"
                          title="Share"
                          onClick={() =>
                            handleShare(
                              papers.find((paper) => paper._id === exam.id) || exam,
                            )
                          }
                        >
                          <Share2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default TeacherDashboard;
