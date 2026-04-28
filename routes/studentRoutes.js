import express from "express";
import Student from "../models/Student.js";
import { generateWeakTopicPracticeQuiz } from "../controllers/practiceController.js";
import {
  getStudentOverview,
  getStudentsList,
  getTeacherAnalytics,
} from "../controllers/dashboardController.js";
import { buildClassMatcher, normalizeClassLabel } from "../utils/classUtils.js";

const router = express.Router();

router.get("/students", getStudentsList);
router.get("/students/:studentId/overview", getStudentOverview);
router.get("/analytics/overview", getTeacherAnalytics);

router.post("/student/create", async (req, res) => {
  try {
    const normalizedName = String(req.body?.name || "").trim();
    const normalizedSchool = String(req.body?.school || "").trim();
    const normalizedClass = normalizeClassLabel(req.body?.class);

    let student = await Student.findOne({
      name: normalizedName,
      class: buildClassMatcher(normalizedClass),
    });

    if (student) {
      student.class = normalizedClass;
      if (normalizedSchool) {
        student.school = normalizedSchool;
      }

      await student.save();
      res.status(200).json({ success: true, data: student });
      return;
    }

    student = await Student.create({
      ...req.body,
      name: normalizedName,
      school: normalizedSchool,
      class: normalizedClass,
    });
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/student/:name", async (req, res) => {
  try {
    const student = await Student.findOne({ name: req.params.name });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/student/practice-quiz", generateWeakTopicPracticeQuiz);

export default router;
