const SchoolMembership = require("../models/SchoolMembership");

// ==========================================
// REQUIRE SCHOOL ROLE
// ==========================================
//
// Usage:
//
// router.post(
//   "/:schoolId/classes",
//   requireSchoolRole(["school_admin", "principal"]),
//   createClass
// );
//
// The user must:
// 1. Be authenticated
// 2. Belong to the requested school
// 3. Have an active membership
// 4. Have one of the allowed school roles
// ==========================================

const requireSchoolRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const { schoolId } = req.params;

      if (!schoolId) {
        return res.status(400).json({
          message: "School ID is required.",
        });
      }

      if (!req.user) {
        return res.status(401).json({
          message: "Not authenticated.",
        });
      }

      const membership = await SchoolMembership.findOne({
        school: schoolId,
        user: req.user._id,
        isActive: true,
      }).populate("school", "name code isVerified isActive");

      if (!membership) {
        return res.status(403).json({
          message: "You are not an active member of this school.",
        });
      }

      if (!membership.school.isActive) {
        return res.status(403).json({
          message: "This school is currently inactive.",
        });
      }

      if (!membership.school.isVerified) {
        return res.status(403).json({
          message: "This school has not been verified yet.",
        });
      }

      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(membership.role)
      ) {
        return res.status(403).json({
          message: "You do not have permission to perform this action.",
        });
      }

      // Make membership available to controllers.
      req.schoolMembership = membership;
      req.school = membership.school;

      next();
    } catch (error) {
      console.error("School authorization error:", error);

      res.status(500).json({
        message: "Failed to verify school permissions.",
      });
    }
  };
};

module.exports = {
  requireSchoolRole,
};