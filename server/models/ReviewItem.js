const mongoose = require("mongoose");

const reviewItemSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    wrongCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    priority: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },

    status: {
      type: String,
      enum: [
        "review",
        "almost-mastered",
        "mastered",
      ],
      default: "review",
    },

    consecutiveCorrect: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastAnsweredAt: {
      type: Date,
    },

    lastReviewedAt: {
      type: Date,
    },

    nextReviewAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// A student should have only one review record
// for a particular question.
reviewItemSchema.index(
  {
    student: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

reviewItemSchema.index({
  student: 1,
  status: 1,
  priority: -1,
  nextReviewAt: 1,
});

module.exports = mongoose.model(
  "ReviewItem",
  reviewItemSchema
);