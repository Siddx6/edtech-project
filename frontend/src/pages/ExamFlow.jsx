import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  Download,
  Loader,
  Upload,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import { useAppContext } from "../context/AppContext";
import {
  analyzeExam,
  downloadPaperPDF,
  getPaperById,
  triggerPDFDownload,
} from "../services/api";
import "./ExamFlow.css";

function ExamFlow() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { currentStudent, setCurrentStudent } = useAppContext();
  const [offlineStep, setOfflineStep] = useState(1);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingTime, setRemainingTime] = useState(3600);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [offlineSubmitError, setOfflineSubmitError] = useState(null);
  const [submittingOffline, setSubmittingOffline] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    if (offlineStep !== 2 || remainingTime <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRemainingTime((previousTime) => {
        if (previousTime <= 1) {
          clearInterval(timer);
          alert("Time is up. Please upload your completed answer sheet.");
          setOfflineStep(3);
          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [offlineStep, remainingTime]);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        const paper = await getPaperById(examId);

        const normalizedQuestions = Array.isArray(paper.questions)
          ? paper.questions.map((question, index) => ({
              id: question.question_no || index + 1,
              number: question.question_no || index + 1,
              text: question.question_text || question.text || "",
              marks: question.marks ?? question.marks_available ?? 0,
              options: Array.isArray(question.options) ? question.options : [],
            }))
          : [];

        setExam({
          id: paper._id,
          name: paper.title,
          subject: paper.subject,
          class: paper.class,
          totalMarks: paper.total_marks,
          duration: paper.duration,
          questions: normalizedQuestions,
        });
        setRemainingTime(parseDurationToSeconds(paper.duration));
        setError(null);
      } catch (fetchError) {
        console.error("Error fetching exam:", fetchError);
        setError(fetchError.message || "Failed to load exam");
        setExam(null);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleOfflineDownload = async () => {
    try {
      const blob = await downloadPaperPDF(exam.id);
      triggerPDFDownload(blob, exam.name || "paper");
      setOfflineStep(2);
      setOfflineSubmitError(null);
    } catch (downloadError) {
      console.error("Error downloading paper:", downloadError);
      setError(downloadError.message || "Failed to download paper");
    }
  };

  const handleFileUpload = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setUploadedFiles(nextFile ? [nextFile] : []);
    setOfflineSubmitError(null);
  };

  const handleOfflineSubmit = async () => {
    if (!exam) {
      setOfflineSubmitError("Exam details are missing. Reload and try again.");
      return;
    }

    if (uploadedFiles.length === 0) {
      setOfflineSubmitError("Upload your answer sheet before submitting.");
      return;
    }

    try {
      setSubmittingOffline(true);
      setOfflineSubmitError(null);

      const questionPaperBlob = await downloadPaperPDF(exam.id);
      const questionPaperFile = buildQuestionPaperFile(
        questionPaperBlob,
        exam.name,
      );
      const answerSheetFile = uploadedFiles[0];
      const formData = new FormData();

      formData.append("question_paper", questionPaperFile);
      formData.append("answer_sheet", answerSheetFile);

      // Use the actively selected student only as a fallback when the
      // uploaded answer sheet does not include identifiable student details.
      if (currentStudent?.name && currentStudent?.class) {
        formData.append("fallback_student_name", currentStudent.name);
        formData.append("fallback_student_class", currentStudent.class);

        if (currentStudent.school) {
          formData.append("fallback_student_school", currentStudent.school);
        }
      }

      const response = await analyzeExam(formData);
      const resultData = response.data || response;

      setAnalysisResult(resultData);

      if (resultData?.student_info?.name && resultData?.student_info?.class) {
        setCurrentStudent({
          id: resultData.student_id || null,
          name: resultData.student_info.name,
          class: resultData.student_info.class,
          school: resultData.student_info.school || "Unknown School",
        });
      }

      setOfflineStep(4);
    } catch (submitError) {
      console.error("Error analyzing answer sheet:", submitError);
      setOfflineSubmitError(
        submitError.message || "Failed to analyze the uploaded answer sheet.",
      );
    } finally {
      setSubmittingOffline(false);
    }
  };

  const handleViewResult = () => {
    navigate(`/result/${analysisResult?.exam_id || exam.id}`, {
      state: {
        resultData: analysisResult,
        examMeta: exam,
      },
    });
  };

  if (loading) {
    return (
      <div className="exam-flow-container">
        <Card className="loading-card">
          <div className="loading-content">
            <Loader size={48} className="loading-spinner" />
            <p>Loading exam...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-flow-container">
        <Card className="error-card">
          <p className="error-text">Error: {error}</p>
          <Button variant="primary" onClick={() => navigate("/")}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="exam-flow-container">
        <Card className="error-card">
          <p className="error-text">Exam data could not be loaded.</p>
          <Button variant="primary" onClick={() => navigate("/")}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="exam-flow-container">
      <div className="flow-stepper">
        <div className="steps">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`step ${
                step === offlineStep ? "active" : step < offlineStep ? "completed" : ""
              }`}
            >
              {step < offlineStep ? <CheckCircle size={24} /> : <span>{step}</span>}
            </div>
          ))}
        </div>
        <div className="step-labels">
          <span>Download</span>
          <span>Solve</span>
          <span>Upload</span>
          <span>Submitted</span>
        </div>
      </div>

      {offlineStep === 1 && (
        <Card className="flow-step-card">
          <div className="step-icon new">
            <Clock size={48} />
          </div>
          <h3 className="step-title">New PDF Exam Available</h3>
          <p className="step-desc">
            Your {exam.subject} paper is ready. Download the PDF, solve it on paper,
            and then upload your answer sheet for AI checking.
          </p>
          <div className="exam-details">
            <div className="detail-item">
              <span className="detail-label">Total Marks</span>
              <span className="detail-value">{exam.totalMarks}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{exam.duration}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Format</span>
              <span className="detail-value">PDF Paper</span>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleOfflineDownload}
          >
            <Download size={20} /> Download PDF Paper
          </Button>
        </Card>
      )}

      {offlineStep === 2 && (
        <Card className="flow-step-card">
          <div className="step-icon download">
            <Download size={48} />
          </div>
          <h3 className="step-title">Paper Downloaded</h3>
          <p className="step-desc">
            Great. The paper has been downloaded. Solve it on paper and upload a
            clear PDF or image of your answer sheet when you are done.
          </p>
          <div className="timer-display">
            <Clock size={32} className="timer-icon" />
            <span>{formatTime(remainingTime)}</span>
          </div>
          <p className="step-hint">
            Complete your exam and then continue to the upload step for checking.
          </p>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => setOfflineStep(3)}
          >
            Ready to Upload Answer Sheet
          </Button>
        </Card>
      )}

      {offlineStep === 3 && (
        <Card className="flow-step-card">
          <div className="step-icon solve">
            <Upload size={48} />
          </div>
          <h3 className="step-title">Upload Answer Sheet</h3>
          <p className="step-desc">
            Upload your completed answer sheet and we will compare it against the
            generated PDF paper.
          </p>
          <div className="upload-area">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              id="file-upload"
              style={{ display: "none" }}
            />
            <label htmlFor="file-upload" className="file-upload-label">
              <Upload size={40} />
              <p>Click to upload your answer sheet</p>
              <small>
                Supported formats: JPEG, PNG, WEBP, HEIC, HEIF, PDF (one file up to
                20 MB)
              </small>
            </label>
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-list">
                <p>
                  <strong>Selected File:</strong>
                </p>
                <ul>
                  {uploadedFiles.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {offlineSubmitError && (
            <p className="error-text" style={{ marginTop: 16 }}>
              {offlineSubmitError}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleOfflineSubmit}
            disabled={submittingOffline}
          >
            {submittingOffline ? "Analyzing Answer Sheet..." : "Upload and Submit"}
          </Button>
        </Card>
      )}

      {offlineStep === 4 && (
        <Card className="flow-step-card success">
          <div className="step-icon success">
            <CheckCircle size={48} />
          </div>
          <h3 className="step-title">Answer Sheet Checked</h3>
          <p className="step-desc">
            {analysisResult
              ? `Your paper has been analyzed. You scored ${analysisResult.total_scored}/${analysisResult.student_info?.total_marks || exam.totalMarks}.`
              : "Your answer sheet has been submitted successfully."}
          </p>
          {analysisResult && (
            <div className="success-message">
              <p>Analysis summary:</p>
              <ul>
                <li>Percentage: {analysisResult.percentage}%</li>
                <li>
                  Focus topics:{" "}
                  {(analysisResult.ai_recommendation?.priority_topics || [])
                    .slice(0, 3)
                    .join(", ") || "No urgent topics identified"}
                </li>
                <li>
                  Suggested goal:{" "}
                  {analysisResult.ai_recommendation?.suggested_goal || "Not available"}
                </li>
              </ul>
            </div>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleViewResult}
          >
            View Result
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate("/")}
          >
            Back to Dashboard
          </Button>
        </Card>
      )}
    </div>
  );
}

function buildQuestionPaperFile(blob, examName) {
  const safeName = sanitizeFileName(examName || "question-paper");
  return new File([blob], `${safeName}.pdf`, {
    type: blob.type || "application/pdf",
  });
}

function sanitizeFileName(value) {
  return (
    String(value || "paper")
      .trim()
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "paper"
  );
}

function parseDurationToSeconds(duration) {
  const normalizedDuration = String(duration || "").trim().toLowerCase();
  const durationValue = Number.parseFloat(normalizedDuration);

  if (!Number.isFinite(durationValue) || durationValue <= 0) {
    return 3600;
  }

  if (normalizedDuration.includes("minute")) {
    return Math.round(durationValue * 60);
  }

  return Math.round(durationValue * 60 * 60);
}

export default ExamFlow;
