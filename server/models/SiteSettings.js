const mongoose = require("mongoose");

// ==========================================
// SITE SETTINGS
// ==========================================
// A single document that drives the public
// frontend: branding, landing-page copy,
// navigation, the announcement banner, feature
// flags and homepage curation.
//
// Admins edit this from the dashboard, so the
// marketing site can change without a deploy.
// ==========================================

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    href: { type: String, trim: true },
  },
  { _id: false }
);

const navLinkSchema = new mongoose.Schema({
  label: { type: String, trim: true },
  href: { type: String, trim: true },

  // Hide a link without deleting it
  isVisible: { type: Boolean, default: true },

  order: { type: Number, default: 0 },
});

const footerGroupSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  links: [linkSchema],
});

const statSchema = new mongoose.Schema({
  label: { type: String, trim: true },
  value: { type: String, trim: true },
});

const stepSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },

  // An emoji, kept simple so admins can paste one
  icon: { type: String, trim: true },
});

const testimonialSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  role: { type: String, trim: true },
  quote: { type: String, trim: true },
  avatarUrl: { type: String, trim: true },
});

const faqSchema = new mongoose.Schema({
  question: { type: String, trim: true },
  answer: { type: String, trim: true },
});

const siteSettingsSchema = new mongoose.Schema(
  {
    // Guarantees a single settings document
    key: {
      type: String,
      default: "default",
      unique: true,
      immutable: true,
    },

    // ==========================================
    // BRANDING & THEME
    // ==========================================

    branding: {
      siteName: {
        type: String,
        trim: true,
        default: "Xcel Academy",
      },

      tagline: {
        type: String,
        trim: true,
        default:
          "Practice smarter. Score higher.",
      },

      logoUrl: { type: String, trim: true, default: "" },

      primaryColor: {
        type: String,
        trim: true,
        default: "#4f46e5",
      },

      accentColor: {
        type: String,
        trim: true,
        default: "#0ea5e9",
      },

      defaultTheme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
    },

    // ==========================================
    // LANDING PAGE CONTENT
    // ==========================================

    landing: {
      hero: {
        eyebrow: {
          type: String,
          trim: true,
          default: "JAMB · WAEC · NECO · Post-UTME",
        },

        headline: {
          type: String,
          trim: true,
          default:
            "Pass your exams with real past questions",
        },

        subheadline: {
          type: String,
          trim: true,
          default:
            "Thousands of past questions with worked explanations, timed CBT practice that mirrors the real thing, and analytics that show you exactly what to revise next.",
        },

        primaryCta: {
          label: {
            type: String,
            trim: true,
            default: "Start practising free",
          },
          href: {
            type: String,
            trim: true,
            default: "/login",
          },
        },

        secondaryCta: {
          label: {
            type: String,
            trim: true,
            default: "Browse subjects",
          },
          href: {
            type: String,
            trim: true,
            default: "/subjects",
          },
        },

        imageUrl: { type: String, trim: true, default: "" },
      },

      stats: {
        type: [statSchema],
        default: () => [
          { label: "Past questions", value: "10,000+" },
          { label: "Subjects covered", value: "25" },
          { label: "Students practising", value: "12,400" },
          { label: "Average score lift", value: "27%" },
        ],
      },

      howItWorks: {
        type: [stepSchema],
        default: () => [
          {
            icon: "📚",
            title: "Pick a subject and year",
            description:
              "Choose any subject, exam body and past-paper year. We build the practice set instantly.",
          },
          {
            icon: "⏱️",
            title: "Sit a timed CBT",
            description:
              "The same timer, layout and question navigator you will meet on exam day. Answers autosave as you go.",
          },
          {
            icon: "📈",
            title: "See what to fix",
            description:
              "Every question comes with a worked explanation, and your analytics show the exact topics costing you marks.",
          },
        ],
      },

      testimonials: {
        type: [testimonialSchema],
        default: () => [
          {
            name: "Adaeze O.",
            role: "Scored 312 in JAMB",
            quote:
              "The topic breakdown showed me I was losing everything on Circle Geometry. Two weeks of drilling it changed my whole score.",
            avatarUrl: "",
          },
          {
            name: "Ibrahim M.",
            role: "Post-UTME, Unilorin",
            quote:
              "Timed practice was the difference. By the real exam the countdown did not rattle me at all.",
            avatarUrl: "",
          },
          {
            name: "Chidi N.",
            role: "WAEC candidate",
            quote:
              "The explanations are the best part. I stopped memorising answers and actually understood the working.",
            avatarUrl: "",
          },
        ],
      },

      faq: {
        type: [faqSchema],
        default: () => [
          {
            question: "Is Xcel Academy free?",
            answer:
              "Yes. Create an account with Google and you can start practising immediately at no cost.",
          },
          {
            question: "Which exams are covered?",
            answer:
              "JAMB, Post-UTME, WAEC and NECO, plus open practice sets you can build by subject, topic and year.",
          },
          {
            question:
              "Do the questions come with explanations?",
            answer:
              "Every question can carry a worked explanation, shown on your result page after you submit.",
          },
          {
            question: "Can I practise on my phone?",
            answer:
              "Yes. The whole platform, including the CBT screen, is built to work on phones, tablets and desktops.",
          },
        ],
      },

      seo: {
        title: {
          type: String,
          trim: true,
          default:
            "Xcel Academy — JAMB, WAEC & NECO CBT Practice",
        },

        description: {
          type: String,
          trim: true,
          default:
            "Free CBT practice with real past questions, worked explanations and performance analytics for JAMB, Post-UTME, WAEC and NECO.",
        },
      },
    },

    // ==========================================
    // NAVIGATION & FOOTER
    // ==========================================

    navigation: {
      navLinks: {
        type: [navLinkSchema],
        default: () => [
          { label: "Home", href: "/", isVisible: true, order: 1 },
          {
            label: "Subjects",
            href: "/subjects",
            isVisible: true,
            order: 2,
          },
          {
            label: "Leaderboard",
            href: "/leaderboard",
            isVisible: true,
            order: 3,
          },
          {
            label: "Study Notes",
            href: "/materials",
            isVisible: true,
            order: 4,
          },
          {
            label: "FAQ",
            href: "/faq",
            isVisible: true,
            order: 5,
          },
        ],
      },

      footerGroups: {
        type: [footerGroupSchema],
        default: () => [
          {
            title: "Practice",
            links: [
              { label: "Subjects", href: "/subjects" },
              { label: "Mock exams", href: "/exams" },
              { label: "Study notes", href: "/materials" },
              { label: "Leaderboard", href: "/leaderboard" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "FAQ", href: "/faq" },
            ],
          },
        ],
      },

      socialLinks: {
        type: [linkSchema],
        default: () => [
          { label: "Twitter", href: "" },
          { label: "Instagram", href: "" },
          { label: "WhatsApp", href: "" },
        ],
      },

      contactEmail: {
        type: String,
        trim: true,
        default: "",
      },

      contactPhone: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // ==========================================
    // ANNOUNCEMENT BANNER
    // ==========================================

    banner: {
      enabled: { type: Boolean, default: false },

      message: {
        type: String,
        trim: true,
        default: "",
      },

      linkLabel: { type: String, trim: true, default: "" },
      linkHref: { type: String, trim: true, default: "" },

      variant: {
        type: String,
        enum: ["info", "success", "warning"],
        default: "info",
      },

      startsAt: { type: Date, default: null },
      endsAt: { type: Date, default: null },
    },

    // ==========================================
    // FEATURE FLAGS
    // ==========================================

    features: {
      leaderboard: { type: Boolean, default: true },
      studyMaterials: { type: Boolean, default: true },
      practice: { type: Boolean, default: true },
      exams: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
      registrationOpen: { type: Boolean, default: true },
      maintenanceMode: { type: Boolean, default: false },
    },

    // ==========================================
    // HOMEPAGE CURATION
    // ==========================================

    curation: {
      featuredSubjects: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
        },
      ],

      featuredExams: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exam",
        },
      ],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// SINGLETON ACCESSOR
// ==========================================
// Always returns a settings document, creating
// one from the schema defaults on first call so
// the public site renders before any admin edit.

siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "default" });

  if (!settings) {
    settings = await this.create({ key: "default" });
  }

  return settings;
};

// True only while the banner is enabled AND we are
// inside its (optional) date window.
siteSettingsSchema.methods.isBannerLive = function () {
  const banner = this.banner || {};

  if (!banner.enabled || !banner.message) {
    return false;
  }

  const now = new Date();

  if (banner.startsAt && now < banner.startsAt) {
    return false;
  }

  if (banner.endsAt && now > banner.endsAt) {
    return false;
  }

  return true;
};

module.exports = mongoose.model(
  "SiteSettings",
  siteSettingsSchema
);
