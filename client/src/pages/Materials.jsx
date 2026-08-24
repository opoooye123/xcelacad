import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useSettings } from "../context/SettingsContext";
import {
  useApiData,
  useDebounced,
  useDocumentTitle,
} from "../hooks/useApi";
import { endpoints } from "../lib/api";
import {
  examTypeLabel,
  formatRelative,
  pluralize,
  truncate,
} from "../lib/format";
import Pagination from "../components/Pagination";
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Select,
  SkeletonCard,
  cx,
} from "../components/ui";
import {
  ArrowRightIcon,
  BookIcon,
  LayersIcon,
} from "../components/ui/Icons";

// ==========================================================
// STUDY MATERIALS
// ==========================================================
// Notes and revision guides. Public — the list is a genuine
// reason to visit, and nothing here is scored, so there's no
// reason to hide it behind sign-in.
//
// Filtering happens server-side (unlike the subject catalogue),
// because this list is paginated and can grow to hundreds of
// notes; filtering a single page in the browser would silently
// only search whatever page you happened to be on.
// ==========================================================

const PAGE_SIZE = 12;

const EXAM_TYPE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "jamb", label: "JAMB" },
  { value: "post-utme", label: "Post-UTME" },
  { value: "waec", label: "WAEC" },
  { value: "neco", label: "NECO" },
];

// ----------------------------------------------------------

const MaterialCard = ({ material }) => (
  <Link
    to={`/materials/${material._id}`}
    className="card group flex flex-col p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-400"
  >
    <div className="flex items-start justify-between gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600">
        <BookIcon className="size-5" />
      </span>

      {material.examType && (
        <Badge tone="neutral">
          {examTypeLabel(material.examType)}
        </Badge>
      )}
    </div>

    <h2 className="mt-4 font-bold text-ink group-hover:text-brand-700">
      {material.title}
    </h2>

    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
      {material.subject?.name && (
        <span className="font-semibold text-muted">
          {material.subject.name}
        </span>
      )}

      {material.topic?.title && (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <LayersIcon className="size-3.5" />
            {truncate(material.topic.title, 40)}
          </span>
        </>
      )}
    </div>

    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
      <span className="text-xs text-subtle">
        {material.updatedAt
          ? `Updated ${formatRelative(material.updatedAt)}`
          : ""}
      </span>

      <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
        Read
        <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  </Link>
);

// ----------------------------------------------------------

const Materials = () => {
  const { siteName, isFeatureOn } = useSettings();

  useDocumentTitle("Study materials", siteName);

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  // Any filter change invalidates the current page number —
  // landing on "page 4 of 1" shows an empty list for no reason.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, subject, examType]);

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
    endpoints.materials.list,
    {
      auth: false,
      params: {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        subject,
        examType,
      },
    }
  );

  const materials = data?.materials || [];
  const hasFilters = Boolean(
    debouncedSearch || subject || examType
  );

  const clearFilters = () => {
    setSearch("");
    setSubject("");
    setExamType("");
  };

  // The admin can switch this whole section off in the CMS.
  if (!isFeatureOn("studyMaterials")) {
    return (
      <div className="shell py-6 lg:py-8">
        <div className="card">
          <EmptyState
            icon={BookIcon}
            title="Study materials aren't available right now"
            description="This section has been turned off. Practice questions and mock exams are still open."
            action={
              <Link to="/subjects" className="btn btn-primary">
                Browse subjects
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-6 lg:py-8">
      <PageHeader
        title="Study materials"
        description="Short revision notes written to sit alongside the question bank — read the topic, then practise it."
      />

      {/* ---------- Filters ---------- */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder="Search notes…"
          className="sm:col-span-2 lg:col-span-2"
        />

        {subjectOptions.length > 0 && (
          <Select
            value={subject}
            onChange={setSubject}
            options={subjectOptions}
            placeholder="All subjects"
            aria-label="Filter by subject"
          />
        )}

        <Select
          value={examType}
          onChange={setExamType}
          options={EXAM_TYPE_OPTIONS}
          placeholder="All exam bodies"
          aria-label="Filter by exam body"
        />
      </div>

      {/* ---------- Results ---------- */}
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

      {!loading && !error && materials.length === 0 && (
        <div className="card">
          <EmptyState
            icon={BookIcon}
            title={
              hasFilters
                ? "No notes match those filters"
                : "No study materials published yet"
            }
            description={
              hasFilters
                ? "Try a different subject or clear the filters to see everything."
                : "Revision notes are being written. In the meantime the question bank is open."
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
                  to="/subjects"
                  className="btn btn-primary"
                >
                  Browse subjects
                </Link>
              )
            }
          />
        </div>
      )}

      {!loading && !error && materials.length > 0 && (
        <>
          <p
            className={cx(
              "mb-4 text-sm text-subtle",
              !hasFilters && "sr-only"
            )}
            aria-live="polite"
          >
            {data.total} {pluralize(data.total, "note")} found
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <MaterialCard
                key={material._id}
                material={material}
              />
            ))}
          </div>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            limit={data.limit}
            onChange={setPage}
            label="notes"
            className="mt-8"
          />
        </>
      )}
    </div>
  );
};

export default Materials;
