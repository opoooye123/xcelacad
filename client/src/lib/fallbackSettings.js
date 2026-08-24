// ==========================================================
// FALLBACK SETTINGS
// ==========================================================
// Mirrors the defaults in server/models/SiteSettings.js so the
// public site still renders if the API is unreachable or the
// settings request is still in flight. Keep the two in step.
// ==========================================================

export const FALLBACK_SETTINGS = {
  branding: {
    siteName: "Xcel Academy",
    tagline: "Practice smarter. Score higher.",
    logoUrl: "",
    primaryColor: "#4f46e5",
    accentColor: "#0ea5e9",
    defaultTheme: "system",
  },

  landing: {
    hero: {
      eyebrow: "JAMB · WAEC · NECO · Post-UTME",
      headline: "Pass your exams with real past questions",
      subheadline:
        "Thousands of past questions with worked explanations, timed CBT practice that mirrors the real thing, and analytics that show you exactly what to revise next.",
      primaryCta: {
        label: "Start practising free",
        href: "/login",
      },
      secondaryCta: {
        label: "Browse subjects",
        href: "/subjects",
      },
      imageUrl: "",
    },

    stats: [
      { label: "Past questions", value: "10,000+" },
      { label: "Subjects covered", value: "25" },
      { label: "Students practising", value: "12,400" },
      { label: "Average score lift", value: "27%" },
    ],

    howItWorks: [
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

    testimonials: [],

    faq: [
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
        question: "Do the questions come with explanations?",
        answer:
          "Every question can carry a worked explanation, shown on your result page after you submit.",
      },
      {
        question: "Can I practise on my phone?",
        answer:
          "Yes. The whole platform, including the CBT screen, is built to work on phones, tablets and desktops.",
      },
    ],

    seo: {
      title: "Xcel Academy — JAMB, WAEC & NECO CBT Practice",
      description:
        "Free CBT practice with real past questions, worked explanations and performance analytics for JAMB, Post-UTME, WAEC and NECO.",
    },
  },

  navigation: {
    navLinks: [
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
      { label: "FAQ", href: "/faq", isVisible: true, order: 5 },
    ],

    footerGroups: [
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

    socialLinks: [],
    contactEmail: "",
    contactPhone: "",
  },

  banner: null,

  features: {
    leaderboard: true,
    studyMaterials: true,
    practice: true,
    exams: true,
    analytics: true,
    registrationOpen: true,
    maintenanceMode: false,
  },

  curation: {
    featuredSubjects: [],
    featuredExams: [],
  },
};
