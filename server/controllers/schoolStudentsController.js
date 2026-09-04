const User = require("../models/User");
const SchoolMembership = require("../models/SchoolMembership");
const SchoolClass = require("../models/SchoolClass");

// ==========================================
// GET SCHOOL STUDENTS
// ==========================================
const getSchoolStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const students = await SchoolMembership.find({
      school: schoolId,
      role: "student",
      isActive: true,
    })
      .populate("user", "name email avatar")
      .populate(
        "class",
        "name level section academicSession"
      )
      .sort({ createdAt: -1 });

    res.json({
      students,
    });
  } catch (error) {
    console.error("Get school students error:", error);

    res.status(500).json({
      message: "Failed to fetch school students.",
    });
  }
};

// ==========================================
// ADD STUDENT TO SCHOOL
// ==========================================
const addSchoolStudent = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { email, class: classId } = req.body;

    if (!email || !classId) {
      return res.status(400).json({
        message: "Student email and class are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find existing Xcel account
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("_id name email avatar isBlocked");

    if (!user) {
      return res.status(404).json({
        message:
          "No Xcel account was found with this email. Ask the student to create an Xcel account first.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message:
          "This user's Xcel account is currently suspended.",
      });
    }

    // Make sure class belongs to this school
    const schoolClass = await SchoolClass.findOne({
      _id: classId,
      school: schoolId,
      isActive: true,
    });

    if (!schoolClass) {
      return res.status(400).json({
        message:
          "The selected class does not belong to this school.",
      });
    }

    // Check existing membership
    const existingMembership =
      await SchoolMembership.findOne({
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

      // Reactivate inactive membership
      existingMembership.role = "student";
      existingMembership.class = classId;
      existingMembership.isActive = true;
      existingMembership.joinedAt = new Date();

      await existingMembership.save();

      const populatedMembership =
        await SchoolMembership.findById(
          existingMembership._id
        )
          .populate("user", "name email avatar")
          .populate(
            "class",
            "name level section academicSession"
          )
          .populate(
            "school",
            "name code logo isVerified isActive"
          );

      return res.json({
        message:
          "Student membership reactivated successfully.",
        membership: populatedMembership,
      });
    }

    // Create student membership
    const membership = await SchoolMembership.create({
      school: schoolId,
      user: user._id,
      role: "student",
      class: classId,
      isActive: true,
    });

    const populatedMembership =
      await SchoolMembership.findById(membership._id)
        .populate("user", "name email avatar")
        .populate(
          "class",
          "name level section academicSession"
        )
        .populate(
          "school",
          "name code logo isVerified isActive"
        );

    res.status(201).json({
      message: "Student added to school successfully.",
      membership: populatedMembership,
    });
  } catch (error) {
    console.error("Add school student error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "This user is already a member of this school.",
      });
    }

    res.status(500).json({
      message: "Failed to add student to school.",
    });
  }
};

// ==========================================
// CHANGE STUDENT CLASS
// ==========================================
const changeStudentClass = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;
    const { class: classId } = req.body;

    if (!classId) {
      return res.status(400).json({
        message: "New class is required.",
      });
    }

    // Verify new class belongs to school
    const schoolClass = await SchoolClass.findOne({
      _id: classId,
      school: schoolId,
      isActive: true,
    });

    if (!schoolClass) {
      return res.status(400).json({
        message:
          "The selected class does not belong to this school.",
      });
    }

    const membership = await SchoolMembership.findOne({
      school: schoolId,
      user: studentId,
      role: "student",
      isActive: true,
    });

    if (!membership) {
      return res.status(404).json({
        message: "Active student membership not found.",
      });
    }

    membership.class = classId;

    await membership.save();

    const populatedMembership =
      await SchoolMembership.findById(membership._id)
        .populate("user", "name email avatar")
        .populate(
          "class",
          "name level section academicSession"
        );

    res.json({
      message: "Student class updated successfully.",
      membership: populatedMembership,
    });
  } catch (error) {
    console.error(
      "Change student class error:",
      error
    );

    res.status(500).json({
      message: "Failed to change student class.",
    });
  }
};

// ==========================================
// DEACTIVATE STUDENT
// ==========================================
const deactivateSchoolStudent = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;

    const membership = await SchoolMembership.findOne({
      school: schoolId,
      user: studentId,
      role: "student",
      isActive: true,
    });

    if (!membership) {
      return res.status(404).json({
        message: "Active student membership not found.",
      });
    }

    membership.isActive = false;

    await membership.save();

    res.json({
      message: "Student removed from school successfully.",
    });
  } catch (error) {
    console.error(
      "Deactivate school student error:",
      error
    );

    res.status(500).json({
      message: "Failed to remove student from school.",
    });
  }
};

module.exports = {
  getSchoolStudents,
  addSchoolStudent,
  changeStudentClass,
  deactivateSchoolStudent,
};