const express = require("express");

const {
  createSchool,
  getMySchools,
} = require("../controllers/schoolController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Register a new school
router.post("/", protect, createSchool);

// Get schools the current user belongs to
router.get("/my", protect, getMySchools);

module.exports = router;