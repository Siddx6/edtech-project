// models/Quiz.js

import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  trigger_type: {
    type: String,
    enum: ["auto", "manual"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  scheduled_at: {
    type: Date,
    default: Date.now,
  },
  completed_at: {
    type: Date,
    default: null,
  },
  questions: [
    {
      question_no: Number,
      chapter_code: String,
      sub_topic: String,
      question_type: String, // 'MCQ', 'short_answer'
      question_text: String,
      options: [String], // only for MCQ
      correct_answer: String,
      marks: Number,
    },
  ],
  responses: [
    {
      question_no: Number,
      student_answer: String,
      is_correct: Boolean,
      marks_scored: Number,
    },
  ],
  total_marks: {
    type: Number,
    default: 0,
  },
  scored_marks: {
    type: Number,
    default: null, // null until quiz completed
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Quiz", quizSchema);
