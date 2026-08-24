const express = require("express");

const {
  getMaterialsAdmin,
  getMaterialAdminById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} = require("../../controllers/studyMaterialController");

const router = express.Router();

router.get("/", getMaterialsAdmin);
router.post("/", createMaterial);

router.get("/:id", getMaterialAdminById);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

module.exports = router;
