import { ChevronRightIcon } from "./ui/Icons";
import { cx } from "./ui";

// ==========================================================
// PAGINATION
// ==========================================================
// Shared by the public materials list and the admin tables, so
// paging behaves identically in both places.
//
// On phones the numbered buttons are dropped entirely — prev /
// "page 3 of 12" / next is all that fits without the row wrapping
// into an unusable grid of tap targets.
// ==========================================================

// A window of page numbers around the current one, with the first
// and last always present so the ends stay reachable.
const pageWindow = (current, total, span = 1) => {
  const pages = new Set([1, total]);

  for (let i = current - span; i <= current + span; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);

  // Insert gap markers so 1 … 5 6 7 … 12 renders honestly
  // rather than pretending 1 and 5 are adjacent.
  return sorted.reduce((out, page, index) => {
    const previous = sorted[index - 1];

    if (previous && page - previous > 1) {
      out.push({ gap: true, key: `gap-${page}` });
    }

    out.push({ page, key: page });

    return out;
  }, []);
};

const Arrow = ({ direction, disabled, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={cx(
      "grid size-10 place-items-center rounded-md border border-line text-muted transition-colors",
      disabled
        ? "cursor-not-allowed opacity-40"
        : "cursor-pointer hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
    )}
  >
    <ChevronRightIcon
      className={cx(
        "size-4",
        direction === "prev" && "rotate-180"
      )}
    />
  </button>
);

const Pagination = ({
  page = 1,
  totalPages = 1,
  total,
  limit,
  onChange,
  className,
  label = "results",
}) => {
  // One page of results needs no control at all.
  if (!totalPages || totalPages < 2) return null;

  const current = Math.min(Math.max(page, 1), totalPages);

  const go = (target) => {
    const next = Math.min(Math.max(target, 1), totalPages);

    if (next !== current) onChange(next);
  };

  const from = total ? (current - 1) * (limit || 0) + 1 : 0;
  const to = total
    ? Math.min(current * (limit || 0), total)
    : 0;

  return (
    <nav
      className={cx(
        "flex flex-col items-center gap-3 sm:flex-row sm:justify-between",
        className
      )}
      aria-label="Pagination"
    >
      {total !== undefined && limit ? (
        <p className="text-xs text-subtle">
          Showing{" "}
          <span className="font-semibold text-muted">
            {from}–{to}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-muted">
            {total}
          </span>{" "}
          {label}
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1.5">
        <Arrow
          direction="prev"
          label="Previous page"
          disabled={current === 1}
          onClick={() => go(current - 1)}
        />

        {/* ---------- Phones: a plain position readout ---------- */}
        <span className="px-2 text-sm font-semibold text-muted sm:hidden">
          {current} / {totalPages}
        </span>

        {/* ---------- Wider: numbered pages ---------- */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {pageWindow(current, totalPages).map((item) =>
            item.gap ? (
              <span
                key={item.key}
                className="grid size-10 place-items-center text-sm text-subtle"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.page)}
                aria-current={
                  item.page === current ? "page" : undefined
                }
                className={cx(
                  "min-w-10 cursor-pointer rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                  item.page === current
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-line text-muted hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                )}
              >
                {item.page}
              </button>
            )
          )}
        </div>

        <Arrow
          direction="next"
          label="Next page"
          disabled={current === totalPages}
          onClick={() => go(current + 1)}
        />
      </div>
    </nav>
  );
};

export default Pagination;
