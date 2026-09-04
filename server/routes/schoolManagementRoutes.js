const express = require("express");

const {
  getSchoolDashboard,
  createSchoolClass,
  getSchoolClasses,
  deactivateSchoolClass,
  getSchoolTeachers,
  createTeacherAssignment,
  getTeacherAssignments,
  deactivateTeacherAssignment,
} = require("../controllers/schoolController");


const {
  addSchoolTeacher,
  deactivateSchoolTeacher,
} = require("../controllers/schoolTeacherController");


const {
  getSchoolStudents,
  addSchoolStudent,
  changeStudentClass,
  deactivateSchoolStudent,
} = require("../controllers/schoolStudentsController");


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

// Get teacher assignments
router.get(
  "/:schoolId/assignments",
  protect,
  requireSchoolRole([
    "school_admin",
    "principal",
    "teacher",
  ]),
  getTeacherAssignments
);

// Remove teacher assignment
router.patch(
  "/:schoolId/assignments/:assignmentId/deactivate",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  deactivateTeacherAssignment
);

// ==========================================
// SCHOOL STUDENTS
// ==========================================

// Get all active students in a school
router.get(
  "/:schoolId/students",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  getSchoolStudents
);

// Add an existing Xcel user as a student
router.post(
  "/:schoolId/students",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  addSchoolStudent
);

// Change a student's class
router.patch(
  "/:schoolId/students/:studentId/class",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  changeStudentClass
);

// Remove/deactivate a student from the school
router.patch(
  "/:schoolId/students/:studentId/deactivate",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  deactivateSchoolStudent
);


module.exports = router;