import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useSettings } from "../context/SettingsContext";
import { useApiData, useDocumentTitle } from "../hooks/useApi";
import { endpoints } from "../lib/api";
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
  SearchInput,
  Select,
  SkeletonBlock,
} from "../components/ui";
import {
  ArrowRightIcon,
  BookIcon,
  GridIcon,
} from "../components/ui/Icons";

// ==========================================================
// SUBJECT CATALOGUE
// ==========================================================
// Rendered inside AdaptiveLayout, so this same URL serves a
// signed-out visitor and a signed-in student. Filtering happens
// client-side: the catalogue is one small request and a subject
// list is short enough that a round trip per keystroke would be
// worse than filtering in place.
// ==========================================================

const SubjectCard = ({ subject }) => (
  <Link
    to={`/subjects/${subject.slug}`}
    className="card group flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop"
  >
    <div className="flex items-start justify-between gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600">
        <BookIcon className="size-5" />
      </span>

      <ArrowRightIcon className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </div>

    <h2 className="mt-4 text-base font-bold text-ink">
      {subject.name}
    </h2>

    {subject.description && (
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">
        {subject.description}
      </p>
    )}

    <div className="mt-auto pt-4">
      {subject.examTypes?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {subject.examTypes.slice(0, 3).map((type) => (
            <Badge key={type} tone="neutral">
              {EXAM_TYPE_LABELS[type] || type}
            </Badge>
          ))}

          {subject.examTypes.length > 3 && (
            <Badge tone="neutral">
              +{subject.examTypes.length - 3}
            </Badge>
          )}
        </div>
      )}

      <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <div>
          <dd className="text-sm font-bold text-ink">
            {compactNumber(subject.questionCount || 0)}
          </dd>
          <dt className="text-[0.6875rem] text-subtle">
            {pluralize(
              subject.questionCount || 0,
              "question"
            )}
          </dt>
        </div>

        <div className="border-x border-line">
          <dd className="text-sm font-bold text-ink">
            {subject.topicCount || 0}
          </dd>
          <dt className="text-[0.6875rem] text-subtle">
            {pluralize(subject.topicCount || 0, "topic")}
          </dt>
        </div>

        <div>
          <dd className="text-sm font-bold text-ink">
            {subject.years?.length || 0}
          </dd>
          <dt className="text-[0.6875rem] text-subtle">
            {pluralize(
              subject.years?.length || 0,
              "year"
            )}
          </dt>
        </div>
      </dl>
    </div>
  </Link>
);

const Subjects = () => {
  const { siteName } = useSettings();

  useDocumentTitle("Subjects", siteName);

  const { data, loading, error, refetch } = useApiData(
    endpoints.catalog.subjects,
    { auth: false }
  );

  const [query, setQuery] = useState("");
  const [examType, setExamType] = useState("");

  const subjects = data?.subjects || [];

  // Only offer exam types that actually appear in the data —
  // an empty filter result is a dead end for the visitor.
  const examTypeOptions = useMemo(() => {
    const seen = new Set();

    subjects.forEach((subject) => {
      (subject.examTypes || []).forEach((type) =>
        seen.add(type)
      );
    });

    return [...seen].sort().map((type) => ({
      value: type,
      label: EXAM_TYPE_LABELS[type] || type,
    }));
  }, [subjects]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return subjects.filter((subject) => {
      if (
        examType &&
        !(subject.examTypes || []).includes(examType)
      ) {
        return false;
      }

      if (!needle) return true;

      return (
        subject.name?.toLowerCase().includes(needle) ||
        subject.description
          ?.toLowerCase()
          .includes(needle)
      );
    });
  }, [subjects, query, examType]);

  return (
    <div className="shell py-6 lg:py-8">
      <PageHeader
        title="Subject catalogue"
        description="Every subject in the question bank, with the topics and past-paper years available for each."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          placeholder="Search subjects…"
          className="flex-1"
        />

        {examTypeOptions.length > 1 && (
          <Select
            value={examType}
            onChange={setExamType}
            options={examTypeOptions}
            placeholder="All exam bodies"
            className="sm:w-52"
            aria-label="Filter by exam body"
          />
        )}
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="card card-pad space-y-3"
            >
              <SkeletonBlock className="size-10 rounded-md" />
              <SkeletonBlock className="h-4 w-3/5" />
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState error={error} onRetry={refetch} />
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card">
          <EmptyState
            icon={GridIcon}
            title={
              subjects.length
                ? "No subjects match that"
                : "No subjects yet"
            }
            description={
              subjects.length
                ? "Try a different search term or clear the exam-body filter."
                : "The question bank is still being set up. Check back shortly."
            }
            action={
              subjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setExamType("");
                  }}
                  className="btn btn-outline"
                >
                  Clear filters
                </button>
              )
            }
          />
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="mb-4 text-sm text-muted">
            Showing {filtered.length} of {subjects.length}{" "}
            {pluralize(subjects.length, "subject")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((subject) => (
              <SubjectCard
                key={subject._id}
                subject={subject}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Subjects;
