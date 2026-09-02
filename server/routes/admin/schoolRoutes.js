const express = require("express");

const {
  getPendingSchools,
  verifySchool,
} = require("../../controllers/schoolController");

const router = express.Router();

// Get schools waiting for verification
router.get("/pending", getPendingSchools);

// Verify a school
router.patch("/:id/verify", verifySchool);

module.exports = router;