const School = require("../models/School");
const SchoolMembership = require("../models/SchoolMembership");
const SchoolClass = require("../models/SchoolClass");
const TeacherAssignment = require("../models/TeacherAssignment");
const Subject = require("../models/Subject");
// ==========================================
// CREATE SCHOOL
// ==========================================
const createSchool = async (req, res) => {
  try {
    const { name, code, email, phone, address, logo } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "School name and school code are required.",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check if school code already exists
    const existingSchool = await School.findOne({
      code: normalizedCode,
    });

    if (existingSchool) {
      return res.status(409).json({
        message: "This school code is already in use.",
      });
    }

    const school = await School.create({
      name: name.trim(),
      code: normalizedCode,
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      address: address?.trim(),
      logo: logo?.trim() || "",
      createdBy: req.user._id,

      // New schools must be verified before
      // they can fully use the school system.
      isVerified: false,
      isActive: true,
    });

    // The person who creates the school is NOT
    // automatically a principal.
    //
    // We will later have an Xcel admin verify the
    // school and approve the appropriate school admin.
    const membership = await SchoolMembership.create({
      school: school._id,
      user: req.user._id,
      role: "school_admin",
      isActive: false,
    });

    res.status(201).json({
      message:
        "School registration submitted successfully. It is awaiting verification.",
      school,
      membership,
    });
  } catch (error) {
    console.error("Create school error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A school with this code already exists.",
      });
    }

    res.status(500).json({
      message: "Failed to create school.",
    });
  }
};

// ==========================================
// GET MY SCHOOL MEMBERSHIPS
// ==========================================
const getMySchools = async (req, res) => {
  try {
    const memberships = await SchoolMembership.find({
      user: req.user._id,
    })
      .populate("school", "name code logo isVerified isActive")
      .populate("class", "name level section academicSession")
      .sort({ createdAt: -1 });

    res.json({
      memberships,
    });
  } catch (error) {
    console.error("Get my schools error:", error);

    res.status(500).json({
      message: "Failed to fetch school memberships.",
    });
  }
};

// ==========================================
// GET PENDING SCHOOLS - ADMIN
// ==========================================
const getPendingSchools = async (req, res) => {
  try {
    const schools = await School.find({
      isVerified: false,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      schools,
    });
  } catch (error) {
    console.error("Get pending schools error:", error);

    res.status(500).json({
      message: "Failed to fetch pending schools.",
    });
  }
};

// ==========================================
// VERIFY SCHOOL - ADMIN
// ==========================================
const verifySchool = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findById(id);

    if (!school) {
      return res.status(404).json({
        message: "School not found.",
      });
    }

    if (school.isVerified) {
      return res.status(400).json({
        message: "School is already verified.",
      });
    }

    school.isVerified = true;
    await school.save();

    // Activate the school admin membership
    // belonging to the person who registered
    // the school.
    const membership = await SchoolMembership.findOneAndUpdate(
      {
        school: school._id,
        user: school.createdBy,
        role: "school_admin",
      },
      {
        isActive: true,
      },
      {
        new: true,
      }
    );

    res.json({
      message: "School verified successfully.",
      school,
      membership,
    });
  } catch (error) {
    console.error("Verify school error:", error);

    res.status(500).json({
      message: "Failed to verify school.",
    });
  }
};

// ==========================================
// CREATE SCHOOL CLASS
// ==========================================
const createSchoolClass = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, level, section, academicSession } = req.body;

    if (!name || !level || !academicSession) {
      return res.status(400).json({
        message:
          "Class name, level and academic session are required.",
      });
    }

    const schoolClass = await SchoolClass.create({
      school: schoolId,
      name: name.trim(),
      level: level.trim(),
      section: section?.trim().toUpperCase() || "",
      academicSession: academicSession.trim(),
      isActive: true,
    });

    res.status(201).json({
      message: "Class created successfully.",
      class: schoolClass,
    });
  } catch (error) {
    console.error("Create school class error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A class with this name already exists for this academic session.",
      });
    }

    res.status(500).json({
      message: "Failed to create school class.",
    });
  }
};

// ==========================================
// GET SCHOOL CLASSES
// ==========================================
const getSchoolClasses = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const classes = await SchoolClass.find({
      school: schoolId,
      isActive: true,
    }).sort({
      level: 1,
      name: 1,
    });

    res.json({
      classes,
    });
  } catch (error) {
    console.error("Get school classes error:", error);

    res.status(500).json({
      message: "Failed to fetch school classes.",
    });
  }
};

// ==========================================
// DEACTIVATE SCHOOL CLASS
// ==========================================
const deactivateSchoolClass = async (req, res) => {
  try {
    const { schoolId, classId } = req.params;

    const schoolClass = await SchoolClass.findOne({
      _id: classId,
      school: schoolId,
    });

    if (!schoolClass) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    schoolClass.isActive = false;
    await schoolClass.save();

    res.json({
      message: "Class deactivated successfully.",
      class: schoolClass,
    });
  } catch (error) {
    console.error("Deactivate school class error:", error);

    res.status(500).json({
      message: "Failed to deactivate school class.",
    });
  }
};

