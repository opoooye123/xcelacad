const express = require("express");

const {
  getMyReviewQueue,
  getReviewStats,
  answerReviewQuestion,
} = require("../controllers/reviewController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// STUDENT SMART REVIEW
// ==========================================

// Review statistics MUST come before /:id
router.get(
  "/stats",
  protect,
  getReviewStats
);

// Review queue
router.get(
  "/",
  protect,
  getMyReviewQueue
);

// Answer a review question
router.post(
  "/:id/answer",
  protect,
  answerReviewQuestion
);

module.exports = router;