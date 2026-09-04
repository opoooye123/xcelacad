const mongoose = require("mongoose");

const Exam = require("../models/Exam");
const Question = require("../models/Question");
const SchoolClass = require("../models/SchoolClass");
const TeacherAssignment = require("../models/TeacherAssignment");

// ==========================================
// GET QUESTIONS FOR SCHOOL EXAM CREATION
// ==========================================
// Teachers can only select questions belonging
// to subjects they are assigned to teach.
const getSchoolExamQuestions = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      subject,
      topic,
      examType,
      year,
      difficulty,
      search,
    } = req.query;

    // ------------------------------------------
    // Get teacher's active subject assignments
    // ------------------------------------------
    const assignments = await TeacherAssignment.find({
      school: schoolId,
      teacher: req.user._id,
      isActive: true,
    }).select("subject class");

    if (assignments.length === 0) {
      return res.status(403).json({
        message: "You do not have any active teaching assignments.",
      });
    }

    // ------------------------------------------
    // Only allow assigned subjects
    // ------------------------------------------
    const assignedSubjectIds = [
      ...new Set(
        assignments.map((assignment) =>
          assignment.subject.toString()
        )
      ),
    ];

    // If teacher requested a specific subject,
    // make sure it is one they teach.
    if (subject) {
      if (!mongoose.Types.ObjectId.isValid(subject)) {
        return res.status(400).json({
          message: "Invalid subject ID.",
        });
      }

      if (!assignedSubjectIds.includes(subject.toString())) {
        return res.status(403).json({
          message:
            "You are not assigned to teach this subject.",
        });
      }
    }

    // ------------------------------------------
    // Build question filter
    // ------------------------------------------
    const filter = {
      isActive: true,
      subject: subject || {
        $in: assignedSubjectIds,
      },
    };

    if (topic) {
      if (!mongoose.Types.ObjectId.isValid(topic)) {
        return res.status(400).json({
          message: "Invalid topic ID.",
        });
      }

      filter.topic = topic;
    }

    if (examType) {
      filter.examType = examType;
    }

    if (year) {
      const parsedYear = Number(year);

      if (!Number.isInteger(parsedYear)) {
        return res.status(400).json({
          message: "Invalid year.",
        });
      }

      filter.year = parsedYear;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // ------------------------------------------
    // Optional text search
    // ------------------------------------------
    if (search && search.trim()) {
      filter.questionText = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // ------------------------------------------
    // Get questions
    // ------------------------------------------
    const questions = await Question.find(filter)
      .populate("subject", "name slug")
      .populate("topic", "title slug")
      .select(
        "subject topic questionText options difficulty examType year marks"
      )
      .sort({
        createdAt: -1,
      })
      .limit(200);

    res.json({
      questions,
      total: questions.length,
      assignedSubjectIds,
    });
  } catch (error) {
    console.error(
      "Get school exam questions error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch exam questions.",
    });
  }
};

