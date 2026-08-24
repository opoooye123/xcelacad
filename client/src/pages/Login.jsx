import { useEffect } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useDocumentTitle } from "../hooks/useApi";
import { endpoints } from "../lib/api";
import { safeNext, stashNext } from "../lib/authNext";
import { Alert, cx } from "../components/ui";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChartIcon,
  ClockIcon,
  GoogleIcon,
  TargetIcon,
} from "../components/ui/Icons";
import { BrandMark } from "../layouts/PublicLayout";

// ==========================================================
// SIGN IN
// ==========================================================
// Google is the only credential path — passport-google-oauth20 on
// the server, no password to store or leak.
//
// The destination the visitor was heading for can't ride along
// through Google's redirect, so `stashNext` parks it and
// AuthSuccess picks it back up (see lib/authNext.js).
// ==========================================================

const AUTH_ERRORS = {
  auth_failed:
    "Google sign-in didn't complete. Please try again.",
  blocked:
    "This account has been suspended. Contact support if you think that's a mistake.",
  registration_closed:
    "New sign-ups are paused right now. Please check back later.",
};

const PERKS = [
  {
    icon: ClockIcon,
    text: "Timed CBT practice that mirrors the real paper",
  },
  {
    icon: ChartIcon,
    text: "Accuracy broken down by subject and topic",
  },
  {
    icon: TargetIcon,
    text: "Practise any past-paper year on demand",
  },
];

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { isAuthenticated, loading } = useAuth();
  const { siteName, branding, isFeatureOn } = useSettings();

  useDocumentTitle("Sign in", siteName);

  const next = safeNext(searchParams.get("next"));
  const errorCode = searchParams.get("error");

  const registrationOpen = isFeatureOn("registrationOpen");

  // PublicOnlyRoute already handles the common case; this covers
  // a session that resolves while the page is open.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(next || "/dashboard", { replace: true });
    }
  }, [loading, isAuthenticated, next, navigate]);

  const startGoogle = () => {
    stashNext(next);

    // A full page load, not a fetch: the OAuth consent screen has
    // to happen in the top-level browsing context.
    window.location.href = endpoints.auth.google;
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ---------- Form side ---------- */}
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-3">
          <BrandMark />

          <Link
            to="/"
            className="btn btn-ghost btn-sm text-muted"
          >
            <ArrowLeftIcon className="size-4" />
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-muted">
              Sign in with Google to pick up where you left
              off. New here? The same button creates your
              account.
            </p>

            {errorCode && (
              <Alert tone="danger" className="mt-6">
                {AUTH_ERRORS[errorCode] ||
                  "Something went wrong signing you in. Please try again."}
              </Alert>
            )}

            {!registrationOpen && (
              <Alert tone="warning" className="mt-6">
                New sign-ups are paused. Existing accounts can
                still sign in.
              </Alert>
            )}

            <button
              type="button"
              onClick={startGoogle}
              className={cx(
                "btn btn-outline btn-lg mt-7 w-full",
                "border-line bg-surface font-semibold text-ink"
              )}
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>

            {next && (
              <p className="mt-3 text-center text-xs text-subtle">
                You'll be taken to{" "}
                <span className="font-semibold text-muted">
                  {next}
                </span>{" "}
                after signing in.
              </p>
            )}

            <ul className="mt-8 space-y-2.5">
              {PERKS.map((perk) => (
                <li
                  key={perk.text}
                  className="flex items-start gap-2.5 text-sm text-muted"
                >
                  <perk.icon className="mt-0.5 size-4 shrink-0 text-brand-500" />
                  {perk.text}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-xs leading-relaxed text-subtle">
              We only read your name, email address and profile
              picture from Google. By continuing you agree to
              use {siteName} for your own exam preparation.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-subtle lg:text-left">
          Trouble signing in?{" "}
          <Link
            to="/contact"
            className="font-semibold text-brand-600 hover:underline"
          >
            Contact support
          </Link>
        </p>
      </div>

      {/* ---------- Brand side (desktop only) ---------- */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 lg:block">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(35rem_25rem_at_80%_10%,rgba(255,255,255,0.2),transparent)]"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col justify-center px-12 py-16">
          <p className="text-xs font-bold tracking-widest text-white/70 uppercase">
            {branding?.tagline || "Practice smarter"}
          </p>

          <h2 className="mt-4 max-w-md text-3xl leading-tight font-bold text-white">
            Every past question, every year, on the device
            you already carry.
          </h2>

          <ul className="mt-8 max-w-md space-y-3">
            {[
              "Sit a real timed paper in under a minute from now",
              "Worked explanations on every single answer",
              "Analytics that name the topics costing you marks",
              "Free to start — no card, no trial period",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-white/85"
              >
                <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-white/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default Login;
