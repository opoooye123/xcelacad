const SchoolMembership = require("../models/SchoolMembership");
const TeacherAssignment = require("../models/TeacherAssignment");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
// ==========================================
// GET TEACHER DASHBOARD
// ==========================================
const getTeacherDashboard = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const teacherId = req.user._id;

    // ==========================================
    // 1. GET TEACHER'S ACTIVE ASSIGNMENTS
    // ==========================================

    const assignments = await TeacherAssignment.find({
      school: schoolId,
      teacher: teacherId,
      isActive: true,
    })
      .populate("subject", "name slug")
      .populate(
        "class",
        "name level section academicSession"
      )
      .sort({
        createdAt: -1,
      });

    // ==========================================
    // 2. GET ASSIGNED CLASSES
    // ==========================================

    const classIds = [
      ...new Set(
        assignments
          .map((assignment) =>
            assignment.class?._id?.toString()
          )
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // 3. GET STUDENTS IN ASSIGNED CLASSES
    // ==========================================

    let students = [];

    if (classIds.length > 0) {
      students = await SchoolMembership.find({
        school: schoolId,
        role: "student",
        isActive: true,
        class: { $in: classIds },
      })
        .populate("user", "name email avatar")
        .populate(
          "class",
          "name level section academicSession"
        )
        .sort({
          createdAt: -1,
        });
    }

    // ==========================================
    // STUDENT IDS
    // ==========================================

    const studentIds = students
      .map((membership) => membership.user?._id)
      .filter(Boolean);

    // ==========================================
    // 4. GET SCHOOL EXAMS FOR ASSIGNED CLASSES
    // ==========================================

    let schoolExams = [];

    if (classIds.length > 0) {
      schoolExams = await Exam.find({
        school: schoolId,
        schoolClass: { $in: classIds },
        isActive: true,
        isPractice: false,
      })
        .populate("subjects", "name slug")
        .populate(
          "schoolClass",
          "name level section academicSession"
        )
        .sort({
          createdAt: -1,
        });
    }

    // ==========================================
    // 5. GET SUBMITTED EXAM ATTEMPTS
    // ==========================================

    let attempts = [];

    if (studentIds.length > 0 && schoolExams.length > 0) {
      const examIds = schoolExams.map((exam) => exam._id);

      attempts = await ExamAttempt.find({
        student: { $in: studentIds },
        exam: { $in: examIds },
        status: "submitted",
      })
        .populate(
          "student",
          "name email avatar"
        )
        .populate(
          "exam",
          "title totalMarks schoolClass subjects createdAt"
        )
        .sort({
          submittedAt: -1,
        });
    }

    // ==========================================
    // 6. OVERALL PERFORMANCE
    // ==========================================

    let totalScore = 0;
    let totalMarks = 0;

    attempts.forEach((attempt) => {
      totalScore += Number(attempt.score || 0);
      totalMarks += Number(attempt.totalMarks || 0);
    });

    const overallAverage =
      totalMarks > 0
        ? Number(
            ((totalScore / totalMarks) * 100).toFixed(2)
          )
        : 0;

    // ==========================================
    // 7. STUDENTS ASSESSED
    // ==========================================

    const assessedStudentIds = [
      ...new Set(
        attempts
          .map((attempt) =>
            attempt.student?._id?.toString()
          )
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // 8. PERFORMANCE BY STUDENT
    // ==========================================

    const studentPerformanceMap = {};

    attempts.forEach((attempt) => {
      const studentId =
        attempt.student?._id?.toString();

      if (!studentId) return;

      if (!studentPerformanceMap[studentId]) {
        studentPerformanceMap[studentId] = {
          student: attempt.student,
          attempts: 0,
          totalScore: 0,
          totalMarks: 0,
        };
      }

      studentPerformanceMap[studentId].attempts += 1;

      studentPerformanceMap[studentId].totalScore +=
        Number(attempt.score || 0);

      studentPerformanceMap[studentId].totalMarks +=
        Number(attempt.totalMarks || 0);
    });

    const studentPerformance = Object.values(
      studentPerformanceMap
    ).map((item) => {
      const percentage =
        item.totalMarks > 0
          ? Number(
              (
                (item.totalScore / item.totalMarks) *
                100
              ).toFixed(2)
            )
          : 0;

      return {
        student: item.student,
        attempts: item.attempts,
        totalScore: item.totalScore,
        totalMarks: item.totalMarks,
        percentage,
      };
    });

    // ==========================================
    // 9. STUDENTS NEEDING ATTENTION
    // ==========================================

    const studentsNeedingAttention =
      studentPerformance
        .filter(
          (student) =>
            student.percentage < 50
        )
        .sort(
          (a, b) =>
            a.percentage - b.percentage
        );

    // ==========================================
    // 10. PERFORMANCE BY CLASS
    // ==========================================

    const classPerformanceMap = {};

    attempts.forEach((attempt) => {
      const schoolClass =
        attempt.exam?.schoolClass;

      if (!schoolClass?._id) return;

      const classId =
        schoolClass._id.toString();

      if (!classPerformanceMap[classId]) {
        classPerformanceMap[classId] = {
          class: schoolClass,
          totalScore: 0,
          totalMarks: 0,
          attempts: 0,
        };
      }

      classPerformanceMap[classId].totalScore +=
        Number(attempt.score || 0);

      classPerformanceMap[classId].totalMarks +=
        Number(attempt.totalMarks || 0);

      classPerformanceMap[classId].attempts += 1;
    });

    const classPerformance = Object.values(
      classPerformanceMap
    ).map((item) => {
      const percentage =
        item.totalMarks > 0
          ? Number(
              (
                (item.totalScore / item.totalMarks) *
                100
              ).toFixed(2)
            )
          : 0;

      return {
        class: item.class,
        attempts: item.attempts,
        percentage,
      };
    });

    // ==========================================
    // 11. RECENT EXAM ACTIVITY
    // ==========================================

    const recentExamActivity = attempts
      .slice(0, 10)
      .map((attempt) => {
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
          student: attempt.student,
          exam: attempt.exam,
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          percentage,
          submittedAt:
            attempt.submittedAt,
        };
      });

    // ==========================================
    // 12. RESPONSE
    // ==========================================

    res.json({
      teacher: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
      },

      assignments,

      students,

      summary: {
        assignmentCount: assignments.length,
        classCount: classIds.length,
        studentCount: students.length,

        examCount: schoolExams.length,

        attemptCount: attempts.length,

        assessedStudentCount:
          assessedStudentIds.length,

        overallAverage,
      },

      performance: {
        students: studentPerformance,

        studentsNeedingAttention,

        classes: classPerformance,

        recentExams: recentExamActivity,
      },
    });
  } catch (error) {
    console.error(
      "Get teacher dashboard error:",
      error
    );

    res.status(500).json({
      message: "Failed to load teacher dashboard.",
    });
  }
};

