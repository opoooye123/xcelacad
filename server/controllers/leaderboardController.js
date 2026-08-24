const mongoose = require("mongoose");

const ExamAttempt = require("../models/ExamAttempt");
const Subject = require("../models/Subject");

// ==========================================
// LEADERBOARD
// ==========================================
// Ranks students by average percentage across their
// completed attempts. Public, but personalised when
// a token is present (optionalAuth) so a student can
// see their own row even if it falls outside the top
// slice.
//
// Only name and avatar are exposed — never email.
// ==========================================

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Safety net so one aggregation can never pull an
// unbounded number of rows into memory. Ranking
// beyond this many students is not meaningful here.
const RANKING_CEILING = 5000;

const PERIODS = ["all", "today", "week", "month"];
const SCOPES = ["exams", "practice", "all"];

const periodStart = (period) => {
  const now = new Date();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }

  if (period === "month") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return start;
  }

  return null;
};

const percentageExpression = {
  $multiply: [
    { $divide: ["$score", "$totalMarks"] },
    100,
  ],
};

const round = (value) =>
  Number((value || 0).toFixed(1));

// ==========================================
// GET /api/leaderboard
// ==========================================

const getLeaderboard = async (req, res) => {
  try {
    const scope = SCOPES.includes(req.query.scope)
      ? req.query.scope
      : "exams";

    const period = PERIODS.includes(req.query.period)
      ? req.query.period
      : "all";

    const limit = Math.min(
      Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );

    const minAttempts = Math.max(
      Number(req.query.minAttempts) || 1,
      1
    );

    // ==========================================
    // SUBJECT SCOPE
    // ==========================================

    let subjectDoc = null;

    if (req.query.subject) {
      const filter = { isActive: true };

      if (mongoose.isValidObjectId(req.query.subject)) {
        filter._id = req.query.subject;
      } else {
        filter.slug = String(
          req.query.subject
        ).toLowerCase();
      }

      subjectDoc = await Subject.findOne(filter)
        .select("name slug")
        .lean();

      if (!subjectDoc) {
        return res.status(404).json({
          message: "Subject not found",
        });
      }
    }

    // ==========================================
    // PIPELINE
    // ==========================================

    const attemptMatch = {
      status: { $in: ["submitted", "expired"] },
      totalMarks: { $gt: 0 },
    };

    const start = periodStart(period);

    if (start) {
      attemptMatch.submittedAt = { $gte: start };
    }

    const examMatch = {};

    if (scope === "exams") {
      examMatch["exam.isPractice"] = { $ne: true };
    } else if (scope === "practice") {
      examMatch["exam.isPractice"] = true;
    }

    if (subjectDoc) {
      examMatch["exam.subjects"] = subjectDoc._id;
    }

    const pipeline = [
      { $match: attemptMatch },
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam",
        },
      },
      { $unwind: "$exam" },
    ];

    if (Object.keys(examMatch).length) {
      pipeline.push({ $match: examMatch });
    }

    pipeline.push(
      {
        $group: {
          _id: "$student",
          attempts: { $sum: 1 },
          totalScore: { $sum: "$score" },
          totalPossible: { $sum: "$totalMarks" },
          averagePercentage: {
            $avg: percentageExpression,
          },
          bestPercentage: {
            $max: percentageExpression,
          },
          lastAttemptAt: { $max: "$submittedAt" },
        },
      },

      { $match: { attempts: { $gte: minAttempts } } },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },

      // Suspended accounts drop off the board
      { $match: { "student.isBlocked": { $ne: true } } },

      {
        $sort: {
          averagePercentage: -1,
          attempts: -1,
          lastAttemptAt: 1,
        },
      },

      { $limit: RANKING_CEILING },

      {
        $project: {
          _id: 0,
          studentId: "$_id",
          name: "$student.name",
          avatar: "$student.avatar",
          attempts: 1,
          totalScore: 1,
          totalPossible: 1,
          averagePercentage: 1,
          bestPercentage: 1,
          lastAttemptAt: 1,
        },
      }
    );

    const ranked = await ExamAttempt.aggregate(pipeline);

    const rows = ranked.map((row, index) => ({
      rank: index + 1,

      student: {
        _id: row.studentId,
        name: row.name,
        avatar: row.avatar || "",
      },

      attempts: row.attempts,
      totalScore: row.totalScore,
      totalPossible: row.totalPossible,
      averagePercentage: round(row.averagePercentage),
      bestPercentage: round(row.bestPercentage),
      lastAttemptAt: row.lastAttemptAt,
    }));

    // ==========================================
    // THE VIEWER'S OWN ROW
    // ==========================================

    let me = null;

    if (req.user) {
      const mine = rows.find(
        (row) =>
          String(row.student._id) ===
          String(req.user._id)
      );

      me = mine || null;
    }

    return res.status(200).json({
      scope,
      period,
      minAttempts,

      subject: subjectDoc
        ? {
            _id: subjectDoc._id,
            name: subjectDoc.name,
            slug: subjectDoc.slug,
          }
        : null,

      total: rows.length,

      // `me` is computed against the full ranking, so
      // it stays correct even when the viewer is far
      // outside the returned slice.
      me,

      rows: rows.slice(0, limit),
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getLeaderboard,
};
