const mongoose = require("mongoose");

const { USER_ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 8,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      default: "student",
    },

    school: {
      type: String,
      trim: true,
    },

    classLevel: {
      type: String,
      trim: true,
    },

    // Google profile picture
    avatar: {
      type: String,
      trim: true,
      default: "",
    },

    // Blocked users keep their data but are refused
    // by the `protect` middleware.
    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);