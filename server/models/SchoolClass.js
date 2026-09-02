const mongoose = require("mongoose");

const schoolClassSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
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

// Prevent duplicate classes within the same
// school and academic session.
schoolClassSchema.index(
  {
    school: 1,
    name: 1,
    academicSession: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "SchoolClass",
  schoolClassSchema
);