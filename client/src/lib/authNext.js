// ==========================================================
// POST-SIGN-IN DESTINATION
// ==========================================================
// Google's OAuth redirect can't carry our own query params, so a
// visitor's intended destination has to survive the round trip
// some other way. It travels as `?next=` up to the point we hand
// off to Google, then waits in sessionStorage until AuthSuccess
// picks it up.
//
// sessionStorage rather than localStorage: a half-finished
// sign-in shouldn't still be redirecting people next week.
// ==========================================================

export const NEXT_KEY = "xcelAuthNext";

// Only ever redirect to a path on this site. Without this an
// attacker could hand someone /login?next=https://evil.example
// and have our own page bounce them there after sign-in.
export const safeNext = (value) => {
  if (!value || typeof value !== "string") return null;

  if (!value.startsWith("/")) return null;

  // "//evil.example" is protocol-relative and leaves the site.
  if (value.startsWith("//")) return null;

  // A backslash is normalised to "/" by some browsers, so
  // "/\evil.example" can escape too.
  if (value.startsWith("/\\")) return null;

  return value;
};

// Build the sign-in URL for a route guard or a gated link.
export const loginPath = (next) => {
  const target = safeNext(next);

  return target
    ? `/login?next=${encodeURIComponent(target)}`
    : "/login";
};

export const stashNext = (next) => {
  const target = safeNext(next);

  try {
    if (target) {
      sessionStorage.setItem(NEXT_KEY, target);
    } else {
      sessionStorage.removeItem(NEXT_KEY);
    }
  } catch {
    // Storage blocked (private mode). Sign-in still works; the
    // visitor just lands on the dashboard instead.
  }
};

// Read and clear in one step — a stale value must not redirect a
// later, unrelated sign-in.
export const takeNext = () => {
  try {
    const value = safeNext(
      sessionStorage.getItem(NEXT_KEY)
    );

    sessionStorage.removeItem(NEXT_KEY);

    return value;
  } catch {
    return null;
  }
};
