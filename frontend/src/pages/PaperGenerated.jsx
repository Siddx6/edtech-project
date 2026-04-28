import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Download, Share2, RotateCcw } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { downloadPaperPDF, triggerPDFDownload } from "../services/api";
import "./PaperGenerated.css";

function PaperGenerated() {
  const location = useLocation();
  const navigate = useNavigate();
  const { paperData } = location.state || {};
  const paperId = paperData?.paperId || paperData?.data?.paperId || null;
  const downloadUrl =
    paperData?.downloadUrl ||
    paperData?.data?.downloadUrl ||
    (paperId ? `/api/papers/${paperId}/download` : null);

  if (!paperData) {
    return (
      <div className="paper-generated-container">
        <Card>
          <p>No paper data found. Please generate a paper first.</p>
          <Button variant="primary" onClick={() => navigate("/generate-paper")}>
            Go to Generate Paper
          </Button>
        </Card>
      </div>
    );
  }

  const paper = paperData.data?.paper_info || paperData.paper_info || {};
  const questions = paperData.data?.questions || paperData.questions || [];

  const handleDownload = async () => {
    if (!paperId) {
      if (downloadUrl) {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
        return;
      }

      alert("Paper download link is not available yet.");
      return;
    }

    try {
      const blob = await downloadPaperPDF(paperId);
      const fileName =
        [paper.exam_type, paper.subject, paper.class]
          .filter(Boolean)
          .join("_") || "paper";
      triggerPDFDownload(blob, fileName);
    } catch (error) {
      console.error("Error downloading paper:", error);
      alert("Failed to download paper. Please try again.");
    }
  };

  const handleShare = async () => {
    const shareUrl = downloadUrl ? `${window.location.origin}${downloadUrl}` : window.location.href;
    const shareText = `${paper.exam_type || "Exam"} - ${paper.subject || "Paper"}${downloadUrl ? `\nDownload: ${shareUrl}` : ""}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: paper.title || "Generated Paper",
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        alert("Paper details copied to clipboard.");
        return;
      }

      alert(shareText);
    } catch (error) {
      console.error("Error sharing paper:", error);
      alert("Unable to share this paper right now.");
    }
  };

  const handleRegenerate = () => {
    navigate("/generate-paper");
  };

  return (
    <div className="paper-generated-container">
      {/* Success Banner */}
      <div className="success-banner">
        <CheckCircle size={64} className="success-icon" />
        <h1 className="success-title">Paper Generated Successfully! 🎉</h1>
        <p className="success-message">
          Your PDF exam paper has been created and is ready to use
        </p>
      </div>

      {/* Paper Preview Card */}
      <Card className="preview-card">
        {/* Paper Header */}
        <div className="paper-header">
          <div className="paper-meta">
            <h2 className="paper-title">
              {paper.exam_type} — {paper.subject} — {paper.class}
            </h2>
            <Button variant="secondary" size="sm">
              <Badge variant="success">Generated</Badge>
            </Button>
          </div>
        </div>

        {/* Paper Metadata */}
        <div className="metadata-grid">
          <div className="metadata-item">
            <span className="meta-label">Total Marks</span>
            <span className="meta-value">{paper.total_marks} marks</span>
          </div>
          <div className="metadata-item">
            <span className="meta-label">Duration</span>
            <span className="meta-value">{paper.duration}</span>
          </div>
          <div className="metadata-item">
            <span className="meta-label">Number of Questions</span>
            <span className="meta-value">
              {questions.length || paper.num_questions}
            </span>
          </div>
          <div className="metadata-item">
            <span className="meta-label">Format</span>
            <span className="meta-value">PDF</span>
          </div>
        </div>

        {/* Chapters Covered */}
        {paper.chapters_covered && paper.chapters_covered.length > 0 && (
          <div className="chapters-covered">
            <h4 className="chapters-title">Chapters Covered</h4>
            <div className="chapters-tags">
              {paper.chapters_covered.map((chapter) => (
                <Badge key={chapter} variant="primary">
                  {chapter}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            className="action-btn"
          >
            <Download size={20} /> Download PDF
          </Button>
          <Button
            variant="info"
            size="lg"
            onClick={handleShare}
            className="action-btn"
          >
            <Share2 size={20} /> Share with Students
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleRegenerate}
            className="action-btn"
          >
            <RotateCcw size={20} /> Regenerate
          </Button>
        </div>
      </Card>

      {/* Questions Preview */}
      {questions.length > 0 && (
        <Card className="questions-preview">
          <h3 className="section-title">Paper Preview (First 3 Questions)</h3>
          <div className="questions-list">
            {questions.slice(0, 3).map((question, index) => (
              <div key={index} className="question-preview">
                <div className="question-header">
                  <span className="question-number">
                    Q{question.question_no}
                  </span>
                  <span className="question-marks">
                    [{question.marks} marks]
                  </span>
                </div>
                <p className="question-text">{question.question_text}</p>
                {question.options && (
                  <div className="options-list">
                    {question.options.map((option, idx) => (
                      <div key={idx} className="option-item">
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info Section */}
      <Card className="info-card">
        <div className="info-content">
          <h4 className="info-title">✨ Paper Added Successfully</h4>
          <p className="info-text">
            This exam has been added to the Student Dashboard as a new exam to
            appear in. Students can now download the paper and submit their answer
            sheet for checking.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default PaperGenerated;
