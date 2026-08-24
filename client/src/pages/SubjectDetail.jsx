import { Link, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useApiData, useDocumentTitle } from "../hooks/useApi";
import { endpoints } from "../lib/api";
import { loginPath } from "../lib/authNext";
import {
  EXAM_TYPE_LABELS,
  compactNumber,
  pluralize,
} from "../lib/format";
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
  ProgressBar,
} from "../components/ui";
import {
  ArrowRightIcon,
  BookIcon,
  ClipboardIcon,
  LayersIcon,
  PencilIcon,
  TargetIcon,
} from "../components/ui/Icons";

// ==========================================================
// SUBJECT DETAIL
// ==========================================================
// The bridge between browsing and practising: everything here
// links into /practice with the filter pre-selected, so a visitor
// who taps "2019" lands on the picker already scoped to that
// paper rather than having to rebuild the choice.
// ==========================================================

const DIFFICULTY_TONE = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

// ----------------------------------------------------------

const PracticeLink = ({
  slug,
  year,
  topic,
  isAuthenticated,
  className,
  children,
}) => {
  const search = new URLSearchParams({ subject: slug });

  if (year) search.set("year", String(year));
  if (topic) search.set("topic", topic);

  const target = `/practice?${search.toString()}`;

  // A visitor can't start an attempt, so send them to sign-in
  // with the destination remembered instead of bouncing them off
  // a protected route.
  return (
    <Link
      to={isAuthenticated ? target : loginPath(target)}
      className={className}
    >
      {children}
    </Link>
  );
};

// ----------------------------------------------------------

