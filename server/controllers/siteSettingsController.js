const SiteSettings = require("../models/SiteSettings");

// ==========================================
// SECTIONS AN ADMIN MAY EDIT
// ==========================================
// Anything outside this list (key, updatedBy,
// timestamps) is ignored, so a client cannot
// write fields it has no business touching.

const EDITABLE_SECTIONS = [
  "branding",
  "landing",
  "navigation",
  "banner",
  "features",
  "curation",
];

// Merge one level deep: scalars and arrays are
// replaced outright, nested objects are merged so
// a partial payload (e.g. only landing.hero) does
// not wipe its siblings.
const mergeSection = (target, incoming) => {
  if (!incoming || typeof incoming !== "object") {
    return;
  }

  Object.entries(incoming).forEach(([key, value]) => {
    const isPlainObject =
      value &&
      typeof value === "object" &&
      !Array.isArray(value);

    if (isPlainObject && target[key]) {
      mergeSection(target[key], value);
      return;
    }

    target[key] = value;
  });
};

// ==========================================
// PUBLIC SETTINGS
// ==========================================
// Unauthenticated. Drives branding, navigation,
// landing copy and feature flags on the frontend.

const getPublicSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    await settings.populate([
      {
        path: "curation.featuredSubjects",
        select: "name slug description isActive",
      },
      {
        path: "curation.featuredExams",
        select:
          "title description examType duration totalMarks isPublished",
      },
    ]);

    const plain = settings.toObject();

    // Only ship the banner when it is actually live,
    // so the client never has to reason about dates.
    const banner = settings.isBannerLive()
      ? {
          message: plain.banner.message,
          linkLabel: plain.banner.linkLabel,
          linkHref: plain.banner.linkHref,
          variant: plain.banner.variant,
        }
      : null;

    // Hide unpublished or inactive curated items
    const curation = {
      featuredSubjects: (
        plain.curation?.featuredSubjects || []
      ).filter((subject) => subject?.isActive !== false),

      featuredExams: (
        plain.curation?.featuredExams || []
      ).filter((exam) => exam?.isPublished),
    };

    // Sort and drop hidden nav links here so every
    // consumer gets the same ordering.
    const navLinks = (
      plain.navigation?.navLinks || []
    )
      .filter((link) => link.isVisible !== false && link.href)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return res.status(200).json({
      settings: {
        branding: plain.branding,
        landing: plain.landing,

        navigation: {
          ...plain.navigation,
          navLinks,
        },

        banner,
        features: plain.features,
        curation,

        updatedAt: plain.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get public settings error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: READ FULL SETTINGS
// ==========================================

const getSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    return res.status(200).json({
      settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN: UPDATE SETTINGS
// ==========================================
// Accepts any subset of the editable sections.

const updateSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    const applied = [];

    EDITABLE_SECTIONS.forEach((section) => {
      if (req.body[section] === undefined) {
        return;
      }

      // Arrays of ObjectIds (curation) are replaced
      // wholesale rather than merged.
      if (section === "curation") {
        const curation = req.body.curation || {};

        if (Array.isArray(curation.featuredSubjects)) {
          settings.curation.featuredSubjects =
            curation.featuredSubjects;
        }

        if (Array.isArray(curation.featuredExams)) {
          settings.curation.featuredExams =
            curation.featuredExams;
        }
      } else {
        mergeSection(settings[section], req.body[section]);
      }

      settings.markModified(section);
      applied.push(section);
    });

    if (!applied.length) {
      return res.status(400).json({
        message: `Provide at least one of: ${EDITABLE_SECTIONS.join(
          ", "
        )}`,
      });
    }

    settings.updatedBy = req.user._id;

    await settings.save();

    return res.status(200).json({
      message: `Saved ${applied.join(", ")}`,
      settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getPublicSettings,
  getSettings,
  updateSettings,
};
