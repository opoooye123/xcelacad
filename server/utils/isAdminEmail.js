// ==========================================
// ADMIN EMAIL WHITELIST
// ==========================================
// Emails listed in the ADMIN_EMAILS environment
// variable are automatically promoted to admin
// when they sign in.
//
// Example:
// ADMIN_EMAILS=you@gmail.com,partner@gmail.com
// ==========================================

const getAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS || "";

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const isAdminEmail = (email) => {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(
    email.trim().toLowerCase()
  );
};

module.exports = {
  isAdminEmail,
  getAdminEmails,
};
