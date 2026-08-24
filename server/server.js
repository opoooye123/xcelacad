const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const passport = require("./config/passport");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoute");

const subjectRoutes = require("./routes/subjectRoutes");
const topicRoutes = require("./routes/topicRoutes");
const questionRoutes = require("./routes/questionRoutes");

const examRoutes = require("./routes/examRoutes");
const attemptRoutes = require("./routes/examAttemptRoutes");

const catalogRoutes = require("./routes/catalogRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const materialRoutes = require("./routes/materialRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const adminRoutes = require("./routes/adminRoute");

const app = express();

connectDB();

// ==========================================
// CORS
// ==========================================
// Only the configured client may call the API. Extra
// origins (a staging URL, a LAN address for phone
// testing) go in CORS_ORIGINS as a comma-separated
// list.

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",

  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin and server-to-server calls (curl,
      // health checks) arrive without an Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin ${origin} is not allowed by CORS`)
      );
    },

    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(passport.initialize());

// ==========================================
// PUBLIC / STUDENT API
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/settings", settingsRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/materials", materialRoutes);

app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/analytics", analyticsRoutes);

// ==========================================
// ADMIN API  (protect + adminOnly inside)
// ==========================================

app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Xcel Academy API 🚀",
  });
});

// ==========================================
// 404 + ERROR HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  // A rejected origin should read as a refusal, not a
  // crash.
  if (error.message?.includes("not allowed by CORS")) {
    return res.status(403).json({
      message: "Origin not allowed",
    });
  }

  res.status(error.status || 500).json({
    message: error.message || "Server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Xcel Academy server running on port ${PORT}`
  );
});
