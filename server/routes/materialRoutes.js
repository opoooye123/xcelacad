const express = require("express");

const {
  getMaterials,
  getMaterialById,
} = require("../controllers/studyMaterialController");

const router = express.Router();

// Published notes are public so they can be found and
// shared. Drafts are only visible under /api/admin.
router.get("/", getMaterials);
router.get("/:id", getMaterialById);

module.exports = router;
