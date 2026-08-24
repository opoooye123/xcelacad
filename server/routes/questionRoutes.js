const express = require("express");

const {
  createQuestion,
  getQuestions,
  getQuestionById,
} = require("../controllers/questionController");

const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getQuestions);

router.get("/:id", protect, getQuestionById);

router.post(
  "/",
  protect,
  requireRole("admin", "teacher"),
  createQuestion
);

module.exports = router;