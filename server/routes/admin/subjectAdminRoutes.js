const express = require("express");

const {
  createSubject,
  getSubjectsAdmin,
  updateSubject,
  deleteSubject,
} = require("../../controllers/subjectController");

// protect + adminOnly are applied once by the parent
// router in routes/adminRoute.js.
const router = express.Router();

router.get("/", getSubjectsAdmin);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

module.exports = router;
