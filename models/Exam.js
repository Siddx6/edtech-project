import mongoose from "mongoose";

const chapterSummarySchema = new mongoose.Schema(
  {
    chapter_name: { type: String, required: true },
    sub_topics: { type: [String], default: [] },
  },
  { _id: false },
);

const examSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true,
  },
  exam_type: {
    type: String,
    enum: ["UT-1", "UT-2", "Mid-Term", "Final"],
    required: true,
  },
  subject: {
    type: String,
    required: true,
    index: true,
  },
  total_marks: {
    type: Number,
    required: true,
  },
  scored_marks: {
    type: Number,
    default: null,
  },
  percentage: {
    type: Number,
    default: null,
  },
  exam_date: {
    type: Date,
    required: true,
    index: true,
  },
  has_sections: {
    type: Boolean,
    default: false,
  },
  suggested_goal: {
    type: String,
    default: null,
  },
  goal_set_by: {
    type: String,
    enum: ["student", "ai_suggested", null],
    default: null,
  },
  weak_chapters: {
    type: [chapterSummarySchema],
    default: [],
  },
  strong_chapters: {
    type: [chapterSummarySchema],
    default: [],
  },
  priority_topics: {
    type: [String],
    default: [],
  },
  chapters_in_scope: [
    {
      chapter_code: String,
      chapter_name: String,
    },
  ],
  uploads: {
    question_paper: {
      file_url: String,
      file_type: String,
      uploaded_at: Date,
    },
    answer_sheet: {
      file_url: String,
      file_type: String,
      uploaded_at: Date,
    },
  },
  ai_processed: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

examSchema.index({ student_id: 1, subject: 1, exam_date: -1 });

export default mongoose.model("Exam", examSchema);
