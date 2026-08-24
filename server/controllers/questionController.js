const mongoose = require("mongoose");

const Question = require("../models/Question");
const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const Exam = require("../models/Exam");

const { ANSWER_KEYS } = require("../config/constants");

// ==========================================
// SHARED VALIDATION
// ==========================================

const validateQuestionShape = (payload) => {
  const {
    questionText,
    options,
    correctAnswer,
    examType,
  } = payload;

  if (!questionText || !String(questionText).trim()) {
    return "questionText is required";
  }

  if (!options || typeof options !== "object") {
    return "options (A, B, C, D) are required";
  }

  const missing = ANSWER_KEYS.filter(
    (key) => !options[key] || !String(options[key]).trim()
  );

  if (missing.length) {
    return `Missing option(s): ${missing.join(", ")}`;
  }

  if (!correctAnswer) {
    return "correctAnswer is required";
  }

  if (
    !ANSWER_KEYS.includes(
      String(correctAnswer).trim().toUpperCase()
    )
  ) {
    return "correctAnswer must be one of A, B, C or D";
  }

  if (!examType) {
    return "examType is required";
  }

  return null;
};

// Accepts an ObjectId, a name, or a slug so pasted
// bulk imports don't have to carry raw ids.
const resolveSubject = async (value, cache) => {
  if (!value) return null;

  const key = String(value).trim();

  if (cache.has(`s:${key}`)) {
    return cache.get(`s:${key}`);
  }

  let subject = null;

  if (mongoose.Types.ObjectId.isValid(key)) {
    subject = await Subject.findById(key);
  }

  if (!subject) {
    subject = await Subject.findOne({
      $or: [
        { slug: key.toLowerCase() },
        { name: new RegExp(`^${key}$`, "i") },
      ],
    });
  }

  cache.set(`s:${key}`, subject);

  return subject;
};

