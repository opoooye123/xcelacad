const SchoolMembership = require("../models/SchoolMembership");
const TeacherAssignment = require("../models/TeacherAssignment");

// ==========================================
// GET TEACHER DASHBOARD
// ==========================================
const getTeacherDashboard = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const teacherId = req.user._id;

    // Get teacher's active assignments
    const assignments = await TeacherAssignment.find({
      school: schoolId,
      teacher: teacherId,
      isActive: true,
    })
      .populate("subject", "name slug")
      .populate(
        "class",
        "name level section academicSession"
      )
      .sort({
        createdAt: -1,
      });

    // Get students belonging to classes
    // assigned to this teacher
    const classIds = assignments.map(
      (assignment) => assignment.class?._id
    );

    let students = [];

    if (classIds.length > 0) {
      students = await SchoolMembership.find({
        school: schoolId,
        role: "student",
        isActive: true,
        class: { $in: classIds },
      })
        .populate("user", "name email avatar")
        .populate(
          "class",
          "name level section academicSession"
        )
        .sort({
          createdAt: -1,
        });
    }

    res.json({
      teacher: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
      },

      assignments,

      students,

      summary: {
        assignmentCount: assignments.length,
        classCount: classIds.length,
        studentCount: students.length,
      },
    });
  } catch (error) {
    console.error(
      "Get teacher dashboard error:",
      error
    );

    res.status(500).json({
      message: "Failed to load teacher dashboard.",
    });
  }
};

module.exports = {
  getTeacherDashboard,
};