/**
 * Centralized API Service for all backend calls
 * Base URL: http://localhost:5000
 * Proxy handles /api -> http://localhost:5000
 */

const API_BASE = "/api";
const API_V1 = "/api/v1";

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================
// PAPER MANAGEMENT APIs (Teacher)
// ============================================

/**
 * Generate a new exam paper using AI
 * @param {Object} paperData - { subject, class, exam_type, chapters, total_marks, num_questions, duration }
 * @returns {Promise<Object>} - { success, paperId, data, format }
 */
export async function generatePaper(paperData) {
  return apiCall(`${API_BASE}/generate-paper`, {
    method: "POST",
    body: JSON.stringify(paperData),
  });
}

/**
 * Get all generated papers
 * @returns {Promise<Array>} - Array of paper objects
 */
export async function getAllPapers() {
  const response = await apiCall(`${API_BASE}/papers`);
  return response.data || [];
}

/**
 * Get a specific paper by ID
 * @param {string} paperId - Paper MongoDB ID
 * @returns {Promise<Object>} - Paper object with all questions
 */
export async function getPaperById(paperId) {
  const response = await apiCall(`${API_BASE}/papers/${paperId}`);
  return response.data;
}

/**
 * Download paper as PDF
 * @param {string} paperId - Paper MongoDB ID
 * @returns {Promise<Blob>} - PDF file blob
 */
export async function downloadPaperPDF(paperId) {
  const response = await fetch(`${API_BASE}/papers/${paperId}/download`);
  if (!response.ok) {
    throw new Error("Failed to download paper");
  }
  return response.blob();
}

/**
 * Get papers for a specific class
 * @param {string} stdClass - Class name (e.g., "Class 10")
 * @returns {Promise<Array>} - Array of papers for that class
 */
export async function getPapersByClass(stdClass) {
  const response = await apiCall(`${API_BASE}/papers/class/${stdClass}`);
  return response.data || [];
}

/**
 * Analyze exam (upload and analyze papers/answer sheets)
 * @param {FormData} formData - Contains question_paper and answer_sheet files
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeExam(formData) {
  const response = await fetch(`${API_BASE}/analyze-exam`, {
    method: "POST",
    body: formData, // Don't set Content-Type for FormData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to analyze exam");
  }

  return response.json();
}

// ============================================
// STUDENT MANAGEMENT APIs
// ============================================

/**
 * Create/Register a new student
 * @param {Object} studentData - { name, email, class }
 * @returns {Promise<Object>} - Created student object with ID
 */
export async function createStudent(studentData) {
  return apiCall(`${API_V1}/student/create`, {
    method: "POST",
    body: JSON.stringify(studentData),
  });
}

/**
 * Get all students with summary information
 * @returns {Promise<Array>}
 */
export async function getStudents() {
  const response = await apiCall(`${API_V1}/students`);
  return response.data || [];
}

/**
 * Get a student overview bundle for dashboard, performance and recommendations
 * @param {string} studentId
 * @returns {Promise<Object>}
 */
export async function getStudentOverview(studentId) {
  const response = await apiCall(`${API_V1}/students/${studentId}/overview`);
  return response.data;
}

/**
 * Get teacher analytics overview
 * @returns {Promise<Object>}
 */
export async function getTeacherAnalytics() {
  const response = await apiCall(`${API_V1}/analytics/overview`);
  return response.data;
}

/**
 * Get student by ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Student object
 */
export async function getStudentById(studentId) {
  const response = await apiCall(`${API_V1}/student/${studentId}`);
  return response.data;
}

/**
 * Generate practice quiz for weak topics
 * @param {Object} quizData - { student_id, subject, question_count, difficulty }
 * @returns {Promise<Object>} - Generated quiz with questions
 */
export async function generatePracticeQuiz(quizData) {
  return apiCall(`${API_V1}/student/practice-quiz`, {
    method: "POST",
    body: JSON.stringify(quizData),
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Trigger PDF download in browser
 * @param {Blob} blob - PDF blob from API
 * @param {string} fileName - File name for download
 */
export function triggerPDFDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default {
  // Papers
  generatePaper,
  getAllPapers,
  getPaperById,
  downloadPaperPDF,
  getPapersByClass,
  analyzeExam,
  // Students
  createStudent,
  getStudents,
  getStudentOverview,
  getTeacherAnalytics,
  getStudentById,
  generatePracticeQuiz,
  // Helpers
  triggerPDFDownload,
  formatDate,
};
