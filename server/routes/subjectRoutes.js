const express = require("express");

const {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// PUBLIC
// ==========================================

router.get("/", getSubjects);

// ==========================================
// ADMIN
// ==========================================

// Create subject
router.post(
  "/",
  protect,
  requireRole("admin"),
  createSubject
);

// Update subject
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  updateSubject
);

// Delete subject
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  deleteSubject
);

module.exports = router;