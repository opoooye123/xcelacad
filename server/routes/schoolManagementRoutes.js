const express = require("express");

const {
  getSchoolDashboard,
  createSchoolClass,
  getSchoolClasses,
  deactivateSchoolClass,
  getSchoolTeachers,
  createTeacherAssignment,
} = require("../controllers/schoolController");

const {
  addSchoolTeacher,
  deactivateSchoolTeacher,
} = require("../controllers/schoolTeacherController");

const { protect } = require("../middleware/authMiddleware");
const { requireSchoolRole } = require("../middleware/schoolMiddleware");

const router = express.Router();

// ==========================================
// SCHOOL DASHBOARD
// ==========================================
router.get(
  "/:schoolId/dashboard",
  protect,
  requireSchoolRole(["school_admin", "principal", "teacher"]),
  getSchoolDashboard
);

// ==========================================
// SCHOOL CLASSES
// ==========================================

// Create class
router.post(
  "/:schoolId/classes",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  createSchoolClass
);

// Get classes
router.get(
  "/:schoolId/classes",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  getSchoolClasses
);

// Deactivate class
router.patch(
  "/:schoolId/classes/:classId/deactivate",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  deactivateSchoolClass
);

// ==========================================
// SCHOOL TEACHERS
// ==========================================

// Get all active teachers in the school
router.get(
  "/:schoolId/teachers",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  getSchoolTeachers
);

// ==========================================
// TEACHER ASSIGNMENTS
// ==========================================

// Create teacher assignment
router.post(
  "/:schoolId/assignments",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  createTeacherAssignment
);

// Add teacher
router.post(
  "/:schoolId/teachers",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  addSchoolTeacher
);

// Remove teacher
router.patch(
  "/:schoolId/teachers/:teacherId/deactivate",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  deactivateSchoolTeacher
);

module.exports = router;