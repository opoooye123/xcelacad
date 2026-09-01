const mongoose = require("mongoose");

const ReviewItem = require("../models/ReviewItem");
const Question = require("../models/Question");

const { ANSWER_KEYS } = require("../config/constants");

// ==========================================
// INTERNAL REVIEW UPDATE
// ==========================================

const updateReviewItem = async ({
  studentId,
  questionId,
  isCorrect,
  now,
}) => {
  let reviewItem = await ReviewItem.findOne({
    student: studentId,
    question: questionId,
  });

  // ==========================================
  // CORRECT
  // ==========================================

  if (isCorrect) {
    // A correct answer to a question that was
    // never in review requires no record.
    if (!reviewItem) {
      return null;
    }

    reviewItem.correctCount += 1;
    reviewItem.consecutiveCorrect += 1;

    reviewItem.lastAnsweredAt = now;
    reviewItem.lastReviewedAt = now;

    reviewItem.priority = Math.max(
      0,
      reviewItem.priority - 2
    );

    // 3 consecutive correct answers = mastered
    if (reviewItem.consecutiveCorrect >= 3) {
      reviewItem.status = "mastered";

      reviewItem.nextReviewAt = new Date(
        now.getTime() +
          30 * 24 * 60 * 60 * 1000
      );
    }

    // 2 consecutive correct answers = almost mastered
    else if (
      reviewItem.consecutiveCorrect >= 2
    ) {
      reviewItem.status =
        "almost-mastered";

      reviewItem.nextReviewAt = new Date(
        now.getTime() +
          7 * 24 * 60 * 60 * 1000
      );
    }

    // First correct answer after a mistake
    else {
      reviewItem.status = "review";

      reviewItem.nextReviewAt = new Date(
        now.getTime() +
          3 * 24 * 60 * 60 * 1000
      );
    }

    await reviewItem.save();

    return reviewItem;
  }

  // ==========================================
  // WRONG
  // ==========================================

  if (!reviewItem) {
    try {
      reviewItem = await ReviewItem.create({
        student: studentId,
        question: questionId,

        wrongCount: 1,
        correctCount: 0,

        priority: 5,

        status: "review",

        consecutiveCorrect: 0,

        lastAnsweredAt: now,
        lastReviewedAt: now,

        nextReviewAt: now,
      });
    } catch (error) {
      // Unique index protection against two
      // simultaneous requests creating the same item.
      if (error?.code === 11000) {
        reviewItem = await ReviewItem.findOne({
          student: studentId,
          question: questionId,
        });
      } else {
        throw error;
      }
    }
  }

  // If it already existed, increase the
  // difficulty/priority of the review item.
  if (reviewItem && reviewItem.wrongCount > 0) {
    // Only apply these increments when the record
    // already existed. A newly-created record
    // already received wrongCount = 1 above.
    const wasExisting =
      reviewItem.correctCount > 0 ||
      reviewItem.wrongCount > 1 ||
      reviewItem.createdAt?.getTime() !==
        now.getTime();

    if (wasExisting) {
      reviewItem.wrongCount += 1;

      reviewItem.priority = Math.min(
        10,
        reviewItem.priority + 2
      );
    }

    reviewItem.consecutiveCorrect = 0;

    reviewItem.status = "review";

    reviewItem.lastAnsweredAt = now;
    reviewItem.lastReviewedAt = now;

    const reviewDelay =
      reviewItem.priority >= 8
        ? 24 * 60 * 60 * 1000
        : 3 * 24 * 60 * 60 * 1000;

    reviewItem.nextReviewAt = new Date(
      now.getTime() + reviewDelay
    );

    await reviewItem.save();
  }

  return reviewItem;
};

// ==========================================
// GET MY REVIEW QUEUE
// ==========================================

const getMyReviewQueue = async (req, res) => {
  try {
    const {
      status,
      limit = 20,
    } = req.query;

    const pageSize = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const filter = {
      student: req.user._id,

      // Mastered questions are no longer part
      // of the active review queue.
      status: {
        $ne: "mastered",
      },
    };

    if (
      status &&
      [
        "review",
        "almost-mastered",
        "mastered",
      ].includes(status)
    ) {
      filter.status = status;
    }

    const items = await ReviewItem.find(filter)
      .populate({
        path: "question",
        select:
          "questionText options difficulty marks subject topic examType",
        populate: [
          {
            path: "subject",
            select: "name slug",
          },
          {
            path: "topic",
            select: "title slug",
          },
        ],
      })
      .sort({
        priority: -1,
        nextReviewAt: 1,
        updatedAt: -1,
      })
      .limit(pageSize)
      .lean();

    return res.status(200).json({
      count: items.length,
      items,
    });
  } catch (error) {
    console.error(
      "Get review queue error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET REVIEW STATS
// ==========================================

const getReviewStats = async (req, res) => {
  try {
    const stats = await ReviewItem.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(
            req.user._id
          ),
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const result = {
      review: 0,
      "almost-mastered": 0,
      mastered: 0,
    };

    stats.forEach((item) => {
      result[item._id] = item.count;
    });

    return res.status(200).json({
      review: result.review,
      almostMastered:
        result["almost-mastered"],
      mastered: result.mastered,
      total:
        result.review +
        result["almost-mastered"] +
        result.mastered,
    });
  } catch (error) {
    console.error(
      "Get review stats error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ANSWER REVIEW QUESTION
// ==========================================

const answerReviewQuestion = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { selectedAnswer } = req.body;

    // ----------------------------------------
    // VALIDATE ANSWER
    // ----------------------------------------

    if (
      !selectedAnswer ||
      !ANSWER_KEYS.includes(selectedAnswer)
    ) {
      return res.status(400).json({
        message: "A valid answer is required",
      });
    }

    // ----------------------------------------
    // GET REVIEW ITEM
    // ----------------------------------------

    const reviewItem =
      await ReviewItem.findOne({
        _id: id,
        student: req.user._id,
        status: {
          $ne: "mastered",
        },
      });

    if (!reviewItem) {
      return res.status(404).json({
        message: "Review item not found",
      });
    }

    // ----------------------------------------
    // GET QUESTION
    // ----------------------------------------

    const question =
      await Question.findOne({
        _id: reviewItem.question,
        isActive: true,
      }).select(
        "questionText options correctAnswer explanation marks difficulty subject topic examType"
      );

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    const now = new Date();

    const isCorrect =
      selectedAnswer === question.correctAnswer;

    // ----------------------------------------
    // UPDATE REVIEW
    // ----------------------------------------

    const updatedReviewItem =
      await updateReviewItem({
        studentId: req.user._id,
        questionId: question._id,
        isCorrect,
        now,
      });

    // ----------------------------------------
    // RETURN SAFE QUESTION DATA
    // ----------------------------------------

    return res.status(200).json({
      message: isCorrect
        ? "Correct answer"
        : "Incorrect answer",

      isCorrect,

      correctAnswer: question.correctAnswer,

      explanation:
        question.explanation || "",

      review: updatedReviewItem
        ? {
            _id: updatedReviewItem._id,
            wrongCount:
              updatedReviewItem.wrongCount,
            correctCount:
              updatedReviewItem.correctCount,
            consecutiveCorrect:
              updatedReviewItem.consecutiveCorrect,
            priority:
              updatedReviewItem.priority,
            status:
              updatedReviewItem.status,
            nextReviewAt:
              updatedReviewItem.nextReviewAt,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Answer review question error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getMyReviewQueue,
  getReviewStats,
  answerReviewQuestion,
};