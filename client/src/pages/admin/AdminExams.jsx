import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  useApiData,
  useDebounced,
  useAsyncAction,
} from "../../hooks/useApi";

import { api, endpoints } from "../../lib/api";

import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Select,
  SkeletonCard,
  cx,
} from "../../components/ui";

import Pagination from "../../components/Pagination";

import {
  BookIcon,
  ArrowRightIcon,
} from "../../components/ui/Icons";

const PAGE_SIZE = 10;

const EXAM_TYPES = [
  { value: "jamb", label: "JAMB" },
  { value: "post-utme", label: "Post-UTME" },
  { value: "practice", label: "Practice" },
];

const PUBLISH_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Published" },
  { value: "false", label: "Draft" },
];

const emptyForm = {
  title: "",
  description: "",
  examType: "jamb",
  subjects: [],
  questions: [],
  duration: 60,
  instructions: "",
  isPublished: false,
};

const AdminExams = () => {
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState("");
  const [isPublished, setIsPublished] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const debouncedSearch = useDebounced(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, examType, isPublished]);

  // ==========================================================
  // EXAMS
  // ==========================================================

  const {
    data,
    loading,
    error,
    refetch,
  } = useApiData(endpoints.admin.exams, {
    params: {
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      examType,
      isPublished,
    },
  });

  // ==========================================================
  // SUBJECTS
  // ==========================================================

  const { data: subjectData } = useApiData(
    endpoints.catalog.subjects,
    {
      auth: false,
    }
  );

  const subjects = subjectData?.subjects || [];

  const subjectOptions = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject._id,
        label: subject.name,
      })),
    [subjects]
  );

  // ==========================================================
  // QUESTIONS
  // ==========================================================

  const {
    data: questionData,
    loading: questionsLoading,
  } = useApiData(endpoints.admin.questions, {
    params: {
      page: 1,
      limit: 100,
    },
  });

  const questions = questionData?.questions || [];

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const { run: runAction, pending: actionPending } =
    useAsyncAction();

  const [actionError, setActionError] = useState(null);

  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingExam(null);

    setForm({
      ...emptyForm,
      subjects: [],
      questions: [],
    });

    setActionError(null);
    setShowForm(true);
  };

  const openEdit = async (exam) => {
    setActionError(null);

    try {
      const response = await api.get(
        endpoints.admin.exam(exam._id)
      );

      const fullExam = response.exam;

      setEditingExam(fullExam);

      setForm({
        title: fullExam.title || "",
        description: fullExam.description || "",
        examType: fullExam.examType || "jamb",
        subjects: (fullExam.subjects || []).map(
          (subject) => subject._id
        ),
        questions: (fullExam.questions || []).map(
          (question) => question._id
        ),
        duration: fullExam.duration || 60,
        instructions: fullExam.instructions || "",
        isPublished: Boolean(fullExam.isPublished),
      });

      setShowForm(true);
    } catch (error) {
      setActionError(error);
    }
  };

  const closeForm = () => {
    if (actionPending) return;

    setShowForm(false);
    setEditingExam(null);
    setActionError(null);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // ==========================================================
  // CREATE / UPDATE
  // ==========================================================

  const submitForm = async (event) => {
    event.preventDefault();

    setActionError(null);

    if (!form.title.trim()) {
      setActionError({
        message: "Exam title is required",
      });
      return;
    }

    if (!form.questions.length) {
      setActionError({
        message: "Select at least one question",
      });
      return;
    }

    if (!form.duration || Number(form.duration) < 1) {
      setActionError({
        message: "Duration must be at least 1 minute",
      });
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      examType: form.examType,
      subjects: form.subjects,
      questions: form.questions,
      duration: Number(form.duration),
      instructions: form.instructions.trim(),
      isPublished: form.isPublished,
    };

    const result = await runAction(async () => {
      if (editingExam) {
        return api.put(
          endpoints.admin.exam(editingExam._id),
          payload
        );
      }

      return api.post(
        endpoints.admin.exams,
        payload
      );
    });

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    closeForm();
    refetch();
  };

  // ==========================================================
  // PUBLISH / UNPUBLISH
  // ==========================================================

  const togglePublish = async (exam) => {
    setActionError(null);

    const result = await runAction(() =>
      api.patch(
        endpoints.admin.examPublish(exam._id),
        {
          isPublished: !exam.isPublished,
        }
      )
    );

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    refetch();
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const deleteExam = async (exam) => {
    const confirmed = window.confirm(
      `Delete "${exam.title}"?\n\nThis cannot be undone. Exams with attempts cannot be deleted.`
    );

    if (!confirmed) return;

    setActionError(null);

    const result = await runAction(() =>
      api.delete(
        endpoints.admin.exam(exam._id)
      )
    );

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    refetch();
  };

  const exams = data?.exams || [];

  return (
    <div className="shell py-6 lg:py-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <PageHeader
        title="Exam Management"
        description="Create and manage JAMB, Post-UTME and practice exams."
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin"
          className="btn btn-outline"
        >
          Back to Dashboard
        </Link>

        <button
          type="button"
          onClick={openCreate}
          className="btn btn-primary"
        >
          + Create exam
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {actionError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError.message ||
            "Something went wrong."}

          <button
            type="button"
            onClick={() => setActionError(null)}
            className="ml-3 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder="Search exams..."
        />

        <Select
          value={examType}
          onChange={setExamType}
          options={EXAM_TYPES}
          placeholder="All exam types"
          aria-label="Filter by exam type"
        />

        <Select
          value={isPublished}
          onChange={setIsPublished}
          options={PUBLISH_OPTIONS}
          placeholder="All statuses"
          aria-label="Filter by publication status"
        />
      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <SkeletonCard key={index} />
            )
          )}
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!loading && error && (
        <div className="mt-6">
          <ErrorState
            error={error}
            onRetry={refetch}
          />
        </div>
      )}

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {!loading &&
        !error &&
        exams.length === 0 && (
          <div className="card mt-6">
            <EmptyState
              icon={BookIcon}
              title="No exams found"
              description={
                search ||
                examType ||
                isPublished
                  ? "Try changing your filters."
                  : "Create your first exam to get started."
              }
              action={
                search ||
                examType ||
                isPublished ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setSearch("");
                      setExamType("");
                      setIsPublished("");
                    }}
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openCreate}
                  >
                    Create exam
                  </button>
                )
              }
            />
          </div>
        )}

      {/* ======================================================
          EXAM LIST
      ====================================================== */}

      {!loading &&
        !error &&
        exams.length > 0 && (
          <>
            <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-line bg-surface">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-muted">
                        Exam
                      </th>

                      <th className="px-5 py-4 font-semibold text-muted">
                        Type
                      </th>

                      <th className="px-5 py-4 font-semibold text-muted">
                        Questions
                      </th>

                      <th className="px-5 py-4 font-semibold text-muted">
                        Duration
                      </th>

                      <th className="px-5 py-4 font-semibold text-muted">
                        Attempts
                      </th>

                      <th className="px-5 py-4 font-semibold text-muted">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right font-semibold text-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {exams.map((exam) => (
                      <tr
                        key={exam._id}
                        className="hover:bg-surface/60"
                      >
                        {/* Exam */}

                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-ink">
                              {exam.title}
                            </p>

                            {exam.description && (
                              <p className="mt-1 max-w-md truncate text-xs text-subtle">
                                {exam.description}
                              </p>
                            )}

                            {exam.subjects?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {exam.subjects
                                  .slice(0, 3)
                                  .map((subject) => (
                                    <span
                                      key={subject._id}
                                      className="rounded bg-surface px-2 py-1 text-[11px] text-muted"
                                    >
                                      {subject.name}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Type */}

                        <td className="px-5 py-4">
                          <Badge tone="neutral">
                            {exam.examType}
                          </Badge>
                        </td>

                        {/* Questions */}

                        <td className="px-5 py-4">
                          <span className="font-medium text-ink">
                            {exam.questionCount || 0}
                          </span>
                        </td>

                        {/* Duration */}

                        <td className="px-5 py-4 text-muted">
                          {exam.duration} min
                        </td>

                        {/* Attempts */}

                        <td className="px-5 py-4">
                          <span className="font-medium text-ink">
                            {exam.attemptCount || 0}
                          </span>
                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">
                          {exam.isPublished ? (
                            <Badge tone="success">
                              Published
                            </Badge>
                          ) : (
                            <Badge tone="neutral">
                              Draft
                            </Badge>
                          )}

                          {!exam.isActive && (
                            <Badge
                              tone="neutral"
                              className="ml-1"
                            >
                              Inactive
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={actionPending}
                              onClick={() =>
                                openEdit(exam)
                              }
                              className="btn btn-outline btn-sm"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={actionPending}
                              onClick={() =>
                                togglePublish(exam)
                              }
                              className="btn btn-outline btn-sm"
                            >
                              {exam.isPublished
                                ? "Unpublish"
                                : "Publish"}
                            </button>

                            <button
                              type="button"
                              disabled={actionPending}
                              onClick={() =>
                                deleteExam(exam)
                              }
                              className="btn btn-outline btn-sm text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              limit={data.limit}
              onChange={setPage}
              label="exams"
              className="mt-6"
            />
          </>
        )}

      {/* ======================================================
          CREATE / EDIT FORM
      ====================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div className="mx-auto my-8 max-w-4xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-ink">
                  {editingExam
                    ? "Edit exam"
                    : "Create exam"}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Add the exam information and choose
                  the questions students will answer.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="text-2xl text-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={submitForm}
              className="space-y-6 p-6"
            >
              {/* Basic information */}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-semibold text-ink">
                    Exam title
                  </span>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="e.g. JAMB Biology Mock Exam 2026"
                    className="input w-full"
                    required
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-semibold text-ink">
                    Exam type
                  </span>

                  <Select
                    value={form.examType}
                    onChange={(value) =>
                      updateForm("examType", value)
                    }
                    options={EXAM_TYPES}
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-semibold text-ink">
                    Duration (minutes)
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={(event) =>
                      updateForm(
                        "duration",
                        event.target.value
                      )
                    }
                    className="input w-full"
                    required
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-semibold text-ink">
                    Description
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Brief description of this exam..."
                    className="input w-full"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-semibold text-ink">
                    Instructions
                  </span>

                  <textarea
                    value={form.instructions}
                    onChange={(event) =>
                      updateForm(
                        "instructions",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Instructions students should see before starting..."
                    className="input w-full"
                  />
                </label>
              </div>

              {/* Subjects */}

              <div>
                <h3 className="mb-3 font-semibold text-ink">
                  Subjects
                </h3>

                {subjectOptions.length === 0 ? (
                  <p className="text-sm text-muted">
                    No subjects available.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {subjectOptions.map(
                      (subject) => {
                        const checked =
                          form.subjects.includes(
                            subject.value
                          );

                        return (
                          <label
                            key={subject.value}
                            className={cx(
                              "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                              checked
                                ? "border-brand-400 bg-brand-50"
                                : "border-line"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setForm(
                                  (current) => ({
                                    ...current,
                                    subjects:
                                      checked
                                        ? current.subjects.filter(
                                            (id) =>
                                              id !==
                                              subject.value
                                          )
                                        : [
                                            ...current.subjects,
                                            subject.value,
                                          ],
                                  })
                                );
                              }}
                            />

                            <span className="text-sm font-medium">
                              {subject.label}
                            </span>
                          </label>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Questions */}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">
                      Questions
                    </h3>

                    <p className="text-sm text-muted">
                      {form.questions.length} question
                      {form.questions.length === 1
                        ? ""
                        : "s"} selected
                    </p>
                  </div>

                  {questions.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        updateForm(
                          "questions",
                          questions.map(
                            (question) =>
                              question._id
                          )
                        )
                      }
                    >
                      Select all
                    </button>
                  )}
                </div>

                {questionsLoading ? (
                  <div className="rounded-lg border border-line p-5 text-sm text-muted">
                    Loading questions...
                  </div>
                ) : questions.length === 0 ? (
                  <div className="rounded-lg border border-line p-5">
                    <p className="font-medium text-ink">
                      No questions available
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      Create questions first before
                      creating an exam.
                    </p>

                    <Link
                      to="/admin/questions"
                      className="btn btn-outline mt-4"
                    >
                      Manage questions
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto rounded-lg border border-line">
                    {questions.map(
                      (question, index) => {
                        const checked =
                          form.questions.includes(
                            question._id
                          );

                        return (
                          <label
                            key={question._id}
                            className={cx(
                              "flex cursor-pointer gap-3 border-b border-line p-4 last:border-b-0",
                              checked &&
                                "bg-brand-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setForm(
                                  (current) => ({
                                    ...current,
                                    questions:
                                      checked
                                        ? current.questions.filter(
                                            (id) =>
                                              id !==
                                              question._id
                                          )
                                        : [
                                            ...current.questions,
                                            question._id,
                                          ],
                                  })
                                );
                              }}
                              className="mt-1"
                            />

                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-subtle">
                                Question {index + 1}
                              </p>

                              <p className="mt-1 line-clamp-2 text-sm font-medium text-ink">
                                {question.questionText}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                                {question.subject?.name && (
                                  <span>
                                    {
                                      question
                                        .subject
                                        .name
                                    }
                                  </span>
                                )}

                                {question.topic?.title && (
                                  <>
                                    <span>·</span>
                                    <span>
                                      {
                                        question
                                          .topic
                                          .title
                                      }
                                    </span>
                                  </>
                                )}

                                {question.examType && (
                                  <>
                                    <span>·</span>
                                    <span>
                                      {
                                        question.examType
                                      }
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Publish */}

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-4">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) =>
                    updateForm(
                      "isPublished",
                      event.target.checked
                    )
                  }
                  className="mt-1"
                />

                <div>
                  <p className="font-semibold text-ink">
                    Publish immediately
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Published exams will appear to
                    students immediately.
                  </p>
                </div>
              </label>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-line pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={actionPending}
                  className="btn btn-outline"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    actionPending ||
                    questionsLoading
                  }
                  className="btn btn-primary"
                >
                  {actionPending
                    ? "Saving..."
                    : editingExam
                      ? "Save changes"
                      : "Create exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExams;