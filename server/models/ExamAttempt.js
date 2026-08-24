const mongoose = require("mongoose");

const {
  ANSWER_KEYS,
  ATTEMPT_STATUSES,
} = require("../config/constants");

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    selectedAnswer: {
      type: String,
      enum: ANSWER_KEYS,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const examAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    answers: [answerSchema],

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
    },

    score: {
      type: Number,
      default: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ATTEMPT_STATUSES,
      default: "in-progress",
    },
  },
  {
    timestamps: true,
  }
);

// Leaderboard and analytics both scan a student's
// submitted attempts; the dashboard resumes the
// in-progress one.
examAttemptSchema.index({
  student: 1,
  status: 1,
  submittedAt: -1,
});

module.exports = mongoose.model(
  "ExamAttempt",
  examAttemptSchema
);