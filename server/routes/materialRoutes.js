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

console.log("===== STUDY MATERIAL ROUTES =====");
console.log("createMaterial:", typeof createMaterial);
console.log("getMaterials:", typeof getMaterials);
console.log("getMaterialsAdmin:", typeof getMaterialsAdmin);
console.log("getMaterialById:", typeof getMaterialById);
console.log("getMaterialAdminById:", typeof getMaterialAdminById);
console.log("updateMaterial:", typeof updateMaterial);
console.log("deleteMaterial:", typeof deleteMaterial);
console.log("protect:", typeof protect);
console.log("adminOnly:", typeof adminOnly);
console.log("=================================");

const router = express.Router();

// ADMIN
router.get("/admin", protect, adminOnly, getMaterialsAdmin);

router.get(
  "/admin/:id",
  protect,
  adminOnly,
  getMaterialAdminById
);

router.post("/", protect, adminOnly, createMaterial);

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

// STUDENT
router.get("/", protect, getMaterials);

router.get("/:id", protect, getMaterialById);

module.exports = router;