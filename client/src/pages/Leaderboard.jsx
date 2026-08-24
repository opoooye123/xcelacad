import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useApiData, useDocumentTitle } from "../hooks/useApi";
import { endpoints } from "../lib/api";
import {
  formatPercent,
  formatRelative,
  ordinal,
  pluralize,
} from "../lib/format";
import {
  Avatar,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  SkeletonBlock,
  Tabs,
  cx,
} from "../components/ui";
import {
  ArrowRightIcon,
  TrophyIcon,
} from "../components/ui/Icons";

// ==========================================================
// LEADERBOARD
// ==========================================================
// Rendered in AdaptiveLayout, so a visitor sees it too — that is
// deliberate, it is one of the better reasons to sign up. The
// endpoint uses optionalAuth, which means the viewer's own row
// comes back only when a token is present.
// ==========================================================

const PERIODS = [
  { id: "all", label: "All time" },
  { id: "month", label: "This month" },
  { id: "week", label: "This week" },
  { id: "today", label: "Today" },
];

const SCOPES = [
  { value: "all", label: "Everything" },
  { value: "exams", label: "Mock exams only" },
  { value: "practice", label: "Practice only" },
];

// Gold / silver / bronze for the top three, neutral after that.
const MEDALS = {
  1: "bg-warning-soft text-warning ring-warning/30",
  2: "bg-surface-2 text-muted ring-line",
  3: "bg-danger-soft text-danger ring-danger/25",
};

const RankBadge = ({ rank }) => (
  <span
    className={cx(
      "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ring-1",
      MEDALS[rank] ||
        "bg-surface-2 text-subtle ring-transparent"
    )}
  >
    {rank}
  </span>
);

// ----------------------------------------------------------
// PODIUM (top three, desktop only)
// ----------------------------------------------------------
// Ordered 2 · 1 · 3 visually, so first place sits in the middle.