// ==========================================
// CREATE SCHOOL EXAM
// ==========================================
const createSchoolExam = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const {
      title,
      description,
      examType,
      subject,
      questions,
      duration,
      instructions,
      schoolClass,
      isPublished,
    } = req.body;

    // ------------------------------------------
    // Basic validation
    // ------------------------------------------
    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Exam title is required.",
      });
    }

    if (!subject) {
      return res.status(400).json({
        message: "Subject is required.",
      });
    }

    if (!schoolClass) {
      return res.status(400).json({
        message: "Class is required.",
      });
    }

    if (
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        message: "At least one question is required.",
      });
    }

    if (!duration || Number(duration) < 1) {
      return res.status(400).json({
        message: "Duration must be at least 1 minute.",
      });
    }

    // ------------------------------------------
    // Validate IDs
    // ------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        message: "Invalid subject ID.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(schoolClass)
    ) {
      return res.status(400).json({
        message: "Invalid class ID.",
      });
    }

    // ------------------------------------------
    // Check teacher assignment
    // ------------------------------------------
    const assignment =
      await TeacherAssignment.findOne({
        school: schoolId,
        teacher: req.user._id,
        subject,
        class: schoolClass,
        isActive: true,
      });

    if (!assignment) {
      return res.status(403).json({
        message:
          "You are not assigned to teach this subject in this class.",
      });
    }

    // ------------------------------------------
    // Verify class belongs to school
    // ------------------------------------------
    const schoolClassDoc =
      await SchoolClass.findOne({
        _id: schoolClass,
        school: schoolId,
        isActive: true,
      });

    if (!schoolClassDoc) {
      return res.status(400).json({
        message:
          "The selected class does not belong to this school.",
      });
    }

    // ------------------------------------------
    // Validate questions
    // ------------------------------------------
    const uniqueQuestionIds = [
      ...new Set(
        questions.map((id) => id.toString())
      ),
    ];

    const validQuestionIds =
      uniqueQuestionIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

    if (
      validQuestionIds.length !==
      uniqueQuestionIds.length
    ) {
      return res.status(400).json({
        message: "One or more question IDs are invalid.",
      });
    }

    const questionDocs = await Question.find({
      _id: {
        $in: validQuestionIds,
      },
      isActive: true,
    }).select(
      "_id subject topic questionText marks"
    );

    if (
      questionDocs.length !==
      validQuestionIds.length
    ) {
      return res.status(400).json({
        message:
          "One or more selected questions could not be found.",
      });
    }

    // ------------------------------------------
    // Make sure every question belongs to the
    // selected subject.
    // ------------------------------------------
    const invalidQuestion = questionDocs.find(
      (question) =>
        question.subject.toString() !==
        subject.toString()
    );

    if (invalidQuestion) {
      return res.status(400).json({
        message:
          "All selected questions must belong to the selected subject.",
      });
    }

    // ------------------------------------------
    // Calculate total marks
    // ------------------------------------------
    const totalMarks = questionDocs.reduce(
      (total, question) =>
        total + (question.marks || 1),
      0
    );

    // ------------------------------------------
    // Create school exam
    // ------------------------------------------
    const exam = await Exam.create({
      title: title.trim(),
      description: description?.trim() || "",
      examType: examType || "practice",

      subjects: [subject],

      questions: validQuestionIds,

      duration: Number(duration),

      totalMarks,

      instructions: instructions?.trim() || "",

      isPublished:
        isPublished === true,

      isActive: true,

      // School context
      school: schoolId,
      schoolClass,

      // Teacher who created it
      createdByTeacher: req.user._id,

      // This is NOT an auto-generated
      // personal practice session.
      isPractice: false,
    });

    const populatedExam =
      await Exam.findById(exam._id)
        .populate("subjects", "name slug")
        .populate(
          "schoolClass",
          "name level section academicSession"
        )
        .populate(
          "createdByTeacher",
          "name email avatar"
        );

    res.status(201).json({
      message: isPublished
        ? "School exam created and published successfully."
        : "School exam saved successfully.",
      exam: populatedExam,
    });
  } catch (error) {
    console.error(
      "Create school exam error:",
      error
    );

    res.status(500).json({
      message: "Failed to create school exam.",
    });
  }
};

// ==========================================
// GET TEACHER SCHOOL EXAMS
// ==========================================
const getTeacherSchoolExams = async (
  req,
  res
) => {
  try {
    const { schoolId } = req.params;

    const exams = await Exam.find({
      school: schoolId,
      createdByTeacher: req.user._id,
      isActive: true,
    })
      .populate("subjects", "name slug")
      .populate(
        "schoolClass",
        "name level section academicSession"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      exams,
    });
  } catch (error) {
    console.error(
      "Get teacher school exams error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch school exams.",
    });
  }
};

// ==========================================
// PUBLISH SCHOOL EXAM
// ==========================================
const publishSchoolExam = async (
  req,
  res
) => {
  try {
    const {
      schoolId,
      examId,
    } = req.params;

    const exam = await Exam.findOne({
      _id: examId,
      school: schoolId,
      createdByTeacher: req.user._id,
      isActive: true,
    });

    if (!exam) {
      return res.status(404).json({
        message: "School exam not found.",
      });
    }

    exam.isPublished = true;

    await exam.save();

    res.json({
      message: "School exam published successfully.",
      exam,
    });
  } catch (error) {
    console.error(
      "Publish school exam error:",
      error
    );

    res.status(500).json({
      message: "Failed to publish school exam.",
    });
  }
};

// ==========================================
// DEACTIVATE SCHOOL EXAM
// ==========================================
const deactivateSchoolExam = async (
  req,
  res
) => {
  try {
    const {
      schoolId,
      examId,
    } = req.params;

    const exam = await Exam.findOne({
      _id: examId,
      school: schoolId,
      createdByTeacher: req.user._id,
      isActive: true,
    });

    if (!exam) {
      return res.status(404).json({
        message: "School exam not found.",
      });
    }

    exam.isActive = false;
    exam.isPublished = false;

    await exam.save();

    res.json({
      message: "School exam deactivated successfully.",
    });
  } catch (error) {
    console.error(
      "Deactivate school exam error:",
      error
    );

    res.status(500).json({
      message: "Failed to deactivate school exam.",
    });
  }
};

module.exports = {
  getSchoolExamQuestions,
  createSchoolExam,
  getTeacherSchoolExams,
  publishSchoolExam,
  deactivateSchoolExam,
};