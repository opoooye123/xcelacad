import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useSettings } from "../context/SettingsContext";
import {
  useApiData,
  useAsyncAction,
  useDocumentTitle,
} from "../hooks/useApi";
import { api, endpoints } from "../lib/api";
import {
  compactNumber,
  difficultyLabel,
  examTypeLabel,
  formatMinutes,
  pluralize,
} from "../lib/format";
import {
  Alert,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
  Select,
  Spinner,
  cx,
} from "../components/ui";
import {
  ClipboardIcon,
  ClockIcon,
  PencilIcon,
  SparkIcon,
  TargetIcon,
} from "../components/ui/Icons";

// ==========================================================
// PRACTICE PICKER
// ==========================================================
// Builds a randomised session from the question bank. Everything
// except the subject is optional — a student who just wants
// twenty questions should be two taps away, not filling a form.
//
// /practice/options returns every subject with its years, exam
// types and topics in one request, so narrowing a filter never
// costs a round trip.
//
// Deep links arrive from SubjectDetail and MaterialDetail as
// ?subject=slug&year=2019&topic=slug, so those are read from the
// URL on mount.
// ==========================================================

const QUESTION_PRESETS = [10, 20, 40, 60];

// ----------------------------------------------------------
// Chip row — used for years, exam types, difficulty and count.
// ----------------------------------------------------------

