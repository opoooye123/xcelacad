const mongoose = require("mongoose");

const schoolMembershipSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "teacher", "school_admin", "principal"],
      required: true,
    },

    // Used mainly for students.
    // A student can belong to a particular class.
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolClass",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A user should only have one membership
// in the same school.
schoolMembershipSchema.index(
  { school: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "SchoolMembership",
  schoolMembershipSchema
);