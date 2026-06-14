import React from "react";
import { Link } from "react-router-dom";
import { Bell, Settings, LogOut } from "lucide-react";
import "./Navbar.css";

function Navbar({ userRole, onRoleToggle, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">EduAI</span>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <Link to="/" className="nav-link">
            Dashboard
          </Link>
          <Link to="/my-exams" className="nav-link">
            My Exams
          </Link>
          <Link
            to={userRole === "teacher" ? "/students" : "/performance"}
            className="nav-link"
          >
            {userRole === "teacher" ? "Students" : "Performance"}
          </Link>
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          {/* Role Toggle */}
          <div className="role-toggle">
            <button
              className={`role-btn ${userRole === "teacher" ? "active" : ""}`}
              onClick={() => onRoleToggle("teacher")}
            >
              Teacher
            </button>
            <button
              className={`role-btn ${userRole === "student" ? "active" : ""}`}
              onClick={() => onRoleToggle("student")}
            >
              Student
            </button>
          </div>

          {/* Icons */}
          <button className="navbar-icon-btn">
            <Bell size={20} />
            <span className="notification-badge">2</span>
          </button>
          <button className="navbar-icon-btn">
            <Settings size={20} />
          </button>
          <button className="navbar-icon-btn" onClick={onLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;