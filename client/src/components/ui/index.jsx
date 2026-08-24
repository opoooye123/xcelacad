// ==========================================================
// SHARED UI PRIMITIVES
// ==========================================================
// Small, unopinionated pieces used across public, student and
// admin screens. Anything specific to one area lives with it.
// ==========================================================

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CloseIcon,
  InfoIcon,
  SearchIcon,
} from "./Icons";
import { initialsOf } from "../../lib/format";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export { cx };

// ==========================================================
// SPINNER + LOADING STATES
// ==========================================================

export const Spinner = ({ className = "size-5" }) => (
  <svg
    className={cx("animate-spin", className)}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeOpacity="0.2"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export const PageLoader = ({ label = "Loading…" }) => (
  <div
    className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted"
    role="status"
    aria-live="polite"
  >
    <Spinner className="size-7 text-brand-500" />
    <p className="text-sm">{label}</p>
  </div>
);

export const SkeletonBlock = ({ className = "h-4 w-full" }) => (
  <div className={cx("skeleton", className)} />
);

export const SkeletonCard = () => (
  <div className="card card-pad space-y-3">
    <SkeletonBlock className="h-4 w-2/5" />
    <SkeletonBlock className="h-3 w-full" />
    <SkeletonBlock className="h-3 w-4/5" />
    <SkeletonBlock className="h-9 w-28 rounded-md" />
  </div>
);

// ==========================================================
// FEEDBACK BLOCKS
// ==========================================================

const ALERT_TONES = {
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

const ALERT_ICONS = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertIcon,
  danger: AlertIcon,
};

export const Alert = ({
  tone = "info",
  title,
  children,
  onDismiss,
  className,
}) => {
  const ToneIcon = ALERT_ICONS[tone] || InfoIcon;

  return (
    <div
      className={cx(
        "flex items-start gap-3 rounded-md px-4 py-3 text-sm",
        ALERT_TONES[tone] || ALERT_TONES.info,
        className
      )}
      role={
        tone === "danger" || tone === "warning"
          ? "alert"
          : "status"
      }
    >
      <ToneIcon className="mt-0.5 size-5 shrink-0" />

      <div className="min-w-0 flex-1">
        {title && (
          <p className="font-semibold">{title}</p>
        )}
        {children && (
          <div className={cx(title && "mt-0.5", "opacity-90")}>
            {children}
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 rounded p-1 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <CloseIcon className="size-4" />
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({
  icon: EmptyIcon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cx(
      "flex flex-col items-center justify-center px-6 py-12 text-center",
      className
    )}
  >
    {EmptyIcon && (
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-surface-2 text-subtle">
        <EmptyIcon className="size-7" />
      </span>
    )}

    <h3 className="text-base font-semibold text-ink">
      {title}
    </h3>

    {description && (
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        {description}
      </p>
    )}

    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ error, onRetry, className }) => (
  <div className={cx("card card-pad", className)}>
    <EmptyState
      icon={AlertIcon}
      title="Something went wrong"
      description={
        error?.message ||
        "We couldn't load this. Please try again."
      }
      action={
        onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-outline"
          >
            Try again
          </button>
        )
      }
    />
  </div>
);

// ==========================================================
// BADGE / PILL
// ==========================================================

const BADGE_TONES = {
  brand: "badge-brand",
  neutral: "badge-neutral",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
};

export const Badge = ({
  tone = "neutral",
  children,
  className,
}) => (
  <span
    className={cx(
      "badge",
      BADGE_TONES[tone] || BADGE_TONES.neutral,
      className
    )}
  >
    {children}
  </span>
);

// ==========================================================
// PROGRESS
// ==========================================================

const BAR_TONES = {
  brand: "bg-brand-500",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export const ProgressBar = ({
  value = 0,
  tone = "brand",
  className,
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div
      className={cx(
        "h-2 w-full overflow-hidden rounded-full bg-surface-2",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cx(
          "h-full rounded-full transition-[width] duration-500",
          BAR_TONES[tone] || BAR_TONES.brand
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

// ==========================================================
// AVATAR
// ==========================================================

export const Avatar = ({
  name,
  src,
  size = "md",
  className,
}) => {
  const [failed, setFailed] = useState(false);

  const sizes = {
    xs: "size-7 text-[0.625rem]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-base",
    xl: "size-20 text-xl",
  };

  const shared = cx(
    "shrink-0 overflow-hidden rounded-full",
    sizes[size] || sizes.md,
    className
  );

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s avatar` : "Avatar"}
        className={cx(shared, "object-cover")}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    );
  }

  return (
    <span
      className={cx(
        shared,
        "grid place-items-center bg-brand-100 font-bold text-brand-700"
      )}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
};

// ==========================================================
// STAT TILE
// ==========================================================

export const StatTile = ({
  label,
  value,
  hint,
  icon: TileIcon,
  tone = "brand",
  className,
}) => {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
  };

  return (
    <div className={cx("card card-pad", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {label}
        </p>

        {TileIcon && (
          <span
            className={cx(
              "grid size-9 shrink-0 place-items-center rounded-md",
              tones[tone] || tones.brand
            )}
          >
            <TileIcon className="size-[1.125rem]" />
          </span>
        )}
      </div>

      <p className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
        {value}
      </p>

      {hint && (
        <p className="mt-1 text-xs text-subtle">{hint}</p>
      )}
    </div>
  );
};

// ==========================================================
// SECTION HEADER
// ==========================================================

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cx(
      "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
      className
    )}
  >
    <div className="min-w-0">
      {eyebrow && (
        <p className="mb-1 text-xs font-bold tracking-widest text-brand-600 uppercase">
          {eyebrow}
        </p>
      )}

      <h2 className="text-xl font-bold text-ink sm:text-2xl">
        {title}
      </h2>

      {description && (
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          {description}
        </p>
      )}
    </div>

    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// ==========================================================
// PAGE HEADER (student + admin pages)
// ==========================================================

export const PageHeader = ({
  title,
  description,
  action,
  breadcrumb,
  className,
}) => (
  <header className={cx("mb-6", className)}>
    {breadcrumb && (
      <nav
        className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-subtle"
        aria-label="Breadcrumb"
      >
        {breadcrumb.map((crumb, index) => (
          <span
            key={`${crumb.label}-${index}`}
            className="flex items-center gap-1.5"
          >
            {index > 0 && <span aria-hidden="true">/</span>}

            {crumb.to ? (
              <Link
                to={crumb.to}
                className="hover:text-brand-600"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-muted">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    )}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {action}
        </div>
      )}
    </div>
  </header>
);

// ==========================================================
// SEARCH INPUT
// ==========================================================

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search…",
  className,
  onClear,
}) => (
  <div className={cx("relative", className)}>
    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />

    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="input pl-9"
      aria-label={placeholder}
    />

    {value && onClear && (
      <button
        type="button"
        onClick={onClear}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-subtle hover:text-ink"
        aria-label="Clear search"
      >
        <CloseIcon className="size-4" />
      </button>
    )}
  </div>
);

// ==========================================================
// SELECT
// ==========================================================

export const Select = ({
  value,
  onChange,
  options = [],
  placeholder,
  className,
  ...rest
}) => (
  <div className={cx("relative", className)}>
    <select
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="input appearance-none pr-9"
      {...rest}
    >
      {placeholder !== undefined && (
        <option value="">{placeholder}</option>
      )}

      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle" />
  </div>
);

// ==========================================================
// TABS
// ==========================================================

export const Tabs = ({ tabs, active, onChange, className }) => (
  <div
    className={cx(
      "scroll-x no-scrollbar border-b border-line",
      className
    )}
  >
    <div
      className="flex min-w-max gap-1"
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cx(
              "relative min-h-11 cursor-pointer px-3 text-sm font-semibold whitespace-nowrap transition-colors sm:px-4",
              isActive
                ? "text-brand-600"
                : "text-muted hover:text-ink"
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}

              {tab.count !== undefined && (
                <span
                  className={cx(
                    "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-bold",
                    isActive
                      ? "bg-brand-100 text-brand-700"
                      : "bg-surface-2 text-subtle"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>

            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ==========================================================
// ACCORDION (FAQ)
// ==========================================================

export const Accordion = ({ items = [], className }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div
      className={cx(
        "divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface",
        className
      )}
    >
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={`${item.question}-${index}`}>
            <button
              type="button"
              onClick={() =>
                setOpenIndex(isOpen ? null : index)
              }
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-ink sm:text-base">
                {item.question}
              </span>

              <ChevronDownIcon
                className={cx(
                  "size-5 shrink-0 text-subtle transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-4 text-sm leading-relaxed text-muted sm:px-5">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ==========================================================
// CLICK-OUTSIDE HELPER
// ==========================================================
// Used by the header account menu and admin row menus.

export const useClickOutside = (onOutside) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        onOutside();
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onOutside]);

  return ref;
};