const resolveTopic = async (value, subjectId, cache) => {
  if (!value) return null;

  const key = String(value).trim();
  const cacheKey = `t:${subjectId}:${key}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  let topic = null;

  if (mongoose.Types.ObjectId.isValid(key)) {
    topic = await Topic.findOne({
      _id: key,
      subject: subjectId,
    });
  }

  if (!topic) {
    topic = await Topic.findOne({
      subject: subjectId,
      $or: [
        { slug: key.toLowerCase() },
        { title: new RegExp(`^${key}$`, "i") },
      ],
    });
  }

  cache.set(cacheKey, topic);

  return topic;
};

// ==========================================
// CREATE QUESTION
// ==========================================

const createQuestion = async (req, res) => {
  try {
    const {
      subject,
      topic,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      examType,
      year,
      marks,
    } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({
        message: "Subject and topic are required",
      });
    }

    const shapeError = validateQuestionShape(req.body);

    if (shapeError) {
      return res.status(400).json({
        message: shapeError,
      });
    }

    const existingSubject = await Subject.findById(subject);

    if (!existingSubject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const existingTopic = await Topic.findOne({
      _id: topic,
      subject,
    });

    if (!existingTopic) {
      return res.status(404).json({
        message: "Topic not found for this subject",
      });
    }

    const question = await Question.create({
      subject,
      topic,
      questionText: questionText.trim(),
      options: {
        A: String(options.A).trim(),
        B: String(options.B).trim(),
        C: String(options.C).trim(),
        D: String(options.D).trim(),
      },
      correctAnswer: String(correctAnswer)
        .trim()
        .toUpperCase(),
      explanation: explanation?.trim() || "",
      difficulty,
      examType,
      year,
      marks,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Question created successfully",
      question,
    });
  } catch (error) {
    console.error("Create question error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// BULK CREATE QUESTIONS (ADMIN)
// ==========================================
// Body: {
//   defaults: { subject, topic, examType, year, difficulty, marks },
//   questions: [ { questionText, options, correctAnswer, ... } ]
// }
// Per-row values override the defaults. Subject and
// topic accept an id, a slug, or a name.
// ==========================================

const bulkCreateQuestions = async (req, res) => {
  try {
    const { questions, defaults = {} } = req.body;

    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({
        message:
          "Provide a non-empty 'questions' array",
      });
    }

    if (questions.length > 500) {
      return res.status(400).json({
        message:
          "Please import at most 500 questions at a time",
      });
    }

    const cache = new Map();

    const prepared = [];
    const failed = [];

    for (let index = 0; index < questions.length; index += 1) {
      const row = questions[index] || {};

      const merged = {
        ...defaults,
        ...row,
        options: row.options || defaults.options,
      };

      const rowNumber = index + 1;

      const shapeError = validateQuestionShape(merged);

      if (shapeError) {
        failed.push({
          row: rowNumber,
          questionText: merged.questionText || "",
          reason: shapeError,
        });
        continue;
      }

      const subject = await resolveSubject(
        merged.subject,
        cache
      );

      if (!subject) {
        failed.push({
          row: rowNumber,
          questionText: merged.questionText,
          reason: `Subject not found: "${
            merged.subject ?? ""
          }"`,
        });
        continue;
      }

      const topic = await resolveTopic(
        merged.topic,
        subject._id,
        cache
      );

      if (!topic) {
        failed.push({
          row: rowNumber,
          questionText: merged.questionText,
          reason: `Topic not found in ${
            subject.name
          }: "${merged.topic ?? ""}"`,
        });
        continue;
      }

      prepared.push({
        subject: subject._id,
        topic: topic._id,
        questionText: String(
          merged.questionText
        ).trim(),
        options: {
          A: String(merged.options.A).trim(),
          B: String(merged.options.B).trim(),
          C: String(merged.options.C).trim(),
          D: String(merged.options.D).trim(),
        },
        correctAnswer: String(merged.correctAnswer)
          .trim()
          .toUpperCase(),
        explanation: merged.explanation
          ? String(merged.explanation).trim()
          : "",
        difficulty: merged.difficulty || "medium",
        examType: merged.examType,
        year: merged.year,
        marks: merged.marks || 1,
        isActive: true,
        createdBy: req.user._id,
      });
    }

    let inserted = [];

    if (prepared.length) {
      // ordered:false so one bad row cannot abort the batch
      inserted = await Question.insertMany(prepared, {
        ordered: false,
      });
    }

    return res.status(201).json({
      message: `Imported ${inserted.length} of ${questions.length} question(s)`,
      insertedCount: inserted.length,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    console.error("Bulk create questions error:", error);

    return res.status(500).json({
      message: "Server error during bulk import",
    });
  }
};

// ==========================================
// GET QUESTIONS (STUDENT — answers hidden)
// ==========================================

