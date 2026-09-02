const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
      trim: true,
      default: "",
    },

    // Whether the school is currently allowed
    // to use the Xcel school platform.
    isActive: {
      type: Boolean,
      default: true,
    },

    // Whether Xcel has verified/approved the school.
    isVerified: {
      type: Boolean,
      default: false,
    },

    // The Xcel user who created/submitted
    // the school registration.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("School", schoolSchema);