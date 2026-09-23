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
      .populate(
        "class",
        "name level section academicSession"
      )
      .populate(
        "subject",
        "name slug"
      );

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

    if (assignedClassIds.length === 0) {
      return res.status(403).json({
        message:
          "You are not assigned to any classes in this school.",
      });
    }

    // ==========================================
    // 3. FIND STUDENT'S SCHOOL MEMBERSHIP
    // ==========================================

    const membership =
      await SchoolMembership.findOne({
        school: schoolId,
        user: studentId,
        role: "student",
        isActive: true,
        class: {
          $in: assignedClassIds,
        },
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

    const schoolExams =
      await Exam.find({
        school: schoolId,
        schoolClass: membership.class._id,
        isActive: true,
        isPractice: false,
      })
        .select(
          "title description examType subjects questions totalMarks schoolClass createdAt"
        )
        .populate(
          "subjects",
          "name slug"
        )
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
      attempts =
        await ExamAttempt.find({
          student: studentId,
          exam: {
            $in: examIds,
          },
          status: "submitted",
        })
          .populate(
            "exam",
            "title description examType subjects questions totalMarks schoolClass createdAt"
          )
          .populate({
            path: "answers.question",
            select:
              "subject topic correctAnswer marks questionText difficulty",
            populate: [
              {
                path: "subject",
                select: "name slug",
              },
              {
                path: "topic",
                select: "name slug",
              },
            ],
          })
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
              (totalScore /
                totalMarks) *
              100
            ).toFixed(2)
          )
        : 0;

    // ==========================================
    // 7. PERFORMANCE PER EXAM
    // ==========================================

    const examPerformance =
      attempts.map((attempt) => {
        const percentage =
          attempt.totalMarks > 0
            ? Number(
                (
                  (Number(
                    attempt.score || 0
                  ) /
                    Number(
                      attempt.totalMarks ||
                        0
                    )) *
                  100
                ).toFixed(2)
              )
            : 0;

        return {
          attemptId:
            attempt._id,

          exam: {
            id:
              attempt.exam?._id,

            title:
              attempt.exam?.title,

            description:
              attempt.exam?.description,

            examType:
              attempt.exam?.examType,

            subjects:
              attempt.exam?.subjects ||
              [],

            totalMarks:
              attempt.exam?.totalMarks,

            createdAt:
              attempt.exam?.createdAt,
          },

          score:
            Number(
              attempt.score || 0
            ),

          totalMarks:
            Number(
              attempt.totalMarks || 0
            ),

          percentage,

          submittedAt:
            attempt.submittedAt,
        };
      });

    // ==========================================
    // 8. PERFORMANCE BY SUBJECT & TOPIC
    // ==========================================

    const subjectPerformanceMap = {};
    const topicPerformanceMap = {};

    attempts.forEach((attempt) => {
      if (
        !attempt.answers ||
        attempt.answers.length === 0
      ) {
        return;
      }

      attempt.answers.forEach(
        (answer) => {
          const question =
            answer.question;

          // Skip answers where the
          // question could not be populated
          if (!question) {
            return;
          }

          const marks = Number(
            question.marks || 1
          );

          const selectedAnswer =
            answer.selectedAnswer;

          const correctAnswer =
            question.correctAnswer;

          const isUnanswered =
            !selectedAnswer;

          const isCorrect =
            !isUnanswered &&
            selectedAnswer ===
              correctAnswer;

          const isWrong =
            !isUnanswered &&
            !isCorrect;

          const earnedMarks =
            isCorrect ? marks : 0;

          // ========================================
          // SUBJECT PERFORMANCE
          // ========================================

          const subject =
            question.subject;

          if (subject?._id) {
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
                  name:
                    subject.name,
                  slug:
                    subject.slug,
                },

                questions: 0,

                correct: 0,

                wrong: 0,

                unanswered: 0,

                totalScore: 0,

                totalMarks: 0,
              };
            }

            const subjectData =
              subjectPerformanceMap[
                subjectId
              ];

            subjectData.questions += 1;

            subjectData.totalMarks +=
              marks;

            subjectData.totalScore +=
              earnedMarks;

            if (isUnanswered) {
              subjectData.unanswered += 1;
            } else if (isCorrect) {
              subjectData.correct += 1;
            } else if (isWrong) {
              subjectData.wrong += 1;
            }
          }

          // ========================================
          // TOPIC PERFORMANCE
          // ========================================

          const topic =
            question.topic;

          if (topic?._id) {
            const topicId =
              topic._id.toString();

            if (
              !topicPerformanceMap[
                topicId
              ]
            ) {
              topicPerformanceMap[
                topicId
              ] = {
                topic: {
                  id: topic._id,
                  name:
                    topic.name,
                  slug:
                    topic.slug,
                },

                subject: subject
                  ? {
                      id:
                        subject._id,
                      name:
                        subject.name,
                      slug:
                        subject.slug,
                    }
                  : null,

                questions: 0,

                correct: 0,

                wrong: 0,

                unanswered: 0,

                totalScore: 0,

                totalMarks: 0,
              };
            }

            const topicData =
              topicPerformanceMap[
                topicId
              ];

            topicData.questions += 1;

            topicData.totalMarks +=
              marks;

            topicData.totalScore +=
              earnedMarks;

            if (isUnanswered) {
              topicData.unanswered += 1;
            } else if (isCorrect) {
              topicData.correct += 1;
            } else if (isWrong) {
              topicData.wrong += 1;
            }
          }
        }
      );
    });

    // ==========================================
    // 9. FORMAT SUBJECT PERFORMANCE
    // ==========================================

    const subjectPerformance =
      Object.values(
        subjectPerformanceMap
      )
        .map((item) => {
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
            subject:
              item.subject,

            questions:
              item.questions,

            correct:
              item.correct,

            wrong:
              item.wrong,

            unanswered:
              item.unanswered,

            totalScore:
              item.totalScore,

            totalMarks:
              item.totalMarks,

            percentage,
          };
        })
        .sort(
          (a, b) =>
            a.percentage -
            b.percentage
        );

    // ==========================================
    // 10. FORMAT TOPIC PERFORMANCE
    // ==========================================

    const topicPerformance =
      Object.values(
        topicPerformanceMap
      )
        .map((item) => {
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
            topic:
              item.topic,

            subject:
              item.subject,

            questions:
              item.questions,

            correct:
              item.correct,

            wrong:
              item.wrong,

            unanswered:
              item.unanswered,

            totalScore:
              item.totalScore,

            totalMarks:
              item.totalMarks,

            percentage,
          };
        })
        .sort(
          (a, b) =>
            a.percentage -
            b.percentage
        );

    // ==========================================
    // 11. IDENTIFY WEAK SUBJECTS
    // ==========================================

    const weakSubjects =
      subjectPerformance.filter(
        (item) =>
          item.percentage < 50
      );

    // ==========================================
    // 12. IDENTIFY WEAK TOPICS
    // ==========================================

    const weakTopics =
      topicPerformance.filter(
        (item) =>
          item.percentage < 50
      );

    // ==========================================
    // 13. BEST / LOWEST EXAM PERFORMANCE
    // ==========================================

    const sortedPerformance = [
      ...examPerformance,
    ].sort(
      (a, b) =>
        b.percentage -
        a.percentage
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
    // 14. RESPONSE
    // ==========================================

    return res.json({
      student: {
        id:
          membership.user?._id,

        name:
          membership.user?.name,

        email:
          membership.user?.email,

        avatar:
          membership.user?.avatar,

        class: membership.class
          ? {
              id:
                membership.class._id,

              name:
                membership.class.name,

              level:
                membership.class.level,

              section:
                membership.class.section,

              academicSession:
                membership.class
                  .academicSession,
            }
          : null,
      },

      summary: {
        examCount:
          schoolExams.length,

        attemptCount:
          attempts.length,

        averagePercentage,

        totalScore,

        totalMarks,
      },

      performance: {
        exams:
          examPerformance,

        subjects:
          subjectPerformance,

        topics:
          topicPerformance,

        weakSubjects,

        weakTopics,

        bestExam,

        lowestExam,
      },
    });
  } catch (error) {
    console.error(
      "Get student detailed performance error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load student performance.",
    });
  }
};

module.exports = {
  getStudentDetailedPerformance,
};