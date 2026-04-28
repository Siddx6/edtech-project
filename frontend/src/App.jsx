import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
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
import "./App.css";

function App() {
  const { userRole, setUserRole } = useAppContext();

  const toggleRole = (role) => {
    setUserRole(role);
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar userRole={userRole} onRoleToggle={toggleRole} />
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
