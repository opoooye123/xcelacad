const mongoose = require("mongoose");

const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Subject = require("../models/Subject");
const ExamAttempt = require("../models/ExamAttempt");

const { EXAM_TYPES } = require("../config/constants");

// ==========================================
// EXAMS
// ==========================================
// Practice sessions are Exam documents too
// (isPractice: true) but they are generated per
// student, so every catalogue query filters them out.
// ==========================================

const MAX_LIMIT = 100;

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    MAX_LIMIT
  );

  return { page, limit, skip: (page - 1) * limit };
};

// Validates the question ids and returns the marks
// total, so an exam's totalMarks can never drift from
// the questions it actually contains.
const loadQuestions = async (questionIds) => {
  const unique = [
    ...new Set(questionIds.map((id) => String(id))),
  ];

  const invalid = unique.filter(
    (id) => !mongoose.isValidObjectId(id)
  );

  if (invalid.length) {
    return {
      error: "One or more question ids are malformed",
    };
  }

  const questions = await Question.find({
    _id: { $in: unique },
    isActive: true,
  })
    .select("marks")
    .lean();

  if (questions.length !== unique.length) {
    return {
      error:
        "One or more questions are invalid or inactive",
    };
  }

  return {
    ids: unique,
    totalMarks: questions.reduce(
      (total, question) => total + (question.marks || 1),
      0
    ),
  };
};

const stripQuestions = (exam) => {
  const { questions, ...rest } = exam;

  return {
    ...rest,
    questionCount: questions?.length || 0,
  };
};

// ==========================================
// CREATE EXAM  (admin / teacher)
// ==========================================

