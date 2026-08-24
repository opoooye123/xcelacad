const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const Question = require("../models/Question");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const StudyMaterial = require("../models/StudyMaterial");
const User = require("../models/User");

// ==========================================
// ADMIN OVERVIEW
// ==========================================
// Everything the dashboard landing page needs in
// one round trip.

const getOverview = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      subjects,
      activeSubjects,
      topics,
      questions,
      activeQuestions,
      exams,
      publishedExams,
      materials,
      publishedMaterials,
      users,
      admins,
      attempts,
      attemptsToday,
      inProgress,
      recentAttempts,
      questionsBySubject,
      questionsByExamType,
    ] = await Promise.all([
      Subject.countDocuments(),
      Subject.countDocuments({ isActive: true }),
      Topic.countDocuments(),
      Question.countDocuments(),
      Question.countDocuments({ isActive: true }),

      // Practice sessions are generated per student,
      // so they are never counted as real exams.
      Exam.countDocuments({ isPractice: { $ne: true } }),
      Exam.countDocuments({
        isPractice: { $ne: true },
        isPublished: true,
      }),

      StudyMaterial.countDocuments(),
      StudyMaterial.countDocuments({ isPublished: true }),

      User.countDocuments(),
      User.countDocuments({ role: "admin" }),

      ExamAttempt.countDocuments({
        status: { $in: ["submitted", "expired"] },
      }),
      ExamAttempt.countDocuments({
        status: { $in: ["submitted", "expired"] },
        submittedAt: { $gte: startOfToday },
      }),
      ExamAttempt.countDocuments({ status: "in-progress" }),

      ExamAttempt.find({
        status: { $in: ["submitted", "expired"] },
      })
        .populate("student", "name email avatar")
        .populate("exam", "title examType isPractice")
        .sort({ submittedAt: -1 })
        .limit(8)
        .lean(),

      // Question coverage per subject drives the
      // "content gaps" panel.
      Question.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$subject",
            count: { $sum: 1 },
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
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),

      Question.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$examType",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Average score across all completed attempts
    const [scoreSummary] = await ExamAttempt.aggregate([
      {
        $match: {
          status: { $in: ["submitted", "expired"] },
          totalMarks: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          averagePercentage: {
            $avg: {
              $multiply: [
                { $divide: ["$score", "$totalMarks"] },
                100,
              ],
            },
          },
        },
      },
    ]);

    // Subjects that exist but have no questions yet
    const subjectsWithQuestions = new Set(
      questionsBySubject.map((row) =>
        String(row.subjectId)
      )
    );

    const emptySubjects = await Subject.find({
      isActive: true,
      _id: {
        $nin: Array.from(subjectsWithQuestions),
      },
    })
      .select("name slug")
      .lean();

    return res.status(200).json({
      totals: {
        subjects,
        activeSubjects,
        topics,
        questions,
        activeQuestions,
        exams,
        publishedExams,
        draftExams: exams - publishedExams,
        materials,
        publishedMaterials,
        users,
        admins,
        students: users - admins,
        attempts,
        attemptsToday,
        inProgress,

        averagePercentage: scoreSummary
          ? Number(
              scoreSummary.averagePercentage.toFixed(1)
            )
          : 0,
      },

      recentAttempts: recentAttempts.map((attempt) => ({
        _id: attempt._id,
        student: attempt.student,
        exam: attempt.exam,
        score: attempt.score || 0,
        totalMarks: attempt.totalMarks || 0,
        percentage:
          attempt.totalMarks > 0
            ? Number(
                (
                  (attempt.score / attempt.totalMarks) *
                  100
                ).toFixed(1)
              )
            : 0,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      })),

      questionsBySubject,

      questionsByExamType: questionsByExamType.map(
        (row) => ({
          examType: row._id,
          count: row.count,
        })
      ),

      emptySubjects,
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getOverview,
};
