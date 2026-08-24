// ==========================================================
// FORMATTING HELPERS
// ==========================================================
// Shared so a score, date or exam label reads the same on every
// screen. Keep these pure — no React, no fetching.
// ==========================================================

export const EXAM_TYPE_LABELS = {
  jamb: "JAMB",
  "post-utme": "Post-UTME",
  waec: "WAEC",
  neco: "NECO",
  practice: "Practice",
  // Study materials allow this one for notes that aren't tied to
  // a particular exam body.
  general: "General",
};

export const DIFFICULTY_LABELS = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const examTypeLabel = (value) =>
  EXAM_TYPE_LABELS[value] || value || "—";

export const difficultyLabel = (value) =>
  DIFFICULTY_LABELS[value] || value || "—";

// ---------- Numbers ----------

export const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0";

  return number.toLocaleString("en-NG");
};

// 1_240 → "1.2k". Used in stat tiles where width is tight.
export const compactNumber = (value) => {
  const number = Number(value) || 0;

  if (number < 1000) return String(number);

  if (number < 1_000_000) {
    const k = number / 1000;

    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`.replace(
      ".0k",
      "k"
    );
  }

  const m = number / 1_000_000;

  return `${m >= 10 ? Math.round(m) : m.toFixed(1)}m`.replace(
    ".0m",
    "m"
  );
};

export const formatPercent = (value, digits = 0) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0%";

  return `${number.toFixed(digits)}%`;
};

export const percentOf = (part, whole) => {
  const total = Number(whole) || 0;

  if (total <= 0) return 0;

  return (Number(part) / total) * 100;
};

// ---------- Grades ----------
// Shared by the result screen, history rows and analytics so a
// 68% is never a B in one place and a C in another.

export const gradeFor = (percentage) => {
  const score = Number(percentage) || 0;

  if (score >= 70) return { grade: "A", tone: "success" };
  if (score >= 60) return { grade: "B", tone: "success" };
  if (score >= 50) return { grade: "C", tone: "info" };
  if (score >= 45) return { grade: "D", tone: "warning" };
  if (score >= 40) return { grade: "E", tone: "warning" };

  return { grade: "F", tone: "danger" };
};

export const scoreTone = (percentage) => {
  const score = Number(percentage) || 0;

  if (score >= 70) return "success";
  if (score >= 50) return "info";
  if (score >= 40) return "warning";

  return "danger";
};

// ---------- Time ----------

// Seconds → "1:04:09" or "04:09". Used by the CBT timer, so it
// must stay cheap: it runs every second.
export const formatDuration = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (n) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
};

// Minutes → "1h 30m" for exam metadata.
export const formatMinutes = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));

  if (total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const rest = total % 60;

  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATETIME_FORMAT = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return DATE_FORMAT.format(date);
};

export const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return DATETIME_FORMAT.format(date);
};

export const formatRelative = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  const diffSeconds = (Date.now() - date.getTime()) / 1000;

  if (diffSeconds < 60) return "just now";

  const units = [
    { limit: 3600, divisor: 60, name: "minute" },
    { limit: 86400, divisor: 3600, name: "hour" },
    { limit: 604800, divisor: 86400, name: "day" },
    { limit: 2629800, divisor: 604800, name: "week" },
    { limit: 31557600, divisor: 2629800, name: "month" },
  ];

  for (const unit of units) {
    if (diffSeconds < unit.limit) {
      const amount = Math.floor(diffSeconds / unit.divisor);

      return `${amount} ${unit.name}${
        amount === 1 ? "" : "s"
      } ago`;
    }
  }

  const years = Math.floor(diffSeconds / 31557600);

  return `${years} year${years === 1 ? "" : "s"} ago`;
};

// ---------- Text ----------

export const initialsOf = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const truncate = (text, max = 120) => {
  const value = String(text || "");

  if (value.length <= max) return value;

  return `${value.slice(0, max - 1).trimEnd()}…`;
};

export const pluralize = (count, singular, plural) => {
  const number = Number(count) || 0;

  return `${formatNumber(number)} ${
    number === 1 ? singular : plural || `${singular}s`
  }`;
};

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const ordinal = (value) => {
  const number = Number(value) || 0;
  const mod100 = number % 100;

  if (mod100 >= 11 && mod100 <= 13) return `${number}th`;

  switch (number % 10) {
    case 1:
      return `${number}st`;
    case 2:
      return `${number}nd`;
    case 3:
      return `${number}rd`;
    default:
      return `${number}th`;
  }
};
