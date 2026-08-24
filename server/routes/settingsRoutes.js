const express = require("express");

const {
  getPublicSettings,
} = require("../controllers/siteSettingsController");

const router = express.Router();

// Unauthenticated: branding, navigation, landing copy
// and feature flags for the public site.
router.get("/public", getPublicSettings);

module.exports = router;