const getQuestions = async (req, res) => {
  try {
    const {
      subject,
      topic,
      examType,
      difficulty,
      year,
    } = req.query;

    const filter = {
      isActive: true,
    };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (examType) filter.examType = examType;
    if (difficulty) filter.difficulty = difficulty;
    if (year) filter.year = Number(year);

    const questions = await Question.find(filter)
      .populate("subject", "name slug")
      .populate("topic", "title slug")
      .select("-correctAnswer -explanation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Get questions error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET QUESTIONS (ADMIN — includes answers)
// ==========================================

const getQuestionsAdmin = async (req, res) => {
  try {
    const {
      subject,
      topic,
      examType,
      difficulty,
      year,
      search,
      isActive,
      page = 1,
      limit = 25,
    } = req.query;

    const filter = {};

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (examType) filter.examType = examType;
    if (difficulty) filter.difficulty = difficulty;
    if (year) filter.year = Number(year);

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.questionText = {
        $regex: String(search).trim(),
        $options: "i",
      };
    }

    const pageNumber = Math.max(1, Number(page) || 1);

    const pageSize = Math.min(
      100,
      Math.max(1, Number(limit) || 25)
    );

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("subject", "name slug")
        .populate("topic", "title slug")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),

      Question.countDocuments(filter),
    ]);

    res.status(200).json({
      questions,
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch (error) {
    console.error("Get admin questions error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET QUESTION BY ID (STUDENT)
// ==========================================

const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate("subject", "name slug")
      .populate("topic", "title slug")
      .select("-correctAnswer");

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.status(200).json({
      question,
    });
  } catch (error) {
    console.error("Get question error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE QUESTION (ADMIN)
// ==========================================

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      subject,
      topic,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      examType,
      year,
      marks,
      isActive,
    } = req.body;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // Subject / topic must stay consistent with each other
    const nextSubjectId = subject || question.subject;

    if (subject && subject !== String(question.subject)) {
      const existingSubject = await Subject.findById(subject);

      if (!existingSubject) {
        return res.status(404).json({
          message: "Subject not found",
        });
      }

      question.subject = subject;
    }

    if (topic) {
      const existingTopic = await Topic.findOne({
        _id: topic,
        subject: nextSubjectId,
      });

      if (!existingTopic) {
        return res.status(404).json({
          message: "Topic not found for this subject",
        });
      }

      question.topic = topic;
    }

    if (options !== undefined) {
      const missing = ANSWER_KEYS.filter(
        (key) =>
          !options[key] || !String(options[key]).trim()
      );

      if (missing.length) {
        return res.status(400).json({
          message: `Missing option(s): ${missing.join(
            ", "
          )}`,
        });
      }

      question.options = {
        A: String(options.A).trim(),
        B: String(options.B).trim(),
        C: String(options.C).trim(),
        D: String(options.D).trim(),
      };
    }

    if (correctAnswer !== undefined) {
      const next = String(correctAnswer)
        .trim()
        .toUpperCase();

      if (!ANSWER_KEYS.includes(next)) {
        return res.status(400).json({
          message:
            "correctAnswer must be one of A, B, C or D",
        });
      }

      question.correctAnswer = next;
    }

    if (questionText !== undefined) {
      question.questionText = questionText.trim();
    }

    if (explanation !== undefined) {
      question.explanation = explanation.trim();
    }

    if (difficulty !== undefined) {
      question.difficulty = difficulty;
    }

    if (examType !== undefined) {
      question.examType = examType;
    }

    if (year !== undefined) {
      question.year = year;
    }

    if (marks !== undefined) {
      question.marks = marks;
    }

    if (isActive !== undefined) {
      question.isActive = isActive;
    }

    await question.save();

    return res.status(200).json({
      message: "Question updated successfully",
      question,
    });
  } catch (error) {
    console.error("Update question error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE QUESTION (ADMIN)
// ==========================================

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // Deleting a question that an exam still uses would
    // corrupt existing attempts and results.
    const usedBy = await Exam.countDocuments({
      questions: id,
      isPractice: { $ne: true },
    });

    if (usedBy > 0) {
      return res.status(400).json({
        message: `This question is used by ${usedBy} exam(s). Remove it from those exams first, or deactivate it instead.`,
        examCount: usedBy,
      });
    }

    await question.deleteOne();

    return res.status(200).json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// FILTER METADATA (ADMIN)
// ==========================================
// Powers the "year" dropdowns without a full scan
// on the client.

const getQuestionYears = async (req, res) => {
  try {
    const { subject, examType } = req.query;

    const filter = { isActive: true };

    if (subject) filter.subject = subject;
    if (examType) filter.examType = examType;

    const years = await Question.distinct("year", filter);

    res.status(200).json({
      years: years
        .filter((year) => Boolean(year))
        .sort((a, b) => b - a),
    });
  } catch (error) {
    console.error("Get question years error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createQuestion,
  bulkCreateQuestions,
  getQuestions,
  getQuestionsAdmin,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionYears,
};
