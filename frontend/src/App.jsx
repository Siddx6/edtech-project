import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import { useAppContext } from "./context/AppContext";
import TeacherDashboard from "./pages/TeacherDashboard";
import GenerateTestPaper from "./pages/GenerateTestPaper";
import PaperGenerated from "./pages/PaperGenerated";
import StudentDashboard from "./pages/StudentDashboard";
import ExamFlow from "./pages/ExamFlow";
import StudentResult from "./pages/StudentResult";
import MyExams from "./pages/MyExams";
import StudentsPage from "./pages/StudentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import QuizPage from "./pages/QuizPage";
import PerformancePage from "./pages/PerformancePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import "./App.css";

function App() {
  const { userRole, setUserRole, userToken, setUserToken } = useAppContext();

  const handleLoginSuccess = (token, user) => {
    setUserToken(token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    if (user.role === "admin") {
      setUserRole("admin");
    } else if (user.role === "teacher") {
      setUserRole("teacher");
    } else {
      setUserRole("student");
    }
  };

  const handleLogout = () => {
    setUserToken(null);
    setUserRole("student");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  if (!userToken) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Admin gets their own layout
  if (userRole === "admin") {
    return (
      <Router>
        <div className="app-container">
          <Navbar
            userRole={userRole}
            onRoleToggle={() => {}}
            onLogout={handleLogout}
          />
          <div className="main-content">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    );
  }

  const toggleRole = (role) => {
    setUserRole(role);
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar
          userRole={userRole}
          onRoleToggle={toggleRole}
          onLogout={handleLogout}
        />
        <div className="main-content">
          <Sidebar userRole={userRole} />
          <Routes>
            <Route
              path="/"
              element={
                userRole === "teacher" ? (
                  <TeacherDashboard />
                ) : (
                  <StudentDashboard />
                )
              }
            />
            <Route path="/generate-paper" element={<GenerateTestPaper />} />
            <Route path="/paper-generated" element={<PaperGenerated />} />
            <Route path="/exam/:examId" element={<ExamFlow />} />
            <Route path="/result/:examId" element={<StudentResult />} />
            <Route path="/my-exams" element={<MyExams userRole={userRole} />} />
            <Route path="/students" element={<StudentsPage userRole={userRole} />} />
            <Route path="/analytics" element={<AnalyticsPage userRole={userRole} />} />
            <Route path="/quiz" element={<QuizPage userRole={userRole} />} />
            <Route
              path="/performance"
              element={<PerformancePage userRole={userRole} />}
            />
            <Route
              path="/recommendations"
              element={<RecommendationsPage userRole={userRole} />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;