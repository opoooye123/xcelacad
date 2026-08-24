const mongoose = require("mongoose");

const ExamAttempt = require("../models/ExamAttempt");

// ==========================================
// PERSONAL ANALYTICS
// ==========================================
// Accuracy per subject / topic / difficulty, plus a
// score trend and a recent-activity strip. All
// derived from the answers already stored on each
// attempt, so nothing extra is written at exam time.
// ==========================================

const TREND_LIMIT = 12;
const ACTIVITY_DAYS = 14;

// A topic needs a few answers before its accuracy is
// worth acting on, otherwise one unlucky question
// makes it look like a weakness.
const MIN_ANSWERS_FOR_WEAKNESS = 3;
const WEAKNESS_THRESHOLD = 60;

const round = (value) => Number((value || 0).toFixed(1));

const accuracy = (correct, answered) =>
  answered > 0 ? round((correct / answered) * 100) : 0;

const dayKey = (date) =>
  new Date(date).toISOString().slice(0, 10);

// ==========================================
// GET /api/analytics/me
// ==========================================

const getMyAnalytics = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(
      req.user._id
    );

    const completed = {
      student: studentId,
      status: { $in: ["submitted", "expired"] },
    };

    // ==========================================
    // ANSWER-LEVEL BREAKDOWN
    // ==========================================

    const [breakdown] = await ExamAttempt.aggregate([
      { $match: completed },
      { $unwind: "$answers" },
      {
        $lookup: {
          from: "questions",
          localField: "answers.question",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: "$question" },
      {
        $addFields: {
          // A cleared answer is stored as null, so it
          // counts as skipped rather than wrong.
          isAnswered: {
            $ne: ["$answers.selectedAnswer", null],
          },
          isCorrect: {
            $eq: [
              "$answers.selectedAnswer",
              "$question.correctAnswer",
            ],
          },
        },
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                seen: { $sum: 1 },
                answered: {
                  $sum: {
                    $cond: ["$isAnswered", 1, 0],
                  },
                },
                correct: {
                  $sum: { $cond: ["$isCorrect", 1, 0] },
                },
              },
            },
          ],

          bySubject: [
            {
              $group: {
                _id: "$question.subject",
                answered: {
                  $sum: {
                    $cond: ["$isAnswered", 1, 0],
                  },
                },
                correct: {
                  $sum: { $cond: ["$isCorrect", 1, 0] },
                },
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
            {
              $project: {
                _id: 0,
                subjectId: "$_id",
                name: "$subject.name",
                slug: "$subject.slug",
                answered: 1,
                correct: 1,
              },
            },
          ],

          byTopic: [
            { $match: { "question.topic": { $ne: null } } },
            {
              $group: {
                _id: "$question.topic",
                answered: {
                  $sum: {
                    $cond: ["$isAnswered", 1, 0],
                  },
                },
                correct: {
                  $sum: { $cond: ["$isCorrect", 1, 0] },
                },
              },
            },
            {
              $lookup: {
                from: "topics",
                localField: "_id",
                foreignField: "_id",
                as: "topic",
              },
            },
            { $unwind: "$topic" },
            {
              $lookup: {
                from: "subjects",
                localField: "topic.subject",
                foreignField: "_id",
                as: "subject",
              },
            },
            { $unwind: "$subject" },
            {
              $project: {
                _id: 0,
                topicId: "$_id",
                title: "$topic.title",
                slug: "$topic.slug",
                subjectName: "$subject.name",
                subjectSlug: "$subject.slug",
                answered: 1,
                correct: 1,
              },
            },
          ],

          byDifficulty: [
            {
              $group: {
                _id: "$question.difficulty",
                answered: {
                  $sum: {
                    $cond: ["$isAnswered", 1, 0],
                  },
                },
                correct: {
                  $sum: { $cond: ["$isCorrect", 1, 0] },
                },
              },
            },
          ],

          byExamType: [
            {
              $group: {
                _id: "$question.examType",
                answered: {
                  $sum: {
                    $cond: ["$isAnswered", 1, 0],
                  },
                },
                correct: {
                  $sum: { $cond: ["$isCorrect", 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const facets = breakdown || {};

    // ==========================================
    // ATTEMPT-LEVEL SUMMARY + TREND
    // ==========================================

    const activityStart = new Date();
    activityStart.setHours(0, 0, 0, 0);
    activityStart.setDate(
      activityStart.getDate() - (ACTIVITY_DAYS - 1)
    );

    const [summaryRows, recent, activity, inProgress] =
      await Promise.all([
        ExamAttempt.aggregate([
          { $match: { ...completed, totalMarks: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              attempts: { $sum: 1 },
              averagePercentage: {
                $avg: {
                  $multiply: [
                    { $divide: ["$score", "$totalMarks"] },
                    100,
                  ],
                },
              },
              bestPercentage: {
                $max: {
                  $multiply: [
                    { $divide: ["$score", "$totalMarks"] },
                    100,
                  ],
                },
              },
              totalScore: { $sum: "$score" },
              totalPossible: { $sum: "$totalMarks" },
            },
          },
        ]),

        // Newest first for the query, reversed below so
        // the chart reads left to right in time order.
        ExamAttempt.find(completed)
          .select(
            "score totalMarks submittedAt status exam"
          )
          .populate("exam", "title examType isPractice")
          .sort({ submittedAt: -1 })
          .limit(TREND_LIMIT)
          .lean(),

        ExamAttempt.aggregate([
          {
            $match: {
              ...completed,
              submittedAt: { $gte: activityStart },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$submittedAt",
                },
              },
              attempts: { $sum: 1 },
            },
          },
        ]),

        ExamAttempt.countDocuments({
          student: studentId,
          status: "in-progress",
        }),
      ]);

    const summary = summaryRows[0] || null;

    // Fill the gaps so the strip always has one cell
    // per day, including days with no activity.
    const activityMap = new Map(
      activity.map((row) => [row._id, row.attempts])
    );

    const activityByDay = [];

    for (let offset = 0; offset < ACTIVITY_DAYS; offset += 1) {
      const day = new Date(activityStart);
      day.setDate(day.getDate() + offset);

      const key = dayKey(day);

      activityByDay.push({
        date: key,
        attempts: activityMap.get(key) || 0,
      });
    }

    const bySubject = (facets.bySubject || [])
      .map((row) => ({
        ...row,
        accuracy: accuracy(row.correct, row.answered),
      }))
      .sort((a, b) => b.answered - a.answered);

    const byTopic = (facets.byTopic || [])
      .map((row) => ({
        ...row,
        accuracy: accuracy(row.correct, row.answered),
      }))
      .sort((a, b) => b.answered - a.answered);

    const overall = facets.overall?.[0] || {
      seen: 0,
      answered: 0,
      correct: 0,
    };

    // Topics worth revising — feeds the dashboard's
    // "recommended practice" cards.
    const weakestTopics = byTopic
      .filter(
        (row) =>
          row.answered >= MIN_ANSWERS_FOR_WEAKNESS &&
          row.accuracy < WEAKNESS_THRESHOLD
      )
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return res.status(200).json({
      summary: {
        attempts: summary?.attempts || 0,
        inProgress,

        averagePercentage: round(
          summary?.averagePercentage
        ),
        bestPercentage: round(summary?.bestPercentage),

        totalScore: summary?.totalScore || 0,
        totalPossible: summary?.totalPossible || 0,

        questionsSeen: overall.seen,
        questionsAnswered: overall.answered,
        questionsCorrect: overall.correct,
        questionsSkipped: overall.seen - overall.answered,

        accuracy: accuracy(
          overall.correct,
          overall.answered
        ),
      },

      trend: recent
        .slice()
        .reverse()
        .map((attempt) => ({
          attemptId: attempt._id,
          exam: attempt.exam,
          score: attempt.score || 0,
          totalMarks: attempt.totalMarks || 0,
          percentage:
            attempt.totalMarks > 0
              ? round(
                  (attempt.score / attempt.totalMarks) *
                    100
                )
              : 0,
          status: attempt.status,
          submittedAt: attempt.submittedAt,
        })),

      bySubject,
      byTopic,
      weakestTopics,

      byDifficulty: (facets.byDifficulty || []).map(
        (row) => ({
          difficulty: row._id,
          answered: row.answered,
          correct: row.correct,
          accuracy: accuracy(row.correct, row.answered),
        })
      ),

      byExamType: (facets.byExamType || []).map((row) => ({
        examType: row._id,
        answered: row.answered,
        correct: row.correct,
        accuracy: accuracy(row.correct, row.answered),
      })),

      activityByDay,
    });
  } catch (error) {
    console.error("Get analytics error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getMyAnalytics,
};
