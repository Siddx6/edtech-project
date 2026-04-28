import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    school: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

studentSchema.virtual("exams", {
  ref: "Exam",
  localField: "_id",
  foreignField: "student_id",
});

studentSchema.virtual("topic_health_records", {
  ref: "TopicHealth",
  localField: "_id",
  foreignField: "student_id",
});

studentSchema.virtual("quizzes", {
  ref: "Quiz",
  localField: "_id",
  foreignField: "student_id",
});

studentSchema.virtual("responses", {
  ref: "StudentResponse",
  localField: "_id",
  foreignField: "student_id",
});

studentSchema.index({ name: 1, class: 1 });

export default mongoose.model("Student", studentSchema);
