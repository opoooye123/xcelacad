const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const ReviewItem = require("../models/ReviewItem");

const { ANSWER_KEYS } = require("../config/constants");

// ==========================================
// START / RESUME EXAM
// ==========================================

const startExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findOne({
      _id: id,
      isActive: true,
    }).populate(
      "questions",
      "questionText options difficulty marks"
    );

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    // Practice sessions are never published.
    // Ownership stands in for publication here.
    const isOwnPractice =
      exam.isPractice &&
      String(exam.createdBy) === String(req.user._id);

    if (!exam.isPublished && !isOwnPractice) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    // Check if student already has an active attempt
    const existingAttempt = await ExamAttempt.findOne({
      student: req.user._id,
      exam: exam._id,
      status: "in-progress",
    });

    // ==========================================
    // RESUME EXISTING ATTEMPT
    // ==========================================

    if (existingAttempt) {
      const endTime = new Date(
        existingAttempt.startedAt.getTime() +
          exam.duration * 60 * 1000
      );

      // If the existing attempt has expired
      if (new Date() >= endTime) {
        existingAttempt.status = "expired";
        existingAttempt.submittedAt = new Date();

        await existingAttempt.save();

        return res.status(400).json({
          message: "Your exam time has expired",
        });
      }

      return res.status(200).json({
        message: "You already have an active attempt",

        attempt: {
          _id: existingAttempt._id,
          exam: exam._id,
          startedAt: existingAttempt.startedAt,
          endTime,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          questions: exam.questions,
          answers: existingAttempt.answers,
        },
      });
    }

    // ==========================================
    // CREATE NEW ATTEMPT
    // ==========================================

    const startedAt = new Date();

    const endTime = new Date(
      startedAt.getTime() +
        exam.duration * 60 * 1000
    );

    const attempt = await ExamAttempt.create({
      student: req.user._id,
      exam: exam._id,
      startedAt,
      totalMarks: exam.totalMarks,
      answers: [],
    });

    return res.status(201).json({
      message: "Exam started successfully",

      attempt: {
        _id: attempt._id,
        exam: exam._id,
        startedAt,
        endTime,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        questions: exam.questions,
        answers: [],
      },
    });
  } catch (error) {
    console.error("Start exam error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// SAVE ANSWER
// ==========================================

const saveAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      questionId,
      selectedAnswer,
    } = req.body;

    if (!questionId) {
      return res.status(400).json({
        message: "Question ID is required",
      });
    }

    // null clears an answer, so it is allowed.
    if (
      selectedAnswer !== null &&
      !ANSWER_KEYS.includes(selectedAnswer)
    ) {
      return res.status(400).json({
        message: "Invalid answer",
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: id,
      student: req.user._id,
      status: "in-progress",
    }).populate("exam");

    if (!attempt) {
      return res.status(404).json({
        message: "Active exam attempt not found",
      });
    }

    const endTime = new Date(
      attempt.startedAt.getTime() +
        attempt.exam.duration * 60 * 1000
    );

    if (new Date() >= endTime) {
      attempt.status = "expired";
      attempt.submittedAt = new Date();

      await attempt.save();

      return res.status(400).json({
        message: "Exam time has expired",
      });
    }

    const questionBelongsToExam =
      attempt.exam.questions.some(
        (question) =>
          question.toString() === questionId
      );

    if (!questionBelongsToExam) {
      return res.status(400).json({
        message:
          "Question does not belong to this exam",
      });
    }

    const existingAnswerIndex =
      attempt.answers.findIndex(
        (answer) =>
          answer.question.toString() ===
          questionId
      );

    if (existingAnswerIndex !== -1) {
      attempt.answers[
        existingAnswerIndex
      ].selectedAnswer = selectedAnswer;
    } else {
      attempt.answers.push({
        question: questionId,
        selectedAnswer,
      });
    }

    await attempt.save();

    return res.status(200).json({
      message: "Answer saved",
    });
  } catch (error) {
    console.error("Save answer error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// SMART REVIEW
// ==========================================

const updateReviewItem = async ({
  studentId,
  question,
  isCorrect,
  now,
}) => {
  let reviewItem = await ReviewItem.findOne({
    student: studentId,
    question: question._id,
  });

  // ==========================================
  // CORRECT ANSWER
  // ==========================================

  if (isCorrect) {
    // If this question was never a weakness,
    // there is nothing to update.
    if (!reviewItem) {
      return;
    }

    reviewItem.correctCount += 1;
    reviewItem.consecutiveCorrect += 1;

    reviewItem.lastAnsweredAt = now;
    reviewItem.lastReviewedAt = now;

    // Correct answers reduce the priority.
    reviewItem.priority = Math.max(
      0,
      reviewItem.priority - 2
    );

    // ------------------------------------------
    // REVIEW PROGRESSION
    // ------------------------------------------

    if (reviewItem.consecutiveCorrect >= 3) {
      reviewItem.status = "mastered";

      reviewItem.nextReviewAt = new Date(
        now.getTime() +
          30 * 24 * 60 * 60 * 1000
      );
    } else if (
      reviewItem.consecutiveCorrect >= 2
    ) {
      reviewItem.status = "almost-mastered";

      reviewItem.nextReviewAt = new Date(
        now.getTime() +
          7 * 24 * 60 * 60 * 1000
      );
    } else {
      reviewItem.status = "review";

      reviewItem.nextReviewAt = new Date(
        now.getTime() +
          3 * 24 * 60 * 60 * 1000
      );
    }

    await reviewItem.save();

    return;
  }

  // ==========================================
  // WRONG ANSWER
  // ==========================================

  if (!reviewItem) {
    reviewItem = new ReviewItem({
      student: studentId,
      question: question._id,

      wrongCount: 1,
      correctCount: 0,

      priority: 5,

      status: "review",

      consecutiveCorrect: 0,

      lastAnsweredAt: now,
      lastReviewedAt: now,

      nextReviewAt: now,
    });
  } else {
    reviewItem.wrongCount += 1;

    // A wrong answer breaks the correct streak.
    reviewItem.consecutiveCorrect = 0;

    reviewItem.lastAnsweredAt = now;
    reviewItem.lastReviewedAt = now;

    // Increase review priority.
    reviewItem.priority = Math.min(
      10,
      reviewItem.priority + 2
    );

    reviewItem.status = "review";

    // Difficult questions come back sooner.
    const reviewDelay =
      reviewItem.priority >= 8
        ? 24 * 60 * 60 * 1000
        : 3 * 24 * 60 * 60 * 1000;

    reviewItem.nextReviewAt = new Date(
      now.getTime() + reviewDelay
    );
  }

  await reviewItem.save();
};

// ==========================================
// SUBMIT EXAM
// ==========================================

const submitExam = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // GET STUDENT ATTEMPT
    // ==========================================

    const attempt = await ExamAttempt.findOne({
      _id: id,
      student: req.user._id,
      status: "in-progress",
    }).populate({
      path: "exam",

      populate: {
        path: "questions",
      },
    });

    if (!attempt) {
      return res.status(404).json({
        message:
          "Active exam attempt not found",
      });
    }

    const now = new Date();

    // ==========================================
    // CALCULATE END TIME
    // ==========================================

    const endTime = new Date(
      attempt.startedAt.getTime() +
        attempt.exam.duration * 60 * 1000
    );

    // ==========================================
    // DETERMINE STATUS
    // ==========================================

    if (now >= endTime) {
      attempt.status = "expired";
    } else {
      attempt.status = "submitted";
    }

    // ==========================================
    // CALCULATE SCORE
    // ==========================================

    let score = 0;

    const reviewUpdates = [];

    for (const answer of attempt.answers) {
      const question =
        attempt.exam.questions.find(
          (q) =>
            q._id.toString() ===
            answer.question.toString()
        );

      if (!question) {
        continue;
      }

      const isCorrect =
        answer.selectedAnswer ===
        question.correctAnswer;

      if (isCorrect) {
        score += question.marks;
      }

      // Don't await this yet.
      // We want the exam result saved first.
      reviewUpdates.push(
        updateReviewItem({
          studentId: req.user._id,
          question,
          isCorrect,
          now,
        })
      );
    }

    // ==========================================
    // SAVE EXAM RESULT FIRST
    // ==========================================

    attempt.score = score;
    attempt.submittedAt = now;

    await attempt.save();

    // ==========================================
    // UPDATE SMART REVIEW
    // ==========================================
    // Smart Review must never prevent an exam
    // result from being saved.

    try {
      await Promise.all(reviewUpdates);
    } catch (reviewError) {
      console.error(
        "Smart Review update error:",
        reviewError
      );
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message: "Exam submitted successfully",

      result: {
        attemptId: attempt._id,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      },
    });
  } catch (error) {
    console.error(
      "Submit exam error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET / RESUME ATTEMPT
// ==========================================

const getAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await ExamAttempt.findOne({
      _id: id,
      student: req.user._id,
    }).populate({
      path: "exam",
      populate: {
        path: "questions",
        select:
          "questionText options difficulty marks",
      },
    });

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found",
      });
    }

    // Calculate end time
    const endTime = new Date(
      attempt.startedAt.getTime() +
        attempt.exam.duration * 60 * 1000
    );

    // If still in progress, check expiration
    if (
      attempt.status === "in-progress" &&
      new Date() >= endTime
    ) {
      attempt.status = "expired";
      attempt.submittedAt = new Date();

      await attempt.save();
    }

    return res.status(200).json({
      attempt: {
        _id: attempt._id,

        exam: {
          _id: attempt.exam._id,
          title: attempt.exam.title,
          duration: attempt.exam.duration,
          totalMarks:
            attempt.exam.totalMarks,
        },

        startedAt: attempt.startedAt,
        endTime,

        status: attempt.status,

        score: attempt.score,
        totalMarks: attempt.totalMarks,

        questions:
          attempt.exam.questions,

        answers: attempt.answers,

        submittedAt:
          attempt.submittedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get attempt error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET EXAM RESULT
// ==========================================

const getExamResult = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await ExamAttempt.findOne({
      _id: id,
      student: req.user._id,
    })
      .populate({
        path: "exam",
        populate: {
          path: "questions",
          select:
            "questionText options correctAnswer explanation difficulty marks",
        },
      })
      .populate({
        path: "answers.question",
        select:
          "questionText options correctAnswer explanation difficulty marks",
      });

    if (!attempt) {
      return res.status(404).json({
        message: "Exam attempt not found",
      });
    }

    // Only allow viewing completed attempts
    if (
      attempt.status !== "submitted" &&
      attempt.status !== "expired"
    ) {
      return res.status(400).json({
        message:
          "This exam has not been submitted yet",
        status: attempt.status,
      });
    }

    const questions =
      attempt.exam?.questions || [];

    const answers = attempt.answers || [];

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    const answerMap = new Map();

    answers.forEach((answer) => {
      if (answer.question) {
        answerMap.set(
          answer.question._id
            ? answer.question._id.toString()
            : answer.question.toString(),
          answer.selectedAnswer
        );
      }
    });

    questions.forEach((question) => {
      const selectedAnswer = answerMap.get(
        question._id.toString()
      );

      if (!selectedAnswer) {
        unanswered++;
      } else if (
        selectedAnswer ===
        question.correctAnswer
      ) {
        correct++;
      } else {
        wrong++;
      }
    });

    return res.status(200).json({
      result: {
        attemptId: attempt._id,

        status: attempt.status,

        exam: {
          _id: attempt.exam._id,
          title: attempt.exam.title,
          description:
            attempt.exam.description,
          examType: attempt.exam.examType,
          duration: attempt.exam.duration,
          totalMarks:
            attempt.exam.totalMarks,
        },

        score: attempt.score || 0,
        totalMarks:
          attempt.totalMarks || 0,

        correct,
        wrong,
        unanswered,

        startedAt: attempt.startedAt,
        submittedAt:
          attempt.submittedAt,

        questions,
        answers,
      },
    });
  } catch (error) {
    console.error(
      "Get exam result error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET ACTIVE ATTEMPTS
// ==========================================

const getActiveAttempts = async (
  req,
  res
) => {
  try {
    const attempts =
      await ExamAttempt.find({
        student: req.user._id,
        status: "in-progress",
      })
        .populate({
          path: "exam",
          select:
            "title examType duration totalMarks isPractice questions",
        })
        .sort({ startedAt: -1 })
        .lean();

    const now = Date.now();

    const active = attempts
      .filter((attempt) => attempt.exam)
      .map((attempt) => {
        const endTime = new Date(
          new Date(
            attempt.startedAt
          ).getTime() +
            attempt.exam.duration *
              60 *
              1000
        );

        const answered = (
          attempt.answers || []
        ).filter(
          (answer) =>
            answer.selectedAnswer != null
        ).length;

        const questionCount =
          Array.isArray(
            attempt.exam.questions
          )
            ? attempt.exam.questions.length
            : 0;

        return {
          attemptId: attempt._id,

          exam: {
            _id: attempt.exam._id,
            title: attempt.exam.title,
            examType:
              attempt.exam.examType,
            duration:
              attempt.exam.duration,
            totalMarks:
              attempt.exam.totalMarks,
            isPractice:
              attempt.exam.isPractice,
          },

          startedAt: attempt.startedAt,
          endTime,

          questionCount,
          answered,

          secondsRemaining: Math.max(
            0,
            Math.round(
              (endTime.getTime() - now) /
                1000
            )
          ),

          isExpired:
            now >= endTime.getTime(),
        };
      });

    return res.status(200).json({
      count: active.length,
      attempts: active,
    });
  } catch (error) {
    console.error(
      "Get active attempts error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET STUDENT EXAM HISTORY
// ==========================================

const getExamHistory = async (
  req,
  res
) => {
  try {
    const attempts =
      await ExamAttempt.find({
        student: req.user._id,
        status: {
          $in: [
            "submitted",
            "expired",
          ],
        },
      })
        .populate({
          path: "exam",
          select:
            "title description examType duration totalMarks isPractice",
        })
        .sort({
          submittedAt: -1,
        });

    const history = attempts.map(
      (attempt) => ({
        attemptId: attempt._id,

        exam: attempt.exam,

        score: attempt.score || 0,

        totalMarks:
          attempt.totalMarks || 0,

        status: attempt.status,

        startedAt:
          attempt.startedAt,

        submittedAt:
          attempt.submittedAt,

        percentage:
          attempt.totalMarks > 0
            ? Number(
                (
                  (attempt.score /
                    attempt.totalMarks) *
                  100
                ).toFixed(1)
              )
            : 0,
      })
    );

    return res.status(200).json({
      history,
    });
  } catch (error) {
    console.error(
      "Get exam history error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  startExam,
  saveAnswer,
  submitExam,
  getAttempt,
  getExamResult,
  getActiveAttempts,
  getExamHistory,
};