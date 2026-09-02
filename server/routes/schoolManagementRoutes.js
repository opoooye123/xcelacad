const express = require("express");

const {
  getSchoolDashboard,
  createSchoolClass,
  getSchoolClasses,
  deactivateSchoolClass,
} = require("../controllers/schoolController");

const { protect } = require("../middleware/authMiddleware");
const { requireSchoolRole } = require("../middleware/schoolMiddleware");

const router = express.Router();

router.post(
  "/:schoolId/classes",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  createSchoolClass
);

router.get(
  "/:schoolId/classes",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  getSchoolClasses
);

router.patch(
  "/:schoolId/classes/:classId/deactivate",
  protect,
  requireSchoolRole(["school_admin", "principal"]),
  deactivateSchoolClass
);

router.get(
  "/:schoolId/dashboard",
  protect,
  requireSchoolRole(["school_admin", "principal", "teacher"]),
  getSchoolDashboard
);

module.exports = router;