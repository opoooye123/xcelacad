const mongoose = require("mongoose");

const Exam = require("../models/Exam");
const SchoolMembership = require("../models/SchoolMembership");

// ==========================================
// GET STUDENT'S SCHOOL EXAMS
// ==========================================
const getStudentSchoolExams = async (req, res) => {
  try {
    const { schoolId } = req.params;

    // ------------------------------------------
    // Find student's active membership
    // ------------------------------------------
    const membership =
      await SchoolMembership.findOne({
        school: schoolId,
        user: req.user._id,
        role: "student",
        isActive: true,
      }).populate(
        "class",
        "name level section academicSession"
      );

    if (!membership) {
      return res.status(403).json({
        message:
          "You are not an active student in this school.",
      });
    }

    if (!membership.class) {
      return res.status(400).json({
        message:
          "You have not been assigned to a school class yet.",
      });
    }

    // ------------------------------------------
    // Find published exams for student's class
    // ------------------------------------------
    const exams = await Exam.find({
      school: schoolId,
      schoolClass: membership.class._id,
      isPublished: true,
      isActive: true,
      isPractice: false,
    })
      .populate("subjects", "name slug")
      .populate(
        "schoolClass",
        "name level section academicSession"
      )
      .populate(
        "createdByTeacher",
        "name avatar"
      )
      .select(
        "title description examType subjects schoolClass createdByTeacher duration totalMarks instructions createdAt"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      school: schoolId,

      class: membership.class,

      exams,
    });
  } catch (error) {
    console.error(
      "Get student school exams error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch school exams.",
    });
  }
};

// ==========================================
// GET SINGLE STUDENT SCHOOL EXAM
// ==========================================
// Used before starting an exam.
// Makes sure the student is actually allowed
// to access this exam.
const getStudentSchoolExam = async (
  req,
  res
) => {
  try {
    const {
      schoolId,
      examId,
    } = req.params;

    // ------------------------------------------
    // Validate exam ID
    // ------------------------------------------
    if (
      !mongoose.Types.ObjectId.isValid(
        examId
      )
    ) {
      return res.status(400).json({
        message: "Invalid exam ID.",
      });
    }

    // ------------------------------------------
    // Find student's active membership
    // ------------------------------------------
    const membership =
      await SchoolMembership.findOne({
        school: schoolId,
        user: req.user._id,
        role: "student",
        isActive: true,
      });

    if (!membership) {
      return res.status(403).json({
        message:
          "You are not an active student in this school.",
      });
    }

    // ------------------------------------------
    // Find exam belonging to student's class
    // ------------------------------------------
    const exam = await Exam.findOne({
      _id: examId,
      school: schoolId,
      schoolClass: membership.class,
      isPublished: true,
      isActive: true,
      isPractice: false,
    })
      .populate("subjects", "name slug")
      .populate(
        "schoolClass",
        "name level section academicSession"
      )
      .populate(
        "createdByTeacher",
        "name avatar"
      )
      .select(
        "title description examType subjects schoolClass createdByTeacher duration totalMarks instructions questions createdAt"
      );

    if (!exam) {
      return res.status(404).json({
        message:
          "This exam is not available to you.",
      });
    }

    res.json({
      exam,
    });
  } catch (error) {
    console.error(
      "Get student school exam error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch school exam.",
    });
  }
};

module.exports = {
  getStudentSchoolExams,
  getStudentSchoolExam,
};