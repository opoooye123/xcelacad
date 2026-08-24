const express = require("express");

const {
  createTopic,
  getTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
} = require("../../controllers/topicControllers");

const router = express.Router();

// Admin listings default to ?includeInactive=true and
// ?withCounts=true from the client.
router.get("/", getTopics);
router.post("/", createTopic);
router.get("/:id", getTopicById);
router.put("/:id", updateTopic);
router.delete("/:id", deleteTopic);

module.exports = router;
