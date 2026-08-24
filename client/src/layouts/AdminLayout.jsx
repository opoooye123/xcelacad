import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import { cx } from "../components/ui";
import {
  BookIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CloseIcon,
  GridIcon,
  HomeIcon,
  LayersIcon,
  MenuIcon,
  PencilIcon,
  SettingsIcon,
  UploadIcon,
  UsersIcon,
} from "../components/ui/Icons";
import { BrandMark, ThemeToggle } from "./PublicLayout";
import { AccountMenu } from "./StudentLayout";

// ==========================================================
// ADMIN NAVIGATION
// ==========================================================
// Grouped because the flat list gets long: content authoring is
// a different job from managing people and the public site.
// ==========================================================

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: HomeIcon, end: true },
    ],
  },
  {
    title: "Question bank",
    items: [
      {
        to: "/admin/subjects",
        label: "Subjects",
        icon: GridIcon,
      },
      {
        to: "/admin/topics",
        label: "Topics",
        icon: LayersIcon,
      },
      {
        to: "/admin/questions",
        label: "Questions",
        icon: PencilIcon,
      },
      {
        to: "/admin/questions/import",
        label: "Bulk import",
        icon: UploadIcon,
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        to: "/admin/exams",
        label: "Exams",
        icon: ClipboardIcon,
      },
      {
        to: "/admin/materials",
        label: "Study notes",
        icon: BookIcon,
      },
    ],
  },
  {
    title: "Platform",
    items: [
      { to: "/admin/users", label: "Users", icon: UsersIcon },
      {
        to: "/admin/settings",
        label: "Site settings",
        icon: SettingsIcon,
      },
    ],
  },
];

const NavItems = ({ onNavigate }) => (
  <>
    {NAV_GROUPS.map((group) => (
      <div key={group.title} className="mb-5 last:mb-0">
        <p className="mb-1.5 px-3 text-[0.6875rem] font-bold tracking-widest text-subtle uppercase">
          {group.title}
        </p>

        <ul className="space-y-0.5">
          {group.items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-muted hover:bg-surface-2 hover:text-ink"
                  )
                }
              >
                <item.icon className="size-[1.125rem] shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </>
);

// ==========================================================
// LAYOUT
// ==========================================================

const AdminLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const location = useLocation();

  useEffect(() => setDrawerOpen(false), [location.pathname]);

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

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-4">
          <BrandMark showName={false} />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">
              Admin
            </p>
            <p className="truncate text-[0.6875rem] text-subtle">
              Content & platform
            </p>
          </div>
        </div>

        <nav
          className="flex-1 overflow-y-auto p-3"
          aria-label="Admin"
        >
          <NavItems />
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <Link
            to="/dashboard"
            className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ChevronRightIcon className="size-4 rotate-180" />
            Student view
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="btn btn-ghost btn-icon lg:hidden"
                aria-label="Open admin menu"
                aria-expanded={drawerOpen}
              >
                <MenuIcon className="size-6" />
              </button>

              <div className="lg:hidden">
                <BrandMark />
              </div>

              <span className="badge badge-brand hidden lg:inline-flex">
                Admin
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <AccountMenu />
            </div>
          </div>
        </header>

        {/* Pages supply their own `.shell` wrapper. */}
        <main id="main" className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col bg-surface shadow-pop">
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
              aria-label="Admin"
            >
              <NavItems
                onNavigate={() => setDrawerOpen(false)}
              />
            </nav>

            <div className="shrink-0 border-t border-line p-3 pb-safe">
              <Link
                to="/dashboard"
                className="btn btn-outline w-full"
              >
                Student view
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
