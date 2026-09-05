const express = require("express");

const {
  getStudentSchoolExams,
  getStudentSchoolExam,
} = require("../controllers/schoolStudentExamController");

const { protect } = require("../middleware/authMiddleware");
const { requireSchoolRole } = require("../middleware/schoolMiddleware");

const router = express.Router();

// ==========================================
// GET STUDENT SCHOOL EXAMS
// ==========================================
router.get(
  "/:schoolId/student-exams",
  protect,
  requireSchoolRole(["student"]),
  getStudentSchoolExams
);

// ==========================================
// GET SINGLE SCHOOL EXAM
// ==========================================
router.get(
  "/:schoolId/student-exams/:examId",
  protect,
  requireSchoolRole(["student"]),
  getStudentSchoolExam
);

module.exports = router;