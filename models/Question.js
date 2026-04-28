// models/Question.js

import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  question_no: {
    type: Number,
    required: true,
  },
  chapter_code: {
    type: String,
    required: true, // 'Ch-1'
  },
  chapter_name: {
    type: String,
    required: true, // 'Algebra'
  },
  sub_topic: {
    type: String,
    required: true, // 'A1', 'A2', 'A3', 'A4'
  },
  marks_available: {
    type: Number,
    required: true,
  },
  question_type: {
    type: String,
    enum: ["2_marker", "3_marker", "5_marker", "MCQ", "case_based"],
    required: true,
  },
  grading_breakdown: {
    formula: { type: Number, default: 0 }, // only for 5_marker
    steps: { type: Number, default: 0 },
    final_answer: { type: Number, default: 0 },
  },
  section: {
    type: String,
    default: null, // null for UT, 'A'/'B'/'C'/'D'/'E' for Mid-Term
  },
});

export default mongoose.model("Question", questionSchema);
