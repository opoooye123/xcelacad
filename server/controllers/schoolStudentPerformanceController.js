const SchoolMembership = require("../models/SchoolMembership");
const TeacherAssignment = require("../models/TeacherAssignment");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");

// ==========================================
// GET STUDENT DETAILED PERFORMANCE
// ==========================================
const getStudentDetailedPerformance = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;
    const teacherId = req.user._id;

    // ==========================================
    // 1. VERIFY TEACHER ASSIGNMENTS
    // ==========================================

    const assignments = await TeacherAssignment.find({
      school: schoolId,
      teacher: teacherId,
      isActive: true,
    })
      .select("class subject")
      .populate("class", "name level section academicSession")
      .populate("subject", "name slug");

    if (assignments.length === 0) {
      return res.status(403).json({
        message:
          "You do not have any active teaching assignments in this school.",
      });
    }

    // ==========================================
    // 2. GET CLASSES ASSIGNED TO TEACHER
    // ==========================================

    const assignedClassIds = [
      ...new Set(
        assignments
          .map((assignment) =>
            assignment.class?._id?.toString()
          )
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // 3. FIND STUDENT'S SCHOOL MEMBERSHIP
    // ==========================================

    const membership = await SchoolMembership.findOne({
      school: schoolId,
      user: studentId,
      role: "student",
      isActive: true,
      class: { $in: assignedClassIds },
    })
      .populate(
        "user",
        "name email avatar"
      )
      .populate(
        "class",
        "name level section academicSession"
      );

    if (!membership) {
      return res.status(403).json({
        message:
          "This student is not in one of your assigned classes.",
      });
    }

    // ==========================================
    // 4. GET SCHOOL EXAMS FOR STUDENT'S CLASS
    // ==========================================

    const schoolExams = await Exam.find({
      school: schoolId,
      schoolClass: membership.class._id,
      isActive: true,
      isPractice: false,
    })
      .select(
        "title description examType subjects totalMarks schoolClass createdAt"
      )
      .populate("subjects", "name slug")
      .populate(
        "schoolClass",
        "name level section academicSession"
      )
      .sort({
        createdAt: -1,
      });

    // ==========================================
    // 5. GET STUDENT'S SUBMITTED ATTEMPTS
    // ==========================================

    const examIds = schoolExams.map(
      (exam) => exam._id
    );

    let attempts = [];

    if (examIds.length > 0) {
      attempts = await ExamAttempt.find({
        student: studentId,
        exam: { $in: examIds },
        status: "submitted",
      })
        .populate(
          "exam",
          "title description examType subjects totalMarks schoolClass createdAt"
        )
        .sort({
          submittedAt: -1,
        });
    }

    // ==========================================
    // 6. OVERALL SUMMARY
    // ==========================================

    let totalScore = 0;
    let totalMarks = 0;

    attempts.forEach((attempt) => {
      totalScore += Number(
        attempt.score || 0
      );

      totalMarks += Number(
        attempt.totalMarks || 0
      );
    });

    const averagePercentage =
      totalMarks > 0
        ? Number(
            (
              (totalScore / totalMarks) *
              100
            ).toFixed(2)
          )
        : 0;

    // ==========================================
    // 7. PERFORMANCE PER EXAM
    // ==========================================

    const examPerformance = attempts.map(
      (attempt) => {
        const percentage =
          attempt.totalMarks > 0
            ? Number(
                (
                  (attempt.score /
                    attempt.totalMarks) *
                  100
                ).toFixed(2)
              )
            : 0;

        return {
          attemptId: attempt._id,

          exam: {
            id: attempt.exam?._id,
            title: attempt.exam?.title,
            description:
              attempt.exam?.description,
            examType:
              attempt.exam?.examType,
            subjects:
              attempt.exam?.subjects || [],
            totalMarks:
              attempt.exam?.totalMarks,
            createdAt:
              attempt.exam?.createdAt,
          },

          score: attempt.score,
          totalMarks:
            attempt.totalMarks,
          percentage,

          submittedAt:
            attempt.submittedAt,
        };
      }
    );

    // ==========================================
    // 8. PERFORMANCE BY SUBJECT
    // ==========================================

    const subjectPerformanceMap = {};

    attempts.forEach((attempt) => {
      if (!attempt.exam?.subjects) {
        return;
      }

      attempt.exam.subjects.forEach(
        (subject) => {
          const subjectId =
            subject._id.toString();

          if (
            !subjectPerformanceMap[
              subjectId
            ]
          ) {
            subjectPerformanceMap[
              subjectId
            ] = {
              subject: {
                id: subject._id,
                name: subject.name,
                slug: subject.slug,
              },
              attempts: 0,
              totalScore: 0,
              totalMarks: 0,
            };
          }

          subjectPerformanceMap[
            subjectId
          ].attempts += 1;

          // At this stage the exam score is
          // associated with each subject.
          //
          // Later, when question-level analytics
          // are added, this can become a true
          // subject-specific score.
          subjectPerformanceMap[
            subjectId
          ].totalScore += Number(
            attempt.score || 0
          );

          subjectPerformanceMap[
            subjectId
          ].totalMarks += Number(
            attempt.totalMarks || 0
          );
        }
      );
    });

    const subjectPerformance =
      Object.values(
        subjectPerformanceMap
      ).map((item) => {
        const percentage =
          item.totalMarks > 0
            ? Number(
                (
                  (item.totalScore /
                    item.totalMarks) *
                  100
                ).toFixed(2)
              )
            : 0;

        return {
          subject: item.subject,
          attempts: item.attempts,
          percentage,
        };
      });

    // ==========================================
    // 9. BEST / LOWEST EXAM PERFORMANCE
    // ==========================================

    const sortedPerformance = [
      ...examPerformance,
    ].sort(
      (a, b) =>
        b.percentage - a.percentage
    );

    const bestExam =
      sortedPerformance.length > 0
        ? sortedPerformance[0]
        : null;

    const lowestExam =
      sortedPerformance.length > 0
        ? sortedPerformance[
            sortedPerformance.length - 1
          ]
        : null;

    // ==========================================
    // 10. RESPONSE
    // ==========================================

    res.json({
      student: {
        id: membership.user?._id,
        name: membership.user?.name,
        email: membership.user?.email,
        avatar: membership.user?.avatar,

        class: membership.class
          ? {
              id: membership.class._id,
              name: membership.class.name,
              level: membership.class.level,
              section:
                membership.class.section,
              academicSession:
                membership.class
                  .academicSession,
            }
          : null,
      },

      summary: {
        examCount: schoolExams.length,
        attemptCount: attempts.length,
        averagePercentage,
        totalScore,
        totalMarks,
      },

      performance: {
        exams: examPerformance,
        subjects: subjectPerformance,
        bestExam,
        lowestExam,
      },
    });
  } catch (error) {
    console.error(
      "Get student detailed performance error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load student performance.",
    });
  }
};

module.exports = {
  getStudentDetailedPerformance,
};