const Podium = ({ rows }) => {
  const [first, second, third] = rows;

  if (!first) return null;

  const order = [second, first, third].filter(Boolean);

  return (
    <div className="mb-6 hidden gap-4 sm:grid sm:grid-cols-3">
      {order.map((row) => {
        const isFirst = row.rank === 1;

        return (
          <div
            key={row.student._id}
            className={cx(
              "card flex flex-col items-center p-5 text-center",
              isFirst
                ? "border-brand-300 bg-brand-50 sm:-mt-3 sm:pb-7"
                : ""
            )}
          >
            <RankBadge rank={row.rank} />

            <Avatar
              name={row.student.name}
              src={row.student.avatar}
              size={isFirst ? "lg" : "md"}
              className="mt-3"
            />

            <p className="mt-3 max-w-full truncate text-sm font-bold text-ink">
              {row.student.name}
            </p>

            <p
              className={cx(
                "mt-1 font-bold",
                isFirst
                  ? "text-2xl text-brand-700"
                  : "text-xl text-ink"
              )}
            >
              {formatPercent(row.averagePercentage)}
            </p>

            <p className="mt-0.5 text-xs text-subtle">
              {row.attempts}{" "}
              {pluralize(row.attempts, "attempt")}
            </p>
          </div>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------
// ROW
// ----------------------------------------------------------

const Row = ({ row, isMe }) => (
  <li
    className={cx(
      "flex items-center gap-3 px-4 py-3 sm:gap-4",
      isMe && "bg-brand-50"
    )}
  >
    <RankBadge rank={row.rank} />

    <Avatar
      name={row.student.name}
      src={row.student.avatar}
      size="sm"
    />

    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
        <span className="truncate">
          {row.student.name}
        </span>

        {isMe && (
          <span className="badge badge-brand shrink-0">
            You
          </span>
        )}
      </p>

      <p className="mt-0.5 truncate text-xs text-subtle">
        {row.attempts}{" "}
        {pluralize(row.attempts, "attempt")}
        {row.lastAttemptAt && (
          <>
            {" · "}
            {formatRelative(row.lastAttemptAt)}
          </>
        )}
      </p>
    </div>

    {/* Best score is useful but secondary — it only earns space
        once the row is wide enough for it. */}
    <div className="hidden text-right sm:block">
      <p className="text-xs text-subtle">Best</p>
      <p className="text-sm font-semibold text-muted">
        {formatPercent(row.bestPercentage)}
      </p>
    </div>

    <div className="shrink-0 text-right">
      <p className="text-base font-bold text-ink sm:text-lg">
        {formatPercent(row.averagePercentage)}
      </p>
      <p className="text-[0.6875rem] text-subtle">average</p>
    </div>
  </li>
);

// ----------------------------------------------------------
// PAGE
// ----------------------------------------------------------

const Leaderboard = () => {
  const { siteName } = useSettings();
  const { user, isAuthenticated } = useAuth();

  useDocumentTitle("Leaderboard", siteName);

  const [period, setPeriod] = useState("all");
  const [scope, setScope] = useState("all");
  const [subject, setSubject] = useState("");

  const { data: catalog } = useApiData(
    endpoints.catalog.subjects,
    { auth: false }
  );

  const subjectOptions = useMemo(
    () =>
      (catalog?.subjects || []).map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    [catalog]
  );

  const { data, loading, error, refetch } = useApiData(
    endpoints.leaderboard,
    {
      // Sent authenticated when possible so the viewer's own row
      // comes back; the route accepts anonymous requests too.
      auth: isAuthenticated,
      params: { period, scope, subject, limit: 50 },
    }
  );

  const rows = data?.rows || [];
  const me = data?.me || null;

  const myId = user?._id ? String(user._id) : null;

  // The viewer ranked outside the returned slice: show their row
  // pinned below rather than letting them think they're unranked.
  const meOutsideList =
    me &&
    !rows.some(
      (row) =>
        String(row.student._id) === String(me.student._id)
    );

  return (
    <div className="shell py-6 lg:py-8">
      <PageHeader
        title="Leaderboard"
        description="Ranked by average score across completed attempts. Only students with enough attempts to be meaningful appear here."
        action={
          !isAuthenticated && (
            <Link to="/login" className="btn btn-primary">
              Join the table
              <ArrowRightIcon className="size-4" />
            </Link>
          )
        }
      />

      <Tabs
        tabs={PERIODS}
        active={period}
        onChange={setPeriod}
        className="mb-4"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Select
          value={scope}
          onChange={setScope}
          options={SCOPES}
          className="sm:w-52"
          aria-label="Filter by attempt type"
        />

        {subjectOptions.length > 0 && (
          <Select
            value={subject}
            onChange={setSubject}
            options={subjectOptions}
            placeholder="All subjects"
            className="sm:w-56"
            aria-label="Filter by subject"
          />
        )}
      </div>

      {/* ---------- Your standing ---------- */}
      {isAuthenticated && !loading && !error && (
        <div className="card card-pad mb-6">
          {me ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={user?.name}
                  src={user?.avatar}
                  size="md"
                />

                <div>
                  <p className="text-sm font-semibold text-ink">
                    You're {ordinal(me.rank)}
                  </p>
                  <p className="text-xs text-subtle">
                    {me.attempts}{" "}
                    {pluralize(me.attempts, "attempt")} in
                    this view
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-subtle">
                    Average
                  </p>
                  <p className="text-lg font-bold text-brand-600">
                    {formatPercent(me.averagePercentage)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-subtle">Best</p>
                  <p className="text-lg font-bold text-ink">
                    {formatPercent(me.bestPercentage)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">
                  You're not ranked in this view yet
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Complete a few more attempts and your row
                  will appear here.
                </p>
              </div>

              <Link
                to="/practice"
                className="btn btn-primary btn-sm"
              >
                Practise now
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ---------- Table ---------- */}
      {loading && (
        <div className="card divide-y divide-line">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4"
            >
              <SkeletonBlock className="size-9 rounded-full" />
              <SkeletonBlock className="size-8 rounded-full" />
              <SkeletonBlock className="h-4 flex-1" />
              <SkeletonBlock className="h-5 w-14" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState error={error} onRetry={refetch} />
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="card">
          <EmptyState
            icon={TrophyIcon}
            title="Nobody on the board yet"
            description="Once students complete attempts in this period the ranking will fill in. Be the first."
            action={
              <Link
                to={isAuthenticated ? "/practice" : "/login"}
                className="btn btn-primary"
              >
                {isAuthenticated
                  ? "Start practising"
                  : "Create a free account"}
              </Link>
            }
          />
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <Podium rows={rows.slice(0, 3)} />

          <ul className="card divide-y divide-line">
            {rows.map((row) => (
              <Row
                key={row.student._id}
                row={row}
                isMe={
                  myId && String(row.student._id) === myId
                }
              />
            ))}
          </ul>

          {meOutsideList && (
            <ul className="card mt-3 divide-y divide-line border-brand-300">
              <Row row={me} isMe />
            </ul>
          )}

          <p className="mt-4 text-center text-xs text-subtle">
            Showing {rows.length} of {data?.total || 0} ranked
            {" "}
            {pluralize(data?.total || 0, "student")}
            {data?.minAttempts > 1 && (
              <>
                {" · "}minimum {data.minAttempts} attempts to
                qualify
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
