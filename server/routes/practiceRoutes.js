const express = require("express");

const {
  createPracticeSession,
  getPracticeOptions,
} = require("../controllers/practiceController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/options", getPracticeOptions);
router.post("/sessions", createPracticeSession);

module.exports = router;