const ChipRow = ({
  label,
  hint,
  options,
  value,
  onChange,
  allowAny = true,
  anyLabel = "Any",
}) => {
  if (!options.length) return null;

  const items = allowAny
    ? [{ value: "", label: anyLabel }, ...options]
    : options;

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">
        {label}
      </legend>

      {hint && (
        <p className="mt-0.5 text-xs text-subtle">{hint}</p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2">
        {items.map((option) => {
          const isActive =
            String(option.value) === String(value);

          return (
            <button
              key={option.value || "any"}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={cx(
                "min-h-10 cursor-pointer rounded-md border px-3.5 text-sm font-semibold transition-colors",
                isActive
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-line text-muted hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};

// ----------------------------------------------------------

const Practice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { siteName, isFeatureOn } = useSettings();

  useDocumentTitle("Practice", siteName);

  const {
    data: options,
    loading,
    error,
    refetch,
  } = useApiData(endpoints.practice.options);

  const subjects = options?.subjects || [];

  const [subjectSlug, setSubjectSlug] = useState(
    searchParams.get("subject") || ""
  );
  const [topicSlug, setTopicSlug] = useState(
    searchParams.get("topic") || ""
  );
  const [year, setYear] = useState(
    searchParams.get("year") || ""
  );
  const [examType, setExamType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionCount, setQuestionCount] = useState(20);

  const { run, pending, error: startError } = useAsyncAction();

  // Default to the first subject once the options land, unless a
  // deep link already chose one. Without this the primary button
  // sits disabled on a page that looks ready to use.
  useEffect(() => {
    if (subjectSlug || subjects.length === 0) return;

    setSubjectSlug(subjects[0].slug);
  }, [subjects, subjectSlug]);

  useEffect(() => {
    if (options?.defaultQuestions) {
      setQuestionCount(options.defaultQuestions);
    }
  }, [options?.defaultQuestions]);

  const subject = useMemo(
    () =>
      subjects.find((item) => item.slug === subjectSlug) ||
      null,
    [subjects, subjectSlug]
  );

  // A year or topic from the previous subject would silently
  // filter the new one down to nothing.
  const handleSubjectChange = (nextSlug) => {
    setSubjectSlug(nextSlug);
    setTopicSlug("");
    setYear("");
    setExamType("");
  };

  const subjectOptions = subjects.map((item) => ({
    value: item.slug,
    label: `${item.name} · ${compactNumber(
      item.questionCount
    )} ${pluralize(item.questionCount, "question")}`,
  }));

  const topicOptions = (subject?.topics || []).map((item) => ({
    value: item.slug,
    label: item.title,
  }));

  const yearOptions = (subject?.years || []).map((value) => ({
    value: String(value),
    label: String(value),
  }));

  const examTypeOptions = (subject?.examTypes || []).map(
    (value) => ({
      value,
      label: examTypeLabel(value),
    })
  );

  const difficultyOptions = (options?.difficulties || []).map(
    (value) => ({
      value,
      label: difficultyLabel(value),
    })
  );

  const minQuestions = options?.minQuestions || 5;
  const maxQuestions = options?.maxQuestions || 100;

  const countOptions = QUESTION_PRESETS.filter(
    (value) =>
      value >= minQuestions &&
      value <= maxQuestions &&
      // Don't offer 60 to a subject that only holds 30.
      value <= (subject?.questionCount || maxQuestions)
  ).map((value) => ({
    value,
    label: String(value),
  }));

  // Mirrors the server's one-minute-per-question rule so the
  // estimate on the button matches the timer the student gets.
  const estimatedMinutes = Math.max(5, questionCount);

  const start = async () => {
    if (!subjectSlug) return;

    const { ok, result } = await run(() =>
      api.post(endpoints.practice.sessions, {
        subject: subjectSlug,
        topic: topicSlug || undefined,
        year: year || undefined,
        examType: examType || undefined,
        difficulty: difficulty || undefined,
        questionCount,
      })
    );

    if (!ok) return;

    // The session's attempt is already open, and startExam
    // resumes an in-progress attempt, so the CBT screen picks it
    // up from the exam id with no extra state to pass.
    navigate(`/cbt/${result.attempt.exam}`);
  };

  // ---------- Guards ----------

  if (!isFeatureOn("practice")) {
    return (
      <div className="shell py-6 lg:py-8">
        <div className="card">
          <EmptyState
            icon={PencilIcon}
            title="Practice mode is turned off"
            description="Randomised practice sessions aren't available right now. Published mock exams are still open."
            action={
              <Link to="/exams" className="btn btn-primary">
                Browse mock exams
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shell py-6 lg:py-8">
        <PageLoader label="Loading the question bank…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell py-6 lg:py-8">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="shell py-6 lg:py-8">
        <div className="card">
          <EmptyState
            icon={ClipboardIcon}
            title="No questions in the bank yet"
            description="Practice sessions are built from the question bank, and it's still being filled. Check back shortly."
            action={
              <Link
                to="/subjects"
                className="btn btn-outline"
              >
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
        title="Practice"
        description="Pick a subject and we'll build a timed set from the question bank. Everything below the subject is optional."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------- Filters ---------- */}
        <div className="card card-pad space-y-6 lg:col-span-2">
          <div>
            <label
              htmlFor="practice-subject"
              className="text-sm font-semibold text-ink"
            >
              Subject
            </label>

            <Select
              id="practice-subject"
              value={subjectSlug}
              onChange={handleSubjectChange}
              options={subjectOptions}
              className="mt-2"
            />
          </div>

          {topicOptions.length > 0 && (
            <div>
              <label
                htmlFor="practice-topic"
                className="text-sm font-semibold text-ink"
              >
                Topic
              </label>

              <p className="mt-0.5 text-xs text-subtle">
                Leave this on "All topics" for a mixed set.
              </p>

              <Select
                id="practice-topic"
                value={topicSlug}
                onChange={setTopicSlug}
                options={topicOptions}
                placeholder="All topics"
                className="mt-2"
              />
            </div>
          )}

          <ChipRow
            label="Past paper year"
            hint="Sit questions from one particular year."
            options={yearOptions}
            value={year}
            onChange={setYear}
            anyLabel="Any year"
          />

          <ChipRow
            label="Exam body"
            options={examTypeOptions}
            value={examType}
            onChange={setExamType}
            anyLabel="Any"
          />

          <ChipRow
            label="Difficulty"
            options={difficultyOptions}
            value={difficulty}
            onChange={setDifficulty}
            anyLabel="Mixed"
          />

          <ChipRow
            label="How many questions"
            options={countOptions}
            value={questionCount}
            onChange={(value) => setQuestionCount(Number(value))}
            allowAny={false}
          />
        </div>

        {/* ---------- Summary ---------- */}
        <div className="lg:col-span-1">
          <div className="card card-pad lg:sticky lg:top-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <SparkIcon className="size-4 text-brand-500" />
              Your session
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-subtle">Subject</dt>
                <dd className="text-right font-semibold text-ink">
                  {subject?.name || "—"}
                </dd>
              </div>

              {topicSlug && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-subtle">Topic</dt>
                  <dd className="text-right font-semibold text-ink">
                    {topicOptions.find(
                      (item) => item.value === topicSlug
                    )?.label || topicSlug}
                  </dd>
                </div>
              )}

              {year && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-subtle">Year</dt>
                  <dd className="font-semibold text-ink">
                    {year}
                  </dd>
                </div>
              )}

              {examType && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-subtle">Exam body</dt>
                  <dd className="font-semibold text-ink">
                    {examTypeLabel(examType)}
                  </dd>
                </div>
              )}

              {difficulty && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-subtle">Difficulty</dt>
                  <dd className="font-semibold text-ink">
                    {difficultyLabel(difficulty)}
                  </dd>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 border-t border-line pt-3">
                <dt className="flex items-center gap-1.5 text-subtle">
                  <TargetIcon className="size-3.5" />
                  Questions
                </dt>
                <dd className="font-bold text-ink">
                  {questionCount}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-subtle">
                  <ClockIcon className="size-3.5" />
                  Time limit
                </dt>
                <dd className="font-bold text-ink">
                  {formatMinutes(estimatedMinutes)}
                </dd>
              </div>
            </dl>

            {/* The server may hold fewer questions than asked
                for; it silently trims, so say so up front. */}
            {subject &&
              subject.questionCount < questionCount && (
                <Alert tone="info" className="mt-4">
                  This subject has{" "}
                  {subject.questionCount}{" "}
                  {pluralize(
                    subject.questionCount,
                    "question"
                  )}{" "}
                  in total, so your set will be shorter than{" "}
                  {questionCount}.
                </Alert>
              )}

            {startError && (
              <Alert tone="danger" className="mt-4">
                {startError.message}
              </Alert>
            )}

            <button
              type="button"
              onClick={start}
              disabled={pending || !subjectSlug}
              className="btn btn-primary btn-lg mt-5 w-full"
            >
              {pending ? (
                <>
                  <Spinner className="size-4" />
                  Building your set…
                </>
              ) : (
                <>
                  <PencilIcon className="size-4" />
                  Start practising
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-subtle">
              The timer starts as soon as the first question
              loads. Answers save as you go.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
