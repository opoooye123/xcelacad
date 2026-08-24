const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const Question = require("../models/Question");

// ==========================================
// PUBLIC CATALOGUE
// ==========================================
// Powers the marketing subject grid and the
// subject detail page. No authentication: this is
// the browsable shopfront.
// ==========================================

// ==========================================
// GET /api/catalog/subjects
// ==========================================

const getSubjectCatalog = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .select("name slug description")
      .sort({ name: 1 })
      .lean();

    if (!subjects.length) {
      return res.status(200).json({ subjects: [] });
    }

    const subjectIds = subjects.map(
      (subject) => subject._id
    );

    const [questionCounts, topicCounts] =
      await Promise.all([
        Question.aggregate([
          {
            $match: {
              subject: { $in: subjectIds },
              isActive: true,
            },
          },
          {
            $group: {
              _id: "$subject",
              questionCount: { $sum: 1 },
              years: { $addToSet: "$year" },
              examTypes: { $addToSet: "$examType" },
            },
          },
        ]),

        Topic.aggregate([
          {
            $match: {
              subject: { $in: subjectIds },
              isActive: true,
            },
          },
          {
            $group: {
              _id: "$subject",
              topicCount: { $sum: 1 },
            },
          },
        ]),
      ]);

    const questionMap = new Map(
      questionCounts.map((row) => [
        String(row._id),
        row,
      ])
    );

    const topicMap = new Map(
      topicCounts.map((row) => [
        String(row._id),
        row.topicCount,
      ])
    );

    const enriched = subjects.map((subject) => {
      const stats = questionMap.get(String(subject._id));

      return {
        ...subject,

        questionCount: stats?.questionCount || 0,

        topicCount: topicMap.get(String(subject._id)) || 0,

        years: (stats?.years || [])
          .filter(Boolean)
          .sort((a, b) => b - a),

        examTypes: (stats?.examTypes || []).sort(),
      };
    });

    return res.status(200).json({
      count: enriched.length,
      subjects: enriched,
    });
  } catch (error) {
    console.error("Get subject catalog error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET /api/catalog/subjects/:slug
// ==========================================
// Accepts a slug or an id so links stay flexible.

const getSubjectDetail = async (req, res) => {
  try {
    const { slug } = req.params;

    const subject = await Subject.findOne({
      isActive: true,
      slug: String(slug).toLowerCase(),
    })
      .select("name slug description")
      .lean();

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const [topics, breakdown] = await Promise.all([
      Topic.find({
        subject: subject._id,
        isActive: true,
      })
        .select("title slug description")
        .sort({ title: 1 })
        .lean(),

      Question.aggregate([
        {
          $match: {
            subject: subject._id,
            isActive: true,
          },
        },
        {
          $facet: {
            byTopic: [
              {
                $group: {
                  _id: "$topic",
                  count: { $sum: 1 },
                },
              },
            ],

            byYear: [
              {
                $group: {
                  _id: "$year",
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: -1 } },
            ],

            byExamType: [
              {
                $group: {
                  _id: "$examType",
                  count: { $sum: 1 },
                },
              },
            ],

            byDifficulty: [
              {
                $group: {
                  _id: "$difficulty",
                  count: { $sum: 1 },
                },
              },
            ],

            total: [{ $count: "count" }],
          },
        },
      ]),
    ]);

    const facets = breakdown[0] || {};

    const topicCountMap = new Map(
      (facets.byTopic || []).map((row) => [
        String(row._id),
        row.count,
      ])
    );

    return res.status(200).json({
      subject: {
        ...subject,

        questionCount: facets.total?.[0]?.count || 0,

        topics: topics.map((topic) => ({
          ...topic,
          questionCount:
            topicCountMap.get(String(topic._id)) || 0,
        })),

        years: (facets.byYear || [])
          .filter((row) => Boolean(row._id))
          .map((row) => ({
            year: row._id,
            count: row.count,
          })),

        examTypes: (facets.byExamType || []).map(
          (row) => ({
            examType: row._id,
            count: row.count,
          })
        ),

        difficulties: (facets.byDifficulty || []).map(
          (row) => ({
            difficulty: row._id,
            count: row.count,
          })
        ),
      },
    });
  } catch (error) {
    console.error("Get subject detail error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getSubjectCatalog,
  getSubjectDetail,
};
