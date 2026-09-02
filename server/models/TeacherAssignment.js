const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },

    academicSession: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the exact same teacher from being
// assigned the same subject/class twice
// in the same school and academic session.
teacherAssignmentSchema.index(
  {
    school: 1,
    teacher: 1,
    subject: 1,
    class: 1,
    academicSession: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "TeacherAssignment",
  teacherAssignmentSchema
);