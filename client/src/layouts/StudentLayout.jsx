import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Avatar, cx, useClickOutside } from "../components/ui";
import {
  ChartIcon,
  ChevronDownIcon,
  ClipboardIcon,
  BookIcon,
  GridIcon,
  HomeIcon,
  LayersIcon,
  LogoutIcon,
  PencilIcon,
  SettingsIcon,
  TrophyIcon,
  UserIcon,
} from "../components/ui/Icons";
import { BrandMark, ThemeToggle } from "./PublicLayout";

// ==========================================================
// NAVIGATION MODEL
// ==========================================================
// `feature` names match the flags in SiteSettings.features, so
// turning off e.g. the leaderboard removes it from the sidebar
// and the bottom bar at once.
//
// `primary` marks the four items that fit the mobile bottom bar.
// ==========================================================

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: HomeIcon,
    primary: true,
  },
  {
    to: "/practice",
    label: "Practice",
    icon: PencilIcon,
    feature: "practice",
    primary: true,
  },
  {
    to: "/exams",
    label: "Mock exams",
    icon: ClipboardIcon,
    feature: "exams",
    primary: true,
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: ChartIcon,
    feature: "analytics",
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    icon: TrophyIcon,
    feature: "leaderboard",
  },
  {
    to: "/materials",
    label: "Study notes",
    icon: BookIcon,
    feature: "studyMaterials",
  },
  {
    to: "/history",
    label: "History",
    icon: LayersIcon,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserIcon,
  },
];

const useVisibleNav = () => {
  const { features } = useSettings();

  return NAV_ITEMS.filter(
    (item) => !item.feature || features?.[item.feature] !== false
  );
};

// ==========================================================
// ACCOUNT MENU
// ==========================================================

const AccountMenu = () => {
  const { user, logout, isAdmin } = useAuth();

  const [open, setOpen] = useState(false);

  const ref = useClickOutside(() => setOpen(false));

  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-surface-2"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar
          name={user.name}
          src={user.avatar}
          size="sm"
        />

        <span className="hidden max-w-32 truncate text-sm font-semibold text-ink sm:block">
          {user.name}
        </span>

        <ChevronDownIcon
          className={cx(
            "size-4 text-subtle transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-pop"
          role="menu"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {user.name}
            </p>
            <p className="truncate text-xs text-subtle">
              {user.email}
            </p>
          </div>

          <div className="p-1.5">
            <Link
              to="/profile"
              className="flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              role="menuitem"
            >
              <UserIcon className="size-4" />
              My profile
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                role="menuitem"
              >
                <SettingsIcon className="size-4" />
                Admin dashboard
              </Link>
            )}

            <Link
              to="/"
              className="flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              role="menuitem"
            >
              <GridIcon className="size-4" />
              Public site
            </Link>

            <button
              type="button"
              onClick={logout}
              className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm text-danger transition-colors hover:bg-danger-soft"
              role="menuitem"
            >
              <LogoutIcon className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================
// SIDEBAR (lg and up)
// ==========================================================

const Sidebar = () => {
  const items = useVisibleNav();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-4">
        <BrandMark />
      </div>

      <nav
        className="flex-1 overflow-y-auto p-3"
        aria-label="Student"
      >
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-muted hover:bg-surface-2 hover:text-ink"
                  )
                }
              >
                <item.icon className="size-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <GridIcon className="size-5 shrink-0" />
          Public site
        </Link>
      </div>
    </aside>
  );
};

// ==========================================================
// BOTTOM NAV (below lg)
// ==========================================================
// Four primary destinations plus "More", which opens a sheet
// holding whatever didn't fit. Fixed, with safe-area padding so
// it clears a notched phone's home indicator.

const BottomNav = () => {
  const items = useVisibleNav();

  const [sheetOpen, setSheetOpen] = useState(false);

  const location = useLocation();

  useEffect(() => setSheetOpen(false), [location.pathname]);

  const primary = items.filter((item) => item.primary);
  const rest = items.filter((item) => !item.primary);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
        aria-label="Student"
      >
        <ul className="flex items-stretch pb-safe">
          {primary.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-semibold transition-colors",
                    isActive
                      ? "text-brand-600"
                      : "text-subtle hover:text-ink"
                  )
                }
              >
                <item.icon className="size-5" />
                <span className="max-w-full truncate">
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}

          {rest.length > 0 && (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cx(
                  "flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-semibold transition-colors",
                  sheetOpen
                    ? "text-brand-600"
                    : "text-subtle hover:text-ink"
                )}
                aria-expanded={sheetOpen}
              >
                <GridIcon className="size-5" />
                More
              </button>
            </li>
          )}
        </ul>
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-xl bg-surface p-3 pb-safe shadow-pop">
            <div
              className="mx-auto mb-3 h-1 w-10 rounded-full bg-line"
              aria-hidden="true"
            />

            <ul className="grid grid-cols-2 gap-2 xs:grid-cols-3">
              {rest.map((item) => (
                <li key={`sheet-${item.to}`}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cx(
                        "flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border border-line p-2 text-center text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-muted hover:bg-surface-2 hover:text-ink"
                      )
                    }
                  >
                    <item.icon className="size-5" />
                    <span className="leading-tight">
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================================
// LAYOUT
// ==========================================================

const StudentLayout = () => (
  <div className="flex min-h-dvh bg-bg">
    <Sidebar />

    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <BrandMark />
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Pages supply their own `.shell` wrapper, so the layout
          only owns chrome and the bottom-nav clearance. */}
      <main id="main" className="flex-1 mb-safe-nav lg:mb-0">
        <Outlet />
      </main>
    </div>

    <BottomNav />
  </div>
);

export default StudentLayout;
export { AccountMenu, useVisibleNav };
