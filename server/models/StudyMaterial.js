const mongoose = require("mongoose");

const {
  MATERIAL_EXAM_TYPES,
} = require("../config/constants");

const studyMaterialSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
  type: String,
  trim: true,
  default: "",
},

    content: {
      type: String,
      required: true,
    },

    examType: {
      type: String,
      enum: MATERIAL_EXAM_TYPES,
      default: "general",
    },

    order: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
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

studyMaterialSchema.index({
  subject: 1,
  topic: 1,
  isPublished: 1,
});

module.exports = mongoose.model(
  "StudyMaterial",
  studyMaterialSchema
);
