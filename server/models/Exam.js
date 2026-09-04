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

    // ==========================================
    // SCHOOL EXAM CONTEXT
    // ==========================================

    // Null for normal Xcel practice/JAMB/etc.
    // Set when the exam belongs to a school.
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },

    // The specific school class this exam is for.
    schoolClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolClass",
      default: null,
    },

    // Teacher who created the school exam.
    createdByTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

// ==========================================
// INDEXES
// ==========================================

// Helps school analytics find exams quickly.
examSchema.index({
  school: 1,
  schoolClass: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Exam", examSchema);