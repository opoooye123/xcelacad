const express = require("express");
const passport = require("../config/passport");
const {
  registerUser,
  getMe,
} = require("../controllers/authControllers");
const generateToken = require("../utils/generateToken");
const { protect } = require("../middleware/authMiddleware");

const {
  registerValidation,
  validate,
} = require("../middleware/validation");

const router = express.Router();

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

router.post(
  "/register",
  registerValidation,
  validate,
  registerUser
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user);

    res.redirect(
      `${CLIENT_URL}/auth-success?token=${token}`
    );
  }
);

router.get("/me", protect, getMe);

module.exports = router;