const SubjectDetail = () => {
  const { slug } = useParams();

  const { siteName } = useSettings();
  const { isAuthenticated } = useAuth();

  const { data, loading, error, refetch } = useApiData(
    endpoints.catalog.subject(slug),
    { auth: false }
  );

  const subject = data?.subject;

  useDocumentTitle(subject?.name || "Subject", siteName);

  if (loading) {
    return (
      <div className="shell py-6 lg:py-8">
        <PageLoader label="Loading subject…" />
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <div className="shell py-6 lg:py-8">
        <div className="card">
          <EmptyState
            icon={BookIcon}
            title="Subject not found"
            description="This subject may have been renamed or removed from the catalogue."
            action={
              <Link
                to="/subjects"
                className="btn btn-primary"
              >
                Browse all subjects
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="shell py-6 lg:py-8">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const topics = subject.topics || [];
  const years = subject.years || [];
  const examTypes = subject.examTypes || [];
  const difficulties = subject.difficulties || [];

  const hasQuestions = (subject.questionCount || 0) > 0;

  // Topic bars are relative to the biggest topic, not to the
  // subject total — otherwise every bar looks empty on a subject
  // with thirty topics.
  const topTopicCount = topics.reduce(
    (max, topic) => Math.max(max, topic.questionCount || 0),
    0
  );

  return (
    <div className="shell py-6 lg:py-8">
      <PageHeader
        breadcrumb={[
          { label: "Subjects", to: "/subjects" },
          { label: subject.name },
        ]}
        title={subject.name}
        description={subject.description}
        action={
          hasQuestions && (
            <PracticeLink
              slug={subject.slug}
              isAuthenticated={isAuthenticated}
              className="btn btn-primary"
            >
              <PencilIcon className="size-4" />
              Practise this subject
            </PracticeLink>
          )
        }
      />

      {/* ---------- Summary ---------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Questions",
            value: compactNumber(subject.questionCount || 0),
            icon: ClipboardIcon,
          },
          {
            label: "Topics",
            value: topics.length,
            icon: LayersIcon,
          },
          {
            label: "Past papers",
            value: years.length,
            icon: TargetIcon,
          },
        ].map((tile) => (
          <div
            key={tile.label}
            className="card flex items-center gap-4 p-4"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600">
              <tile.icon className="size-5" />
            </span>

            <div className="min-w-0">
              <p className="text-xl font-bold text-ink">
                {tile.value}
              </p>
              <p className="text-xs font-semibold tracking-wide text-subtle uppercase">
                {tile.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!hasQuestions && (
        <div className="card mt-6">
          <EmptyState
            icon={ClipboardIcon}
            title="No questions in this subject yet"
            description="Topics are set up, but the question bank for this subject is still being filled. Check back shortly."
            action={
              <Link
                to="/subjects"
                className="btn btn-outline"
              >
                Browse other subjects
              </Link>
            }
          />
        </div>
      )}

      {hasQuestions && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* ---------- Topics ---------- */}
          <section className="lg:col-span-2">
            <h2 className="mb-3 text-lg font-bold text-ink">
              Topics
            </h2>

            {topics.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={LayersIcon}
                  title="No topics yet"
                  description="Questions in this subject aren't grouped into topics yet, but you can still practise the whole subject."
                />
              </div>
            ) : (
              <ul className="card divide-y divide-line">
                {topics.map((topic) => {
                  const count = topic.questionCount || 0;

                  return (
                    <li key={topic._id}>
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink">
                            {topic.title}
                          </p>

                          {topic.description && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                              {topic.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-3">
                            <ProgressBar
                              value={
                                topTopicCount
                                  ? (count /
                                      topTopicCount) *
                                    100
                                  : 0
                              }
                              className="max-w-40"
                              label={`${count} questions`}
                            />

                            <span className="text-xs font-semibold whitespace-nowrap text-subtle">
                              {count}{" "}
                              {pluralize(count, "question")}
                            </span>
                          </div>
                        </div>

                        {count > 0 && (
                          <PracticeLink
                            slug={subject.slug}
                            topic={topic.slug}
                            isAuthenticated={isAuthenticated}
                            className="btn btn-outline btn-sm shrink-0 max-sm:w-full"
                          >
                            Practise
                            <ArrowRightIcon className="size-3.5" />
                          </PracticeLink>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ---------- Sidebar ---------- */}
          <div className="space-y-6">
            {years.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-ink">
                  Past papers
                </h2>

                <div className="card card-pad">
                  <div className="flex flex-wrap gap-2">
                    {years.map((entry) => (
                      <PracticeLink
                        key={entry.year}
                        slug={subject.slug}
                        year={entry.year}
                        isAuthenticated={isAuthenticated}
                        className="group flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-muted transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {entry.year}

                        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] font-bold text-subtle group-hover:bg-white/70">
                          {entry.count}
                        </span>
                      </PracticeLink>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {examTypes.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-ink">
                  Exam bodies
                </h2>

                <ul className="card divide-y divide-line">
                  {examTypes.map((entry) => (
                    <li
                      key={entry.examType}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="text-sm font-semibold text-ink">
                        {EXAM_TYPE_LABELS[entry.examType] ||
                          entry.examType}
                      </span>

                      <span className="text-sm text-muted">
                        {compactNumber(entry.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {difficulties.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-ink">
                  Difficulty mix
                </h2>

                <div className="card card-pad flex flex-wrap gap-2">
                  {difficulties.map((entry) => (
                    <Badge
                      key={entry.difficulty || "unset"}
                      tone={
                        DIFFICULTY_TONE[
                          entry.difficulty
                        ] || "neutral"
                      }
                      className="capitalize"
                    >
                      {entry.difficulty || "unrated"} ·{" "}
                      {entry.count}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <div className="card card-pad bg-brand-50">
              <h2 className="text-base font-bold text-brand-800">
                Ready to practise?
              </h2>

              <p className="mt-1.5 text-sm text-brand-700/80">
                Build a timed set from any year or topic in{" "}
                {subject.name}.
              </p>

              <PracticeLink
                slug={subject.slug}
                isAuthenticated={isAuthenticated}
                className="btn btn-primary mt-4 w-full"
              >
                <PencilIcon className="size-4" />
                Start practising
              </PracticeLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectDetail;
