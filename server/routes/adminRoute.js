const express = require("express");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  adminOnly,
} = require("../middleware/adminMiddleware");

const { getOverview } = require("../controllers/adminController");

const subjectAdminRoutes = require("./admin/subjectAdminRoutes");
const topicAdminRoutes = require("./admin/topicAdminRoutes");
const questionAdminRoutes = require("./admin/questionAdminRoutes");
const examAdminRoutes = require("./admin/examAdminRoutes");
const materialAdminRoutes = require("./admin/materialAdminRoutes");
const userAdminRoutes = require("./admin/userAdminRoutes");
const settingsAdminRoutes = require("./admin/settingsAdminRoutes");

const router = express.Router();

// ==========================================
// ONE GATE FOR THE WHOLE ADMIN API
// ==========================================
// Applied here rather than per-route so a new admin
// endpoint cannot be added unguarded by accident.

router.use(protect, adminOnly);

router.get("/overview", getOverview);

router.use("/subjects", subjectAdminRoutes);
router.use("/topics", topicAdminRoutes);
router.use("/questions", questionAdminRoutes);
router.use("/exams", examAdminRoutes);
router.use("/materials", materialAdminRoutes);
router.use("/users", userAdminRoutes);
router.use("/settings", settingsAdminRoutes);

module.exports = router;
