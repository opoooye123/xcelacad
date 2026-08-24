const mongoose = require("mongoose");

const { EXAM_TYPES } = require("../config/constants");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    examType: {
      type: String,
      enum: EXAM_TYPES,
      required: true,
    },

    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    instructions: {
      type: String,
      trim: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Auto-generated practice sessions (subject/year
    // practice). Hidden from the published exam list.
    isPractice: {
      type: Boolean,
      default: false,
    },

    // Set for practice sessions so they can be
    // attributed to (and cleaned up for) a student.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exam", examSchema);