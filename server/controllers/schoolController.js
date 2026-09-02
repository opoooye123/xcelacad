const School = require("../models/School");
const SchoolMembership = require("../models/SchoolMembership");

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
      isActive: true,
    })
      .populate("school", "name code logo isVerified isActive")
      .populate("class", "name level section academicSession");

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

    const SchoolClass = require("../models/SchoolClass");

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

    const SchoolClass = require("../models/SchoolClass");

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

    const SchoolClass = require("../models/SchoolClass");

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

// GET SCHOOL DASHBOARD
const getSchoolDashboard = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const SchoolClass = require("../models/SchoolClass");
    const TeacherAssignment = require("../models/TeacherAssignment");

    const [school, membershipCount, teacherCount, studentCount, classCount] =
      await Promise.all([
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


module.exports = {
  createSchool,
  getMySchools,
  getPendingSchools,
  verifySchool,
  createSchoolClass,
  getSchoolClasses,
  deactivateSchoolClass,
  getSchoolDashboard
};