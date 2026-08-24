const express = require("express");

const {
  createTopic,
  getTopics,
  getTopicById,
} = require("../controllers/topicControllers");

const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getTopics);

router.get("/:id", getTopicById);

router.post(
  "/",
  protect,
  requireRole("admin", "teacher"),
  createTopic
);

module.exports = router;