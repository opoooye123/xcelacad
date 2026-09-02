const User = require("../models/User");
const SchoolMembership = require("../models/SchoolMembership");

// ==========================================
// ADD TEACHER TO SCHOOL
// ==========================================
const addSchoolTeacher = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Teacher email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the existing Xcel account
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("_id name email avatar isBlocked");

    if (!user) {
      return res.status(404).json({
        message:
          "No Xcel account was found with this email. Ask the teacher to create an Xcel account first.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message:
          "This user's Xcel account is currently suspended.",
      });
    }

    // Check whether this user already belongs to the school
    const existingMembership = await SchoolMembership.findOne({
      school: schoolId,
      user: user._id,
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        return res.status(409).json({
          message:
            "This user is already an active member of the school.",
        });
      }

      // Reactivate an existing inactive membership
      existingMembership.role = "teacher";
      existingMembership.isActive = true;
      existingMembership.joinedAt = new Date();

      await existingMembership.save();

      const populatedMembership =
        await SchoolMembership.findById(existingMembership._id)
          .populate("user", "name email avatar")
          .populate(
            "school",
            "name code logo isVerified isActive"
          );

      return res.json({
        message: "Teacher membership reactivated successfully.",
        membership: populatedMembership,
      });
    }

    // Create new teacher membership
    const membership = await SchoolMembership.create({
      school: schoolId,
      user: user._id,
      role: "teacher",
      isActive: true,
    });

    const populatedMembership =
      await SchoolMembership.findById(membership._id)
        .populate("user", "name email avatar")
        .populate(
          "school",
          "name code logo isVerified isActive"
        );

    res.status(201).json({
      message: "Teacher added to school successfully.",
      membership: populatedMembership,
    });
  } catch (error) {
    console.error("Add school teacher error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "This user is already a member of this school.",
      });
    }

    res.status(500).json({
      message: "Failed to add teacher to school.",
    });
  }
};

// ==========================================
// DEACTIVATE TEACHER
// ==========================================
const deactivateSchoolTeacher = async (req, res) => {
  try {
    const { schoolId, teacherId } = req.params;

    const membership = await SchoolMembership.findOne({
      school: schoolId,
      user: teacherId,
      role: "teacher",
      isActive: true,
    });

    if (!membership) {
      return res.status(404).json({
        message: "Active teacher membership not found.",
      });
    }

    membership.isActive = false;

    await membership.save();

    res.json({
      message: "Teacher removed from school successfully.",
    });
  } catch (error) {
    console.error(
      "Deactivate school teacher error:",
      error
    );

    res.status(500).json({
      message: "Failed to remove teacher from school.",
    });
  }
};

module.exports = {
  addSchoolTeacher,
  deactivateSchoolTeacher,
};