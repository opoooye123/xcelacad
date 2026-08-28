const express = require("express");

const {
  createMaterial,
  getMaterials,
  getMaterialsAdmin,
  getMaterialById,
  getMaterialAdminById,
  updateMaterial,
  deleteMaterial,
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

router.get(
  "/admin/:id",
  protect,
  adminOnly,
  getMaterialAdminById
);

router.post(
  "/",
  protect,
  adminOnly,
  createMaterial
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updateMaterial
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteMaterial
);

// ==========================================
// STUDENTS
// ==========================================

router.get(
  "/",
  protect,
  getMaterials
);

router.get(
  "/:id",
  protect,
  getMaterialById
);

module.exports = router;