const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      examType,
      subjects,
      questions,
      duration,
      instructions,
      isPublished,
    } = req.body;

    if (
      !title ||
      !examType ||
      !questions ||
      !questions.length ||
      !duration
    ) {
      return res.status(400).json({
        message:
          "Title, exam type, questions and duration are required",
      });
    }

    if (!EXAM_TYPES.includes(examType)) {
      return res.status(400).json({
        message: `examType must be one of: ${EXAM_TYPES.join(
          ", "
        )}`,
      });
    }

    if (Number(duration) < 1) {
      return res.status(400).json({
        message: "Duration must be at least 1 minute",
      });
    }

    if (subjects?.length) {
      const subjectCount = await Subject.countDocuments({
        _id: { $in: subjects },
      });

      if (subjectCount !== subjects.length) {
        return res.status(400).json({
          message: "One or more subjects are invalid",
        });
      }
    }

    const resolved = await loadQuestions(questions);

    if (resolved.error) {
      return res.status(400).json({
        message: resolved.error,
      });
    }

    const exam = await Exam.create({
      title: String(title).trim(),
      description,
      examType,
      subjects: subjects || [],
      questions: resolved.ids,
      duration: Number(duration),
      totalMarks: resolved.totalMarks,
      instructions,
      isPublished: Boolean(isPublished),
      createdBy: req.user._id,
    });

    await exam.populate("subjects", "name slug");

    return res.status(201).json({
      message: "Exam created successfully",
      exam,
    });
  } catch (error) {
    console.error("Create exam error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET PUBLISHED EXAMS
// ==========================================

const getPublishedExams = async (req, res) => {
  try {
    const filter = {
      isActive: true,
      isPublished: true,
      isPractice: { $ne: true },
    };

    if (
      req.query.examType &&
      EXAM_TYPES.includes(req.query.examType)
    ) {
      filter.examType = req.query.examType;
    }

    if (req.query.subject) {
      const subjectFilter = mongoose.isValidObjectId(
        req.query.subject
      )
        ? { _id: req.query.subject }
        : { slug: String(req.query.subject).toLowerCase() };

      const subject = await Subject.findOne(subjectFilter)
        .select("_id")
        .lean();

      if (!subject) {
        return res.status(200).json({ exams: [] });
      }

      filter.subjects = subject._id;
    }

    if (req.query.search) {
      filter.title = {
        $regex: String(req.query.search).trim(),
        $options: "i",
      };
    }

    const exams = await Exam.find(filter)
      .populate("subjects", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      exams: exams.map(stripQuestions),
    });
  } catch (error) {
    console.error("Get exams error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET ONE EXAM
// ==========================================
// Visible when published, or when it is the viewer's
// own practice session, or to an admin previewing a
// draft. Practice sessions are never published, so
// without this a generated session would 404.

const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid exam id",
      });
    }

    const exam = await Exam.findOne({
      _id: id,
      isActive: true,
    })
      .populate("subjects", "name slug")
      .populate(
        "questions",
        "questionText options difficulty marks"
      );

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    const isOwnPractice =
      exam.isPractice &&
      String(exam.createdBy) === String(req.user._id);

    const canView =
      exam.isPublished ||
      isOwnPractice ||
      req.user.role === "admin";

    if (!canView) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    return res.status(200).json({
      exam,
    });
  } catch (error) {
    console.error("Get exam error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: LIST EXAMS
// ==========================================

const getExamsAdmin = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    // Generated practice sessions would swamp the list,
    // so they are opt-in via ?includePractice=true.
    const filter =
      req.query.includePractice === "true"
        ? {}
        : { isPractice: { $ne: true } };

    if (
      req.query.examType &&
      EXAM_TYPES.includes(req.query.examType)
    ) {
      filter.examType = req.query.examType;
    }

    if (req.query.isPublished !== undefined) {
      filter.isPublished = req.query.isPublished === "true";
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    if (
      req.query.subject &&
      mongoose.isValidObjectId(req.query.subject)
    ) {
      filter.subjects = req.query.subject;
    }

    if (req.query.search) {
      filter.title = {
        $regex: String(req.query.search).trim(),
        $options: "i",
      };
    }

    const [total, exams] = await Promise.all([
      Exam.countDocuments(filter),

      Exam.find(filter)
        .populate("subjects", "name slug")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const examIds = exams.map((exam) => exam._id);

    // Attempt counts tell an admin whether an exam is
    // safe to edit or delete.
    const attemptCounts = await ExamAttempt.aggregate([
      { $match: { exam: { $in: examIds } } },
      { $group: { _id: "$exam", count: { $sum: 1 } } },
    ]);

    const attemptMap = new Map(
      attemptCounts.map((row) => [
        String(row._id),
        row.count,
      ])
    );

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),

      exams: exams.map((exam) => ({
        ...stripQuestions(exam),
        attemptCount:
          attemptMap.get(String(exam._id)) || 0,
      })),
    });
  } catch (error) {
    console.error("Get exams (admin) error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: READ ONE (with answers)
// ==========================================

const getExamAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid exam id",
      });
    }

    const exam = await Exam.findById(id)
      .populate("subjects", "name slug")
      .populate({
        path: "questions",
        select:
          "questionText options correctAnswer explanation difficulty marks year examType subject topic",
        populate: [
          { path: "subject", select: "name slug" },
          { path: "topic", select: "title slug" },
        ],
      })
      .lean();

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    const attemptCount = await ExamAttempt.countDocuments({
      exam: exam._id,
    });

    return res.status(200).json({
      exam: { ...exam, attemptCount },
    });
  } catch (error) {
    console.error("Get exam (admin) error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: UPDATE
// ==========================================

const updateExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid exam id",
      });
    }

    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    if (exam.isPractice) {
      return res.status(400).json({
        message:
          "Practice sessions are generated automatically and cannot be edited",
      });
    }

    const {
      title,
      description,
      examType,
      subjects,
      questions,
      duration,
      instructions,
      isPublished,
      isActive,
    } = req.body;

    if (title !== undefined) {
      exam.title = String(title).trim();
    }

    if (description !== undefined) {
      exam.description = description;
    }

    if (instructions !== undefined) {
      exam.instructions = instructions;
    }

    if (examType !== undefined) {
      if (!EXAM_TYPES.includes(examType)) {
        return res.status(400).json({
          message: `examType must be one of: ${EXAM_TYPES.join(
            ", "
          )}`,
        });
      }

      exam.examType = examType;
    }

    if (duration !== undefined) {
      if (Number(duration) < 1) {
        return res.status(400).json({
          message: "Duration must be at least 1 minute",
        });
      }

      exam.duration = Number(duration);
    }

    if (subjects !== undefined) {
      if (!Array.isArray(subjects)) {
        return res.status(400).json({
          message: "subjects must be an array",
        });
      }

      if (subjects.length) {
        const subjectCount = await Subject.countDocuments({
          _id: { $in: subjects },
        });

        if (subjectCount !== subjects.length) {
          return res.status(400).json({
            message: "One or more subjects are invalid",
          });
        }
      }

      exam.subjects = subjects;
    }

    if (questions !== undefined) {
      if (!Array.isArray(questions) || !questions.length) {
        return res.status(400).json({
          message: "An exam needs at least one question",
        });
      }

      const resolved = await loadQuestions(questions);

      if (resolved.error) {
        return res.status(400).json({
          message: resolved.error,
        });
      }

      // Changing the question set after students have
      // sat the exam would invalidate their scores.
      const attemptCount =
        await ExamAttempt.countDocuments({
          exam: exam._id,
        });

      if (attemptCount > 0) {
        return res.status(400).json({
          message: `This exam already has ${attemptCount} attempt${
            attemptCount === 1 ? "" : "s"
          }. Duplicate it instead of changing its questions.`,
        });
      }

      exam.questions = resolved.ids;
      exam.totalMarks = resolved.totalMarks;
    }

    if (isPublished !== undefined) {
      exam.isPublished = Boolean(isPublished);
    }

    if (isActive !== undefined) {
      exam.isActive = Boolean(isActive);
    }

    await exam.save();

    await exam.populate("subjects", "name slug");

    return res.status(200).json({
      message: "Exam updated",
      exam: stripQuestions(exam.toObject()),
    });
  } catch (error) {
    console.error("Update exam error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: PUBLISH TOGGLE
// ==========================================

const setExamPublish = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid exam id",
      });
    }

    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    if (exam.isPractice) {
      return res.status(400).json({
        message: "Practice sessions cannot be published",
      });
    }

    // Accept an explicit value, otherwise flip it.
    const next =
      req.body.isPublished !== undefined
        ? Boolean(req.body.isPublished)
        : !exam.isPublished;

    if (next && !exam.questions.length) {
      return res.status(400).json({
        message:
          "Add at least one question before publishing",
      });
    }

    exam.isPublished = next;

    await exam.save();

    return res.status(200).json({
      message: next
        ? "Exam published"
        : "Exam unpublished",

      exam: {
        _id: exam._id,
        title: exam.title,
        isPublished: exam.isPublished,
      },
    });
  } catch (error) {
    console.error("Publish exam error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: DELETE
// ==========================================

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid exam id",
      });
    }

    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    const attemptCount = await ExamAttempt.countDocuments({
      exam: exam._id,
    });

    // Deleting would orphan those results, so an exam
    // with history is retired rather than removed.
    if (attemptCount > 0) {
      return res.status(400).json({
        message: `This exam has ${attemptCount} attempt${
          attemptCount === 1 ? "" : "s"
        } on record. Unpublish or deactivate it instead of deleting.`,
        attemptCount,
      });
    }

    await exam.deleteOne();

    return res.status(200).json({
      message: "Exam deleted",
      examId: id,
    });
  } catch (error) {
    console.error("Delete exam error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createExam,
  getPublishedExams,
  getExamById,
  getExamsAdmin,
  getExamAdminById,
  updateExam,
  setExamPublish,
  deleteExam,
};
