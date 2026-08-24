// ==========================================
// SHARED DOMAIN CONSTANTS
// ==========================================
// Single source of truth for the enums that
// several models and controllers share. Keeping
// them here stops Question, Exam and
// StudyMaterial from drifting apart.
// ==========================================

const ANSWER_KEYS = ["A", "B", "C", "D"];

const EXAM_TYPES = [
  "jamb",
  "post-utme",
  "waec",
  "neco",
  "practice",
];

// StudyMaterial also allows "general" for notes
// that are not tied to a particular exam body.
const MATERIAL_EXAM_TYPES = [
  ...EXAM_TYPES,
  "general",
];

const DIFFICULTIES = ["easy", "medium", "hard"];

const USER_ROLES = ["student", "teacher", "admin"];

const ATTEMPT_STATUSES = [
  "in-progress",
  "submitted",
  "expired",
];

// Human-friendly labels for the UI and for
// generated practice-session titles.
const EXAM_TYPE_LABELS = {
  jamb: "JAMB",
  "post-utme": "Post-UTME",
  waec: "WAEC",
  neco: "NECO",
  practice: "Practice",
};

module.exports = {
  ANSWER_KEYS,
  EXAM_TYPES,
  MATERIAL_EXAM_TYPES,
  DIFFICULTIES,
  USER_ROLES,
  ATTEMPT_STATUSES,
  EXAM_TYPE_LABELS,
};
