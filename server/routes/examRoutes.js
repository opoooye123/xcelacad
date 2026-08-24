const express = require("express");

const {
  getPublishedExams,
  getExamById,
} = require("../controllers/examControllers");

const {
  startExam,
} = require("../controllers/examAttemptController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// STUDENT EXAM ROUTES
// ==========================================
// Attempt reads and writes live under /api/attempts.
// Admin exam management lives under /api/admin/exams.

router.get("/", protect, getPublishedExams);

router.get("/:id", protect, getExamById);

router.post("/:id/start", protect, startExam);

module.exports = router;
