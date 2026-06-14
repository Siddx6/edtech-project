import React, { useEffect, useState } from "react";
import "./AdminPage.css";

function AdminPage() {
  const [activeTab, setActiveTab] = useState("teachers");
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher",
    class: "",
    subject: "",
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const usersRes = await fetch("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();

      if (!usersData.success) {
        setError(usersData.message);
        return;
      }

      setTeachers(usersData.data.filter((u) => u.role === "teacher"));
      setStudents(usersData.data.filter((u) => u.role === "student"));
      setError(null);
    } catch (err) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setFormError(data.message);
        return;
      }

      setShowForm(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "teacher",
        class: "",
        subject: "",
      });
      fetchData();
    } catch (err) {
      setFormError("Something went wrong.");
    } finally {
      setFormLoading(false);
    }
  };

  const getClassSummary = () => {
    const classCounts = {};
    students.forEach((student) => {
      const cls = student.class || "Unknown";
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    });
    return Object.entries(classCounts).sort((a, b) => a[0].localeCompare(b[0]));
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <button
          className="admin-add-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h2 className="admin-form-title">Add New User</h2>
          {formError && <div className="admin-error">{formError}</div>}
          <form onSubmit={handleAddUser} className="admin-form">
            <input
              className="admin-input"
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
            <input
              className="admin-input"
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleFormChange}
              required
            />
            <input
              className="admin-input"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleFormChange}
              required
            />
            <select
              className="admin-input"
              name="role"
              value={formData.role}
              onChange={handleFormChange}
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>

            {formData.role === "teacher" && (
              <>
                <input
                  className="admin-input"
                  type="text"
                  name="subject"
                  placeholder="Subject (e.g. Math, Science)"
                  value={formData.subject}
                  onChange={handleFormChange}
                />
                <input
                  className="admin-input"
                  type="text"
                  name="class"
                  placeholder="Class (e.g. 6, 7, 8)"
                  value={formData.class}
                  onChange={handleFormChange}
                />
              </>
            )}

            {formData.role === "student" && (
              <input
                className="admin-input"
                type="text"
                name="class"
                placeholder="Class (e.g. 6, 7, 8)"
                value={formData.class}
                onChange={handleFormChange}
              />
            )}

            <button
              className="admin-submit-btn"
              type="submit"
              disabled={formLoading}
            >
              {formLoading ? "Adding..." : "Add User"}
            </button>
          </form>
        </div>
      )}

      {students.length > 0 && (
        <div className="admin-class-summary">
          <h2 className="admin-form-title">Students per Class</h2>
          <div className="admin-class-cards">
            {getClassSummary().map(([cls, count]) => (
              <div key={cls} className="admin-class-card">
                <span className="admin-class-label">Class {cls}</span>
                <span className="admin-class-count">{count} student{count > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          Teachers ({teachers.length})
        </button>
        <button
          className={`admin-tab ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Students ({students.length})
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="admin-table-wrapper">
          {activeTab === "teachers" && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-empty">No teachers found</td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>{teacher.name}</td>
                      <td>{teacher.email}</td>
                      <td>{teacher.subject || "—"}</td>
                      <td>{teacher.class || "—"}</td>
                      <td>
                        <button
                          className="admin-delete-btn"
                          onClick={() => handleDelete(teacher._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "students" && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="admin-empty">No students found</td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.class || "—"}</td>
                      <td>
                        <button
                          className="admin-delete-btn"
                          onClick={() => handleDelete(student._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPage;