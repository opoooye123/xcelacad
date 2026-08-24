const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message:
          "This account has been suspended. Contact support if you believe this is a mistake.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// ==========================================
// OPTIONAL AUTH
// ==========================================
// For endpoints that are public but richer when
// signed in (the leaderboard highlights your own
// row). A missing or bad token is not an error —
// the request simply continues anonymously.

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (user && !user.isBlocked) {
      req.user = user;
    }
  } catch (error) {
    // Ignored on purpose: treat as anonymous.
  }

  return next();
};

module.exports = {
  protect,
  optionalAuth,
};