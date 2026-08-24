const express = require("express");

const {
  saveAnswer,
  submitExam,
  getAttempt,
  getExamResult,
  getActiveAttempts,
  getExamHistory,
} = require("../controllers/examAttemptController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// ATTEMPTS  (mounted at /api/attempts)
// ==========================================
// The single home for attempt state. These used to be
// duplicated across /api/exams and /api, which meant
// two ways to do the same thing.

router.use(protect);

// Must precede "/:id" so these are not read as ids.
router.get("/history", getExamHistory);
router.get("/active", getActiveAttempts);

router.get("/:id", getAttempt);
router.get("/:id/result", getExamResult);

router.post("/:id/answer", saveAnswer);
router.post("/:id/submit", submitExam);

module.exports = router;