// ==========================================
// GET SCHOOL DASHBOARD
// ==========================================
const getSchoolDashboard = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const [
      school,
      membershipCount,
      teacherCount,
      studentCount,
      classCount,
    ] = await Promise.all([
      School.findById(schoolId).select(
        "name code logo isVerified isActive"
      ),

      SchoolMembership.countDocuments({
        school: schoolId,
        isActive: true,
      }),

      SchoolMembership.countDocuments({
        school: schoolId,
        role: {
          $in: ["teacher", "principal", "school_admin"],
        },
        isActive: true,
      }),

      SchoolMembership.countDocuments({
        school: schoolId,
        role: "student",
        isActive: true,
      }),

      SchoolClass.countDocuments({
        school: schoolId,
        isActive: true,
      }),
    ]);

    if (!school) {
      return res.status(404).json({
        message: "School not found.",
      });
    }

    const assignmentCount = await TeacherAssignment.countDocuments({
      school: schoolId,
      isActive: true,
    });

    res.json({
      school,
      stats: {
        members: membershipCount,
        teachers: teacherCount,
        students: studentCount,
        classes: classCount,
        assignments: assignmentCount,
      },
    });
  } catch (error) {
    console.error("Get school dashboard error:", error);

    res.status(500).json({
      message: "Failed to load school dashboard.",
    });
  }
};

// ==========================================
// GET SCHOOL TEACHERS
// ==========================================
const getSchoolTeachers = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const teachers = await SchoolMembership.find({
      school: schoolId,
      role: "teacher",
      isActive: true,
    })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({
      teachers,
    });
  } catch (error) {
    console.error("Get school teachers error:", error);

    res.status(500).json({
      message: "Failed to fetch school teachers.",
    });
  }
};

// ==========================================
// CREATE TEACHER ASSIGNMENT
// ==========================================
const createTeacherAssignment = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { teacher, subject, class: classId, academicSession } = req.body;

    if (!teacher || !subject || !classId || !academicSession) {
      return res.status(400).json({
        message:
          "Teacher, subject, class and academic session are required.",
      });
    }

    // Make sure the selected user is an active teacher
    // in this school.
    const teacherMembership = await SchoolMembership.findOne({
      school: schoolId,
      user: teacher,
      role: "teacher",
      isActive: true,
    });

    if (!teacherMembership) {
      return res.status(400).json({
        message:
          "The selected user is not an active teacher in this school.",
      });
    }

    // Make sure the class belongs to this school.
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

    const schoolSubject = await Subject.findOne({
      _id: subject,
      isActive: true,
    });

    if (!schoolSubject) {
      return res.status(400).json({
        message: "The selected subject does not exist.",
      });
    }

    // Prevent duplicate assignment.
    const existingAssignment = await TeacherAssignment.findOne({
      school: schoolId,
      teacher,
      subject,
      class: classId,
      academicSession: academicSession.trim(),
    });

    if (existingAssignment) {
      return res.status(409).json({
        message:
          "This teacher is already assigned to this subject and class for this academic session.",
      });
    }

    const assignment = await TeacherAssignment.create({
      school: schoolId,
      teacher,
      subject,
      class: classId,
      academicSession: academicSession.trim(),
      isActive: true,
    });

    const populatedAssignment =
      await TeacherAssignment.findById(assignment._id)
        .populate("teacher", "name email avatar")
        .populate("subject", "name slug")
        .populate(
          "class",
          "name level section academicSession"
        );

    res.status(201).json({
      message: "Teacher assignment created successfully.",
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error("Create teacher assignment error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "This teacher assignment already exists.",
      });
    }

    res.status(500).json({
      message: "Failed to create teacher assignment.",
    });
  }
};

// ==========================================
// GET SCHOOL TEACHER ASSIGNMENTS
// ==========================================
const getTeacherAssignments = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const filter = {
      school: schoolId,
      isActive: true,
    };

    // Teachers should eventually only see their
    // own assignments.
    if (req.schoolMembership.role === "teacher") {
      filter.teacher = req.user._id;
    }

    const assignments = await TeacherAssignment.find(filter)
      .populate("teacher", "name email avatar")
      .populate("subject", "name slug")
      .populate(
        "class",
        "name level section academicSession"
      )
      .sort({
        academicSession: -1,
        createdAt: -1,
      });

    res.json({
      assignments,
    });
  } catch (error) {
    console.error(
      "Get teacher assignments error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch teacher assignments.",
    });
  }
};

// ==========================================
// DEACTIVATE TEACHER ASSIGNMENT
// ==========================================
const deactivateTeacherAssignment = async (req, res) => {
  try {
    const { schoolId, assignmentId } = req.params;

    const assignment = await TeacherAssignment.findOne({
      _id: assignmentId,
      school: schoolId,
      isActive: true,
    });

    if (!assignment) {
      return res.status(404).json({
        message: "Teacher assignment not found.",
      });
    }

    assignment.isActive = false;

    await assignment.save();

    res.json({
      message: "Teacher assignment removed successfully.",
      assignment,
    });
  } catch (error) {
    console.error(
      "Deactivate teacher assignment error:",
      error
    );

    res.status(500).json({
      message: "Failed to remove teacher assignment.",
    });
  }
};
// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  createSchool,
  getMySchools,
  getPendingSchools,
  verifySchool,
  createSchoolClass,
  getSchoolClasses,
  deactivateSchoolClass,
  getSchoolDashboard,
  getSchoolTeachers,
  createTeacherAssignment,
  getTeacherAssignments,
  deactivateTeacherAssignment
};
