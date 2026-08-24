const mongoose = require("mongoose");

const Question = require("../models/Question");
const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");

const {
  EXAM_TYPES,
  DIFFICULTIES,
  EXAM_TYPE_LABELS,
} = require("../config/constants");

// ==========================================
// PRACTICE SESSIONS
// ==========================================
// A practice session is a throwaway Exam document
// (isPractice: true, createdBy: student) built from
// a random sample of the question bank, plus an
// ExamAttempt. It returns the exact payload shape
// startExam returns so the CBT screen needs no
// special handling.
// ==========================================

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 100;
const DEFAULT_QUESTIONS = 20;

// One minute per question, never less than five.
const durationFor = (questionCount) =>
  Math.max(5, questionCount);

// Accepts an ObjectId or a slug so the client can
// link by either.
const resolveSubject = async (value) => {
  if (!value) return null;

  if (mongoose.isValidObjectId(value)) {
    return Subject.findOne({
      _id: value,
      isActive: true,
    }).lean();
  }

  return Subject.findOne({
    slug: String(value).toLowerCase(),
    isActive: true,
  }).lean();
};

const resolveTopic = async (value, subjectId) => {
  if (!value) return null;

  const filter = { subject: subjectId, isActive: true };

  if (mongoose.isValidObjectId(value)) {
    filter._id = value;
  } else {
    filter.slug = String(value).toLowerCase();
  }

  return Topic.findOne(filter).lean();
};

// ==========================================
// POST /api/practice/sessions
// ==========================================

