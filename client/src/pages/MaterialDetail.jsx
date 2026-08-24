import { Link, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useApiData, useDocumentTitle } from "../hooks/useApi";
import { endpoints } from "../lib/api";
import { loginPath } from "../lib/authNext";
import {
  examTypeLabel,
  formatDate,
  formatRelative,
} from "../lib/format";
import NoteContent from "../components/NoteContent";
import {
  Badge,
  EmptyState,
  ErrorState,
  PageLoader,
} from "../components/ui";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookIcon,
  LayersIcon,
  PencilIcon,
} from "../components/ui/Icons";

// ==========================================================
// MATERIAL DETAIL
// ==========================================================
// A single note, with the sibling notes for the same subject in a
// rail beside it and a link straight into practice for the same
// subject — reading and then immediately testing yourself is the
// whole point of pairing notes with a question bank.
// ==========================================================

const MaterialDetail = () => {
  const { id } = useParams();

  const { siteName } = useSettings();
  const { isAuthenticated } = useAuth();

  const { data, loading, error, refetch } = useApiData(
    endpoints.materials.detail(id),
    { auth: false }
  );

  const material = data?.material;
  const related = data?.related || [];

  useDocumentTitle(material?.title || "Study material", siteName);

  if (loading) {
    return (
      <div className="shell py-6 lg:py-8">
        <PageLoader label="Loading note…" />
      </div>
    );
  }

  // 404 also covers an unpublished note, which is deliberate:
  // a draft shouldn't confirm its own existence.
  if (error?.status === 404 || error?.status === 400) {
    return (
      <div className="shell py-6 lg:py-8">
        <div className="card">
          <EmptyState
            icon={BookIcon}
            title="Note not found"
            description="This study material may have been unpublished or removed."
            action={
              <Link
                to="/materials"
                className="btn btn-primary"
              >
                Back to study materials
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="shell py-6 lg:py-8">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const subjectSlug = material.subject?.slug;

  const practiceTarget = subjectSlug
    ? `/practice?subject=${encodeURIComponent(subjectSlug)}`
    : "/practice";

  return (
    <div className="shell py-6 lg:py-8">
      <Link
        to="/materials"
        className="btn btn-ghost btn-sm mb-4 -ml-2 text-muted"
      >
        <ArrowLeftIcon className="size-4" />
        All study materials
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------- Note ---------- */}
        <article className="lg:col-span-2">
          <div className="card card-pad">
            <div className="flex flex-wrap items-center gap-2">
              {material.subject?.name && (
                <Link
                  to={`/subjects/${material.subject.slug}`}
                  className="text-sm font-semibold text-brand-600 hover:underline"
                >
                  {material.subject.name}
                </Link>
              )}

              {material.examType && (
                <Badge tone="neutral">
                  {examTypeLabel(material.examType)}
                </Badge>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              {material.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
              {material.topic?.title && (
                <span className="inline-flex items-center gap-1.5">
                  <LayersIcon className="size-3.5" />
                  {material.topic.title}
                </span>
              )}

              {material.updatedAt && (
                <span>
                  Updated {formatDate(material.updatedAt)}
                </span>
              )}
            </div>

            <hr className="mt-5 border-t border-line" />

            <NoteContent
              content={material.content}
              className="mt-5"
            />
          </div>

          {/* ---------- Practise CTA ---------- */}
          <div className="card card-pad mt-6 bg-brand-50">
            <h2 className="text-base font-bold text-brand-800">
              Now test yourself
            </h2>

            <p className="mt-1.5 text-sm text-brand-700/80">
              Reading is the easy half. Sit a short timed set on
              {material.subject?.name
                ? ` ${material.subject.name}`
                : " this subject"}{" "}
              while it's fresh.
            </p>

            <Link
              to={
                isAuthenticated
                  ? practiceTarget
                  : loginPath(practiceTarget)
              }
              className="btn btn-primary mt-4"
            >
              <PencilIcon className="size-4" />
              Practise this subject
            </Link>
          </div>
        </article>

        {/* ---------- Related ---------- */}
        <aside className="lg:col-span-1">
          <h2 className="mb-3 text-lg font-bold text-ink">
            More in{" "}
            {material.subject?.name || "this subject"}
          </h2>

          {related.length === 0 ? (
            <div className="card card-pad">
              <p className="text-sm text-muted">
                This is the only note published for this
                subject so far.
              </p>

              <Link
                to="/materials"
                className="btn btn-outline btn-sm mt-4 w-full"
              >
                Browse other subjects
              </Link>
            </div>
          ) : (
            <ul className="card divide-y divide-line">
              {related.map((item) => (
                <li key={item._id}>
                  <Link
                    to={`/materials/${item._id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600">
                      <BookIcon className="size-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink group-hover:text-brand-700">
                        {item.title}
                      </p>

                      {item.examType && (
                        <p className="mt-0.5 text-xs text-subtle">
                          {examTypeLabel(item.examType)}
                        </p>
                      )}
                    </div>

                    <ArrowRightIcon className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {material.createdAt && (
            <p className="mt-4 text-xs text-subtle">
              First published{" "}
              {formatRelative(material.createdAt)}.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MaterialDetail;
