import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import { Avatar, cx } from "../components/ui";
import {
  ArrowRightIcon,
  CloseIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
} from "../components/ui/Icons";

// ==========================================================
// BRAND MARK
// ==========================================================

export const BrandMark = ({ className, showName = true }) => {
  const { branding, siteName } = useSettings();

  const logoUrl = branding?.logoUrl;

  return (
    <Link
      to="/"
      className={cx(
        "flex min-w-0 items-center gap-2.5",
        className
      )}
      aria-label={`${siteName} home`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="size-9 shrink-0 rounded-md object-contain"
        />
      ) : (
        <span
          className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-500 text-base font-black text-white"
          aria-hidden="true"
        >
          {siteName.charAt(0).toUpperCase()}
        </span>
      )}

      {showName && (
        <span className="truncate text-[0.9375rem] font-bold tracking-tight text-ink sm:text-base">
          {siteName}
        </span>
      )}
    </Link>
  );
};

// ==========================================================
// THEME TOGGLE
// ==========================================================

export const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cx("btn btn-ghost btn-icon", className)}
      aria-label={
        isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <SunIcon className="size-5" />
      ) : (
        <MoonIcon className="size-5" />
      )}
    </button>
  );
};

// ==========================================================
// ANNOUNCEMENT BANNER
// ==========================================================
// The server only sends `banner` while it is enabled and inside
// its date window, so there is no date logic to do here.

const BANNER_TONES = {
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
};

const AnnouncementBanner = () => {
  const { banner } = useSettings();

  const [dismissed, setDismissed] = useState(false);

  if (!banner?.message || dismissed) return null;

  return (
    <div
      className={cx(
        "relative",
        BANNER_TONES[banner.variant] || BANNER_TONES.info
      )}
    >
      <div className="shell flex items-center justify-center gap-3 py-2.5 pr-8 text-center text-[0.8125rem] font-medium sm:text-sm">
        <p className="min-w-0">
          {banner.message}

          {banner.linkHref && (
            <a
              href={banner.linkHref}
              className="ml-2 inline-flex items-center gap-1 font-bold underline underline-offset-2"
            >
              {banner.linkLabel || "Learn more"}
              <ArrowRightIcon className="size-3.5" />
            </a>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Dismiss announcement"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
};

// ==========================================================
// HEADER
// ==========================================================

const PublicHeader = () => {
  const { navigation, features } = useSettings();
  const { user } = useAuth();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer on navigation, otherwise it stays open over
  // the page the user just tapped through to.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  // Hide links to areas the admin has switched off.
  const featureGate = {
    "/leaderboard": "leaderboard",
    "/materials": "studyMaterials",
    "/exams": "exams",
  };

  const links = (navigation?.navLinks || []).filter((link) => {
    const flag = featureGate[link.href];

    return !flag || features?.[flag] !== false;
  });

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <BrandMark />

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main"
          >
            {links.map((link) => (
              <NavLink
                key={`${link.href}-${link.label}`}
                to={link.href}
                end={link.href === "/"}
                className={({ isActive }) =>
                  cx(
                    "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-muted hover:bg-surface-2 hover:text-ink"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />

            {user ? (
              <Link
                to="/dashboard"
                className="btn btn-primary gap-2"
              >
                <Avatar
                  name={user.name}
                  src={user.avatar}
                  size="xs"
                  className="-ml-1 hidden sm:block"
                />
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="btn btn-ghost btn-icon lg:hidden"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <MenuIcon className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-surface shadow-pop">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <BrandMark />

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn btn-ghost btn-icon"
                aria-label="Close menu"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <nav
              className="flex-1 overflow-y-auto p-3"
              aria-label="Mobile"
            >
              {links.map((link) => (
                <NavLink
                  key={`drawer-${link.href}-${link.label}`}
                  to={link.href}
                  end={link.href === "/"}
                  className={({ isActive }) =>
                    cx(
                      "flex min-h-12 items-center rounded-md px-3 text-[0.9375rem] font-semibold transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-muted hover:bg-surface-2 hover:text-ink"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="shrink-0 border-t border-line p-4 pb-safe">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary w-full"
                >
                  Go to dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary w-full"
                >
                  Sign in with Google
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================================
// FOOTER
// ==========================================================

const PublicFooter = () => {
  const { navigation, branding, siteName } = useSettings();

  const groups = navigation?.footerGroups || [];

  const socials = (navigation?.socialLinks || []).filter(
    (link) => link.href
  );

  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="shell py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <BrandMark />

            <p className="mt-3 max-w-xs text-sm text-muted">
              {branding?.tagline}
            </p>

            {socials.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-outline btn-sm"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold tracking-widest text-subtle uppercase">
                {group.title}
              </h3>

              <ul className="mt-3 space-y-2">
                {(group.links || []).map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      to={link.href || "#"}
                      className="text-sm text-muted transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {(navigation?.contactEmail ||
            navigation?.contactPhone) && (
            <div>
              <h3 className="text-xs font-bold tracking-widest text-subtle uppercase">
                Get in touch
              </h3>

              <ul className="mt-3 space-y-2 text-sm text-muted">
                {navigation.contactEmail && (
                  <li>
                    <a
                      href={`mailto:${navigation.contactEmail}`}
                      className="break-all transition-colors hover:text-brand-600"
                    >
                      {navigation.contactEmail}
                    </a>
                  </li>
                )}

                {navigation.contactPhone && (
                  <li>
                    <a
                      href={`tel:${navigation.contactPhone}`}
                      className="transition-colors hover:text-brand-600"
                    >
                      {navigation.contactPhone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteName}. All rights reserved.
          </p>

          <p>
            Built for Nigerian students preparing for JAMB, WAEC,
            NECO and Post-UTME.
          </p>
        </div>
      </div>
    </footer>
  );
};

// ==========================================================
// LAYOUT
// ==========================================================

const PublicLayout = () => (
  <div className="flex min-h-dvh flex-col bg-bg">
    <a
      href="#main"
      className="sr-only-focusable absolute top-2 left-2 z-50 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
    >
      Skip to content
    </a>

    <AnnouncementBanner />
    <PublicHeader />

    <main id="main" className="flex-1">
      <Outlet />
    </main>

    <PublicFooter />
  </div>
);

export default PublicLayout;
