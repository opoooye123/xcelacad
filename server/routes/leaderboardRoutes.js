const express = require("express");

const {
  getLeaderboard,
} = require("../controllers/leaderboardController");

const {
  optionalAuth,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public, but a signed-in visitor also gets their own
// row back even when it falls outside the top slice.
router.get("/", optionalAuth, getLeaderboard);

module.exports = router;
