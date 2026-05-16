import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, X, AlertCircle } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import { generatePaper } from "../services/api";
import "./GenerateTestPaper.css";

function GenerateTestPaper() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    examType: "",
    subject: "",
    class: "",
    chapters: [],
    totalMarks: "",
    numQuestions: "",
    duration: "",
  });

  const [chapterInput, setChapterInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const examTypes = ["UT-1", "UT-2", "Mid-Term", "Final Exam", "Sessional Exam"];
  const classes = [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
  ];
  const durations = ["1 Hour", "1.5 Hours", "2 Hours", "3 Hours"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addChapter = () => {
    if (
      chapterInput.trim() &&
      !formData.chapters.includes(chapterInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        chapters: [...prev.chapters, chapterInput.trim()],
      }));
      setChapterInput("");
    }
  };

  const removeChapter = (chapter) => {
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((c) => c !== chapter),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChapter();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (
      !formData.examType ||
      !formData.subject ||
      !formData.class ||
      !formData.chapters.length ||
      !formData.totalMarks ||
      !formData.duration
    ) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      // Call API using centralized service
      const data = await generatePaper({
        exam_type: formData.examType,
        subject: formData.subject,
        class: formData.class,
        chapters: formData.chapters,
        total_marks: parseInt(formData.totalMarks),
        num_questions: formData.numQuestions
          ? parseInt(formData.numQuestions)
          : undefined,
        duration: formData.duration,
      });

      // Navigation with paper data
      navigate("/paper-generated", { state: { paperData: data } });
    } catch (err) {
      console.error("Error generating paper:", err);
      setError(err.message || "Failed to generate paper. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generate-paper-container">
      <div className="page-header">
        <h1 className="page-title">Generate Test Paper</h1>
        <p className="page-subtitle">
          Create a new PDF exam paper using AI assistance
        </p>
      </div>

      <Card className="form-card">
        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && <div className="loading-overlay"></div>}

        <form onSubmit={handleSubmit} className="generate-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="examType" className="form-label">
                Exam Type <span className="required">*</span>
              </label>
              <select
                id="examType"
                name="examType"
                value={formData.examType}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select exam type...</option>
                {examTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject" className="form-label">
                Subject <span className="required">*</span>
              </label>
              <input
                id="subject"
                type="text"
                name="subject"
                placeholder="e.g., Mathematics, Physics, Hindi"
                value={formData.subject}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="class" className="form-label">
                Class / Standard <span className="required">*</span>
              </label>
              <select
                id="class"
                name="class"
                value={formData.class}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select class...</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duration" className="form-label">
                Duration <span className="required">*</span>
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select duration...</option>
                {durations.map((dur) => (
                  <option key={dur} value={dur}>
                    {dur}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Chapters / Topics <span className="required">*</span>
            </label>
            <div className="chapter-input-group">
              <input
                type="text"
                placeholder="Enter chapter name and press Enter or click Add"
                value={chapterInput}
                onChange={(e) => setChapterInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-input"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addChapter}
                size="md"
              >
                Add
              </Button>
            </div>
            <div className="chapters-list">
              {formData.chapters.map((chapter) => (
                <div key={chapter} className="chapter-tag">
                  <span>{chapter}</span>
                  <button
                    type="button"
                    onClick={() => removeChapter(chapter)}
                    className="remove-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalMarks" className="form-label">
                Total Marks <span className="required">*</span>
              </label>
              <input
                id="totalMarks"
                type="number"
                name="totalMarks"
                placeholder="e.g., 25, 80"
                value={formData.totalMarks}
                onChange={handleInputChange}
                className="form-input"
                min="1"
                max="80"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="numQuestions" className="form-label">
                Number of Questions
              </label>
              <input
                id="numQuestions"
                type="number"
                name="numQuestions"
                placeholder="Leave empty for auto (optional)"
                value={formData.numQuestions}
                onChange={handleInputChange}
                className="form-input"
                min="1"
                max="40"
              />
            </div>
          </div>

          <div className="info-note">
            <Zap size={16} />
            <span>
              Paper will be generated as a PDF using AI based on CBSE/NCERT
              curriculum
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
          >
            {loading ? "Generating Paper..." : "Generate Paper with AI"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default GenerateTestPaper;
