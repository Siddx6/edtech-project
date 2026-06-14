import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    class: {
      type: String,
      default: null,
    },
    subject: {
      type: String,
      default: null,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  }
);



// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);