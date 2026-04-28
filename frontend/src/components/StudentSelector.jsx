import React, { useState } from "react";
import Button from "./Button";

function StudentSelector({
  students = [],
  loading = false,
  creating = false,
  error = null,
  currentStudent = null,
  onSelectStudent,
  onCreateStudent,
  title = "Student Workspace",
  subtitle = "Student profiles are created automatically after the first analyzed answer sheet. Leave this empty to browse papers without locking to one student, or create/select one only when you want a fallback identity.",
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    class: "Class 10",
    school: "",
  });
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.class.trim() || !formData.school.trim()) {
      setFormError("Name, class, and school are required.");
      return;
    }

    try {
      await onCreateStudent({
        name: formData.name.trim(),
        class: formData.class.trim(),
        school: formData.school.trim(),
      });

      setFormData({
        name: "",
        class: formData.class,
        school: "",
      });
      setShowCreateForm(false);
    } catch (createError) {
      setFormError(createError.message || "Failed to create student.");
    }
  };

  return (
    <div className="portal-selector-card">
      <div className="portal-selector-header">
        <div>
          <h3 className="portal-selector-title">{title}</h3>
          <p className="portal-selector-subtitle">{subtitle}</p>
        </div>
        <Button
          type="button"
          variant={showCreateForm ? "secondary" : "primary"}
          onClick={() => setShowCreateForm((value) => !value)}
        >
          {showCreateForm ? "Hide Form" : "Create Manually"}
        </Button>
      </div>

      <div className="portal-selector-controls">
        <label className="portal-label" htmlFor="student-selector">
          Active Student (Optional)
        </label>
        <select
          id="student-selector"
          className="portal-select"
          value={currentStudent?.id || ""}
          onChange={(event) => onSelectStudent(event.target.value)}
          disabled={loading || students.length === 0}
        >
          {students.length === 0 ? (
            <option value="">
              {loading ? "Loading students..." : "No student profile yet"}
            </option>
          ) : (
            <>
              <option value="">No active student selected</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} | {student.class}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {(error || formError) && <p className="portal-error-text">{formError || error}</p>}

      {showCreateForm && (
        <form className="portal-create-form" onSubmit={handleSubmit}>
          <div className="portal-form-grid">
            <input
              className="portal-input"
              type="text"
              placeholder="Student name"
              value={formData.name}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />
            <select
              className="portal-select"
              value={formData.class}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  class: event.target.value,
                }))
              }
            >
              {[
                "Class 6",
                "Class 7",
                "Class 8",
                "Class 9",
                "Class 10",
                "Class 11",
                "Class 12",
              ].map((studentClass) => (
                <option key={studentClass} value={studentClass}>
                  {studentClass}
                </option>
              ))}
            </select>
            <input
              className="portal-input"
              type="text"
              placeholder="School name"
              value={formData.school}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  school: event.target.value,
                }))
              }
            />
          </div>
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? "Creating..." : "Create Student Manually"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default StudentSelector;
