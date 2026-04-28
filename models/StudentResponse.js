// models/StudentResponse.js

import mongoose from "mongoose";

const studentResponseSchema = new mongoose.Schema({
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  question_no: {
    type: Number,
    required: true,
  },
  marks_available: {
    type: Number,
    required: true,
  },
  marks_scored: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: [
      "fully_correct",
      "partially_correct",
      "completely_wrong",
      "not_attempted",
    ],
    required: true,
  },
  breakdown: {
    formula_marks: { type: Number, default: 0 },
    steps_marks: { type: Number, default: 0 },
    final_answer_marks: { type: Number, default: 0 },
  },
  mistake_area: {
    type: String,
    default: null,
  },
  ai_feedback: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("StudentResponse", studentResponseSchema);
