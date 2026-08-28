const express = require("express");

const {
  createMaterial,
  getMaterialsAdmin,
  getPublishedMaterials,
} = require("../controllers/studyMaterialController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// ADMIN
// ==========================================

router.get(
  "/admin",
  protect,
  adminOnly,
  getMaterialsAdmin
);

router.post(
  "/",
  protect,
  adminOnly,
  createMaterial
);

// ==========================================
// STUDENTS
// ==========================================

router.get(
  "/",
  protect,
  getPublishedMaterials
);

module.exports = router;