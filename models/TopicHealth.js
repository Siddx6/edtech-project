import mongoose from "mongoose";

const subTopicSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ["crystal_clear", "partial_understanding", "no_knowledge"],
      required: true,
    },
  },
  { _id: false },
);

const chapterHealthSchema = new mongoose.Schema(
  {
    chapter: { type: String, required: true },
    chapter_name: { type: String },
    sub_topics: { type: [subTopicSchema], default: [] },
  },
  { _id: false },
);

const topicHealthSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subject: { type: String, required: true },
    topic_health: { type: [chapterHealthSchema], default: [] },
  },
  { timestamps: true },
);

const TopicHealth = mongoose.model("TopicHealth", topicHealthSchema);

export default TopicHealth;
