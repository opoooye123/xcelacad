const mongoose = require("mongoose");

const {
  ANSWER_KEYS,
  EXAM_TYPES,
  DIFFICULTIES,
} = require("../config/constants");

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      A: {
        type: String,
        required: true,
        trim: true,
      },

      B: {
        type: String,
        required: true,
        trim: true,
      },

      C: {
        type: String,
        required: true,
        trim: true,
      },

      D: {
        type: String,
        required: true,
        trim: true,
      },
    },

    correctAnswer: {
      type: String,
      enum: ANSWER_KEYS,
      required: true,
    },

    explanation: {
      type: String,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: DIFFICULTIES,
      default: "medium",
    },

    examType: {
      type: String,
      enum: EXAM_TYPES,
      required: true,
    },

    year: {
      type: Number,
      min: 1980,
      max: 2100,
    },

    marks: {
      type: Number,
      default: 1,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({
  subject: 1,
  topic: 1,
  examType: 1,
});

// Practice sessions sample on (subject, examType,
// year, isActive), so index that path too.
questionSchema.index({
  subject: 1,
  examType: 1,
  year: 1,
  isActive: 1,
});

module.exports = mongoose.model(
  "Question",
  questionSchema
);