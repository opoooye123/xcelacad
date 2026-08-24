// ==========================================
// SLUGIFY
// ==========================================
// "Further Mathematics (Core)" -> "further-mathematics-core"
// ==========================================

const slugify = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

module.exports = slugify;
