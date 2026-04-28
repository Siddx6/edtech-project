import { generatePracticeQuiz } from "../services/practiceQuizService.js";

export async function generateWeakTopicPracticeQuiz(req, res) {
  try {
    const { student_id, subject, question_count, difficulty } = req.body || {};

    if (!student_id || !subject) {
      return res.status(400).json({
        success: false,
        message: "student_id and subject are required",
      });
    }

    const quiz = await generatePracticeQuiz({
      student_id,
      subject,
      questionCount: question_count,
      difficulty,
    });

    return res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error("Error in generateWeakTopicPracticeQuiz:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
