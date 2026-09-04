const express = require("express");

const {
  getSchoolExamQuestions,
  createSchoolExam,
  getTeacherSchoolExams,
  publishSchoolExam,
  deactivateSchoolExam,
} = require("../controllers/schoolExamController");

const { protect } = require("../middleware/authMiddleware");
const { requireSchoolRole } = require("../middleware/schoolMiddleware");

const router = express.Router();

// ==========================================
// GET QUESTIONS AVAILABLE TO TEACHER
// ==========================================
router.get(
  "/:schoolId/exams/questions",
  protect,
  requireSchoolRole(["teacher"]),
  getSchoolExamQuestions
);

// ==========================================
// CREATE SCHOOL EXAM
// ==========================================
router.post(
  "/:schoolId/exams",
  protect,
  requireSchoolRole(["teacher"]),
  createSchoolExam
);

// ==========================================
// GET TEACHER'S SCHOOL EXAMS
// ==========================================
router.get(
  "/:schoolId/exams",
  protect,
  requireSchoolRole(["teacher"]),
  getTeacherSchoolExams
);

// ==========================================
// PUBLISH EXAM
// ==========================================
router.patch(
  "/:schoolId/exams/:examId/publish",
  protect,
  requireSchoolRole(["teacher"]),
  publishSchoolExam
);

// ==========================================
// DEACTIVATE EXAM
// ==========================================
router.patch(
  "/:schoolId/exams/:examId/deactivate",
  protect,
  requireSchoolRole(["teacher"]),
  deactivateSchoolExam
);

module.exports = router;