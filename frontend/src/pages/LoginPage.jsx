import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import "./LoginPage.css";

function LoginPage({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    class: "",
    subject: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isSignup
        ? "http://localhost:5000/api/auth/signup"
        : "http://localhost:5000/api/auth/login";

      const body = isSignup
        ? formData
        : { email: formData.email, password: formData.password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">EdTech Platform</h1>
        <h2 className="login-subtitle">{isSignup ? "Create Account" : "Welcome Back"}</h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <input
              className="login-input"
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}

          <input
            className="login-input"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            className="login-input"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {isSignup && (
            <>
              <select
                className="login-input"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>

              {formData.role === "student" && (
                <input
                  className="login-input"
                  type="text"
                  name="class"
                  placeholder="Class (e.g. 6, 7, 8)"
                  value={formData.class}
                  onChange={handleChange}
                />
              )}

              {formData.role === "teacher" && (
                <input
                  className="login-input"
                  type="text"
                  name="subject"
                  placeholder="Subject (e.g. Math, Science)"
                  value={formData.subject}
                  onChange={handleChange}
                />
              )}
            </>
          )}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="login-toggle">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;