const createPracticeSession = async (req, res) => {
  try {
    const {
      subject,
      topic,
      year,
      examType,
      difficulty,
      questionCount,
      duration,
    } = req.body;

    if (!subject) {
      return res.status(400).json({
        message: "Subject is required",
      });
    }

    const subjectDoc = await resolveSubject(subject);

    if (!subjectDoc) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const match = {
      subject: subjectDoc._id,
      isActive: true,
    };

    // ==========================================
    // OPTIONAL FILTERS
    // ==========================================

    let topicDoc = null;

    if (topic) {
      topicDoc = await resolveTopic(topic, subjectDoc._id);

      if (!topicDoc) {
        return res.status(404).json({
          message: "Topic not found for this subject",
        });
      }

      match.topic = topicDoc._id;
    }

    if (year) {
      const parsedYear = Number(year);

      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 1980
      ) {
        return res.status(400).json({
          message: "Invalid year",
        });
      }

      match.year = parsedYear;
    }

    if (examType) {
      if (!EXAM_TYPES.includes(examType)) {
        return res.status(400).json({
          message: `examType must be one of: ${EXAM_TYPES.join(
            ", "
          )}`,
        });
      }

      match.examType = examType;
    }

    if (difficulty) {
      if (!DIFFICULTIES.includes(difficulty)) {
        return res.status(400).json({
          message: `difficulty must be one of: ${DIFFICULTIES.join(
            ", "
          )}`,
        });
      }

      match.difficulty = difficulty;
    }

    // ==========================================
    // HOW MANY QUESTIONS CAN WE ACTUALLY SERVE?
    // ==========================================

    const available = await Question.countDocuments(match);

    if (available === 0) {
      return res.status(404).json({
        message:
          "No questions match those filters yet. Try a wider selection.",
      });
    }

    if (available < MIN_QUESTIONS) {
      return res.status(400).json({
        message: `Only ${available} question${
          available === 1 ? "" : "s"
        } match those filters. A practice session needs at least ${MIN_QUESTIONS}.`,
      });
    }

    const requested = Number(questionCount) || DEFAULT_QUESTIONS;

    const size = Math.min(
      Math.max(requested, MIN_QUESTIONS),
      MAX_QUESTIONS,
      available
    );

    // ==========================================
    // SAMPLE THE BANK
    // ==========================================
    // correctAnswer and explanation are projected
    // away so they never reach the browser mid-exam.

    const sampled = await Question.aggregate([
      { $match: match },
      { $sample: { size } },
      {
        $project: {
          questionText: 1,
          options: 1,
          difficulty: 1,
          marks: 1,
        },
      },
    ]);

    if (!sampled.length) {
      return res.status(404).json({
        message: "Could not build a practice session",
      });
    }

    const totalMarks = sampled.reduce(
      (sum, question) => sum + (question.marks || 1),
      0
    );

    const sessionDuration =
      Number(duration) > 0
        ? Math.min(Number(duration), 300)
        : durationFor(sampled.length);

    // ==========================================
    // BUILD THE THROWAWAY EXAM
    // ==========================================

    const labelParts = [subjectDoc.name];

    if (topicDoc) labelParts.push(topicDoc.title);
    if (match.year) labelParts.push(String(match.year));
    if (match.examType) {
      labelParts.push(
        EXAM_TYPE_LABELS[match.examType] || match.examType
      );
    }

    const exam = await Exam.create({
      title: `Practice · ${labelParts.join(" · ")}`,

      description: `Randomised practice session — ${
        sampled.length
      } question${sampled.length === 1 ? "" : "s"}, ${
        sessionDuration
      } minutes.`,

      examType: "practice",
      subjects: [subjectDoc._id],
      questions: sampled.map((question) => question._id),
      duration: sessionDuration,
      totalMarks,

      instructions:
        "Practice mode. Your score is saved to your history but practice sessions are kept off the public leaderboard.",

      isPublished: false,
      isActive: true,
      isPractice: true,
      createdBy: req.user._id,
    });

    const startedAt = new Date();

    const attempt = await ExamAttempt.create({
      student: req.user._id,
      exam: exam._id,
      startedAt,
      totalMarks,
      answers: [],
    });

    const endTime = new Date(
      startedAt.getTime() + sessionDuration * 60 * 1000
    );

    return res.status(201).json({
      message: "Practice session ready",

      attempt: {
        _id: attempt._id,
        exam: exam._id,
        startedAt,
        endTime,
        duration: sessionDuration,
        totalMarks,
        questions: sampled,
        answers: [],
      },

      session: {
        title: exam.title,
        isPractice: true,
        subject: {
          _id: subjectDoc._id,
          name: subjectDoc.name,
          slug: subjectDoc.slug,
        },
        topic: topicDoc
          ? { _id: topicDoc._id, title: topicDoc.title }
          : null,
        year: match.year || null,
        examType: match.examType || null,
        difficulty: match.difficulty || null,
        questionCount: sampled.length,
        available,
      },
    });
  } catch (error) {
    console.error("Create practice session error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET /api/practice/options
// ==========================================
// Everything the practice picker needs to build its
// dropdowns without a request per subject.

const getPracticeOptions = async (req, res) => {
  try {
    const summary = await Question.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$subject",
          questionCount: { $sum: 1 },
          years: { $addToSet: "$year" },
          examTypes: { $addToSet: "$examType" },
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      { $match: { "subject.isActive": true } },
      {
        $project: {
          _id: 0,
          subjectId: "$_id",
          name: "$subject.name",
          slug: "$subject.slug",
          questionCount: 1,
          years: 1,
          examTypes: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    const subjectIds = summary.map((row) => row.subjectId);

    const topics = await Topic.find({
      subject: { $in: subjectIds },
      isActive: true,
    })
      .select("title slug subject")
      .sort({ title: 1 })
      .lean();

    const topicsBySubject = new Map();

    topics.forEach((topic) => {
      const key = String(topic.subject);

      if (!topicsBySubject.has(key)) {
        topicsBySubject.set(key, []);
      }

      topicsBySubject.get(key).push({
        _id: topic._id,
        title: topic.title,
        slug: topic.slug,
      });
    });

    return res.status(200).json({
      minQuestions: MIN_QUESTIONS,
      maxQuestions: MAX_QUESTIONS,
      defaultQuestions: DEFAULT_QUESTIONS,
      difficulties: DIFFICULTIES,

      subjects: summary.map((row) => ({
        ...row,

        years: (row.years || [])
          .filter(Boolean)
          .sort((a, b) => b - a),

        examTypes: (row.examTypes || []).sort(),

        topics:
          topicsBySubject.get(String(row.subjectId)) || [],
      })),
    });
  } catch (error) {
    console.error("Get practice options error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createPracticeSession,
  getPracticeOptions,
};
