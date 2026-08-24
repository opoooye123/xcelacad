const express = require("express");

const {
  createExam,
  getExamsAdmin,
  getExamAdminById,
  updateExam,
  setExamPublish,
  deleteExam,
} = require("../../controllers/examControllers");

const router = express.Router();

router.get("/", getExamsAdmin);
router.post("/", createExam);

router.get("/:id", getExamAdminById);
router.put("/:id", updateExam);
router.patch("/:id/publish", setExamPublish);
router.delete("/:id", deleteExam);

module.exports = router;