// ==========================================
// GET DETAILED STUDENT PERFORMANCE
// ==========================================
const getStudentPerformance = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;
    const teacherId = req.user._id;

    // ==========================================
    // 1. GET TEACHER'S ACTIVE ASSIGNMENTS
    // ==========================================

    const assignments = await TeacherAssignment.find({
      school: schoolId,
      teacher: teacherId,
      isActive: true,
    }).select("class");

    const classIds = [
      ...new Set(
        assignments
          .map((assignment) =>
            assignment.class?.toString()
          )
          .filter(Boolean)
      ),
    ];

    if (classIds.length === 0) {
      return res.status(403).json({
        message:
          "You do not have any active class assignments in this school.",
      });
    }

    // ==========================================
    // 2. VERIFY STUDENT BELONGS TO TEACHER'S CLASS
    // ==========================================

    const studentMembership =
      await SchoolMembership.findOne({
        school: schoolId,
        user: studentId,
        role: "student",
        isActive: true,
        class: { $in: classIds },
      })
        .populate(
          "user",
          "name email avatar"
        )
        .populate(
          "class",
          "name level section academicSession"
        );

    if (!studentMembership) {
      return res.status(404).json({
        message:
          "Student not found in one of your assigned classes.",
      });
    }

    // ==========================================
    // 3. GET SCHOOL EXAMS FOR THIS CLASS
    // ==========================================

    const schoolExams = await Exam.find({
      school: schoolId,
      schoolClass: studentMembership.class._id,
      isActive: true,
      isPractice: false,
    })
      .populate("subjects", "name slug")
      .populate(
        "schoolClass",
        "name level section academicSession"
      )
      .sort({
        createdAt: -1,
      });

    // ==========================================
    // 4. GET STUDENT'S SUBMITTED ATTEMPTS
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
          "title totalMarks duration subjects schoolClass createdAt"
        )
        .sort({
          submittedAt: -1,
        });
    }

    // ==========================================
    // 5. CALCULATE OVERALL PERFORMANCE
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

    const overallAverage =
      totalMarks > 0
        ? Number(
            (
              (totalScore / totalMarks) *
              100
            ).toFixed(2)
          )
        : 0;

    // ==========================================
    // 6. BEST / LOWEST PERFORMANCE
    // ==========================================

    let bestScore = null;
    let lowestScore = null;

    const examResults = attempts.map(
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

        const result = {
          attemptId: attempt._id,

          exam: attempt.exam,

          score: attempt.score,

          totalMarks: attempt.totalMarks,

          percentage,

          submittedAt:
            attempt.submittedAt,
        };

        if (
          bestScore === null ||
          percentage > bestScore.percentage
        ) {
          bestScore = result;
        }

        if (
          lowestScore === null ||
          percentage < lowestScore.percentage
        ) {
          lowestScore = result;
        }

        return result;
      }
    );

    // ==========================================
    // 7. ATTENTION STATUS
    // ==========================================

    let performanceStatus = "No Results";

    if (attempts.length > 0) {
      if (overallAverage < 50) {
        performanceStatus = "Needs Attention";
      } else if (overallAverage < 70) {
        performanceStatus = "Needs Improvement";
      } else {
        performanceStatus = "Good Performance";
      }
    }

    // ==========================================
    // 8. RESPONSE
    // ==========================================

    res.json({
      student: {
        membershipId:
          studentMembership._id,

        id:
          studentMembership.user._id,

        name:
          studentMembership.user.name,

        email:
          studentMembership.user.email,

        avatar:
          studentMembership.user.avatar,

        class:
          studentMembership.class,
      },

      summary: {
        examCount:
          schoolExams.length,

        attemptedCount:
          attempts.length,

        totalScore,

        totalMarks,

        overallAverage,

        bestScore,

        lowestScore,

        performanceStatus,
      },

      exams: examResults,
    });
  } catch (error) {
    console.error(
      "Get student performance error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load student performance.",
    });
  }
};

module.exports = {
  getTeacherDashboard,
  getStudentPerformance,
};

