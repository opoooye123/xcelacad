const express = require("express");

const {
  createQuestion,
  bulkCreateQuestions,
  getQuestionsAdmin,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionYears,
} = require("../../controllers/questionController");

const router = express.Router();

router.get("/", getQuestionsAdmin);
router.post("/", createQuestion);

// Both must be declared before "/:id" or Express would
// read "bulk" and "years" as ids.
router.post("/bulk", bulkCreateQuestions);
router.get("/years", getQuestionYears);

router.get("/:id", getQuestionById);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

module.exports = router;
