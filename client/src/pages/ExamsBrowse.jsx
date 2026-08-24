import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useSettings } from "../context/SettingsContext";
import {
  useApiData,
  useDebounced,
  useDocumentTitle,
} from "../hooks/useApi";
import { endpoints } from "../lib/api";
import {
  compactNumber,
  examTypeLabel,
  formatMinutes,
  pluralize,
  truncate,
} from "../lib/format";
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Select,
  SkeletonCard,
  Tabs,
} from "../components/ui";
import {
  ArrowRightIcon,
  ClipboardIcon,
  ClockIcon,
  PencilIcon,
  TargetIcon,
} from "../components/ui/Icons";

// ==========================================================
// MOCK EXAMS
// ==========================================================
// Replaces the old ExamList. These are the full papers an admin
// has built and published, as opposed to the randomised sets the
// practice picker generates.
//
// /exams returns the whole published list in one unpaginated
// response, so the exam-type tabs and the search box filter in
// place. Worth revisiting if the catalogue ever runs to hundreds
// of papers, but a round trip per keystroke would be worse today.
// ==========================================================

const TABS = [
  { id: "", label: "All" },
  { id: "jamb", label: "JAMB" },
  { id: "post-utme", label: "Post-UTME" },
  { id: "waec", label: "WAEC" },
  { id: "neco", label: "NECO" },
];

// ----------------------------------------------------------

const ExamCard = ({ exam }) => {
  const subjects = exam.subjects || [];

  return (
    <Link
      to={`/exams/${exam._id}`}
      className="card group flex flex-col p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600">
          <ClipboardIcon className="size-5" />
        </span>

        <Badge tone="brand">
          {examTypeLabel(exam.examType)}
        </Badge>
      </div>

      <h2 className="mt-4 font-bold text-ink group-hover:text-brand-700">
        {exam.title}
      </h2>

      {exam.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">
          {truncate(exam.description, 120)}
        </p>
      )}

      {subjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {subjects.slice(0, 3).map((subject) => (
            <span
              key={subject._id}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted"
            >
              {subject.name}
            </span>
          ))}

          {subjects.length > 3 && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-subtle">
              +{subjects.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-4 text-xs text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <TargetIcon className="size-3.5" />
          {exam.questionCount}{" "}
          {pluralize(exam.questionCount, "question")}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <ClockIcon className="size-3.5" />
          {formatMinutes(exam.duration)}
        </span>

        {exam.totalMarks > 0 && (
          <span>
            {compactNumber(exam.totalMarks)} marks
          </span>
        )}
      </div>

      <span className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm font-semibold text-brand-600">
        View paper
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
};

// ----------------------------------------------------------

const ExamsBrowse = () => {
  const { siteName } = useSettings();

  useDocumentTitle("Mock exams", siteName);

  const [examType, setExamType] = useState("");
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounced(search);

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

  // examType and subject go to the server because it filters on
  // them properly (subject needs a slug lookup); the free-text
  // search is applied here so typing stays instant.
  const { data, loading, error, refetch } = useApiData(
    endpoints.exams.list,
    { params: { examType, subject } }
  );

  const exams = useMemo(() => {
    const list = data?.exams || [];

    if (!debouncedSearch.trim()) return list;

    const needle = debouncedSearch.trim().toLowerCase();

    return list.filter(
      (exam) =>
        exam.title?.toLowerCase().includes(needle) ||
        exam.description?.toLowerCase().includes(needle) ||
        (exam.subjects || []).some((item) =>
          item.name?.toLowerCase().includes(needle)
        )
    );
  }, [data, debouncedSearch]);

  const hasFilters = Boolean(
    examType || subject || debouncedSearch.trim()
  );

  const clearFilters = () => {
    setExamType("");
    setSubject("");
    setSearch("");
  };

  return (
    <div className="shell py-6 lg:py-8">
      <PageHeader
        title="Mock exams"
        description="Full papers built to match the real thing — same length, same timing. Sit one end to end when you want a proper rehearsal."
        action={
          <Link to="/practice" className="btn btn-outline">
            <PencilIcon className="size-4" />
            Quick practice instead
          </Link>
        }
      />

      <Tabs
        tabs={TABS}
        active={examType}
        onChange={setExamType}
        className="mb-4"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder="Search papers…"
          className="flex-1"
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

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState error={error} onRetry={refetch} />
      )}

      {!loading && !error && exams.length === 0 && (
        <div className="card">
          <EmptyState
            icon={ClipboardIcon}
            title={
              hasFilters
                ? "No papers match those filters"
                : "No mock exams published yet"
            }
            description={
              hasFilters
                ? "Try a different exam body or subject, or clear the filters."
                : "Full papers are still being assembled. In the meantime you can build your own set from the question bank."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn btn-outline"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  to="/practice"
                  className="btn btn-primary"
                >
                  <PencilIcon className="size-4" />
                  Start a practice session
                </Link>
              )
            }
          />
        </div>
      )}

      {!loading && !error && exams.length > 0 && (
        <>
          <p
            className="mb-4 text-sm text-subtle"
            aria-live="polite"
          >
            {exams.length} {pluralize(exams.length, "paper")}{" "}
            available
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <ExamCard key={exam._id} exam={exam} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExamsBrowse;
