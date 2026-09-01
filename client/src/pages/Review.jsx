import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useApiData,
  useAsyncAction,
} from "../hooks/useApi";

import { api, endpoints } from "../lib/api";

import {
  Badge,
  EmptyState,
  ErrorState,
  SkeletonCard,
} from "../components/ui";

import {
  ArrowRightIcon,
  BookIcon,
  LayersIcon,
} from "../components/ui/Icons";

// ==========================================================
// HELPERS
// ==========================================================

const getStatusLabel = (status) => {
  if (status === "almost-mastered") {
    return "Almost mastered";
  }

  if (status === "mastered") {
    return "Mastered";
  }

  return "Needs review";
};

const getStatusTone = (status) => {
  if (status === "almost-mastered") {
    return "warning";
  }

  if (status === "mastered") {
    return "success";
  }

  return "neutral";
};

const formatNextReview = (date) => {
  if (!date) return "";

  const target = new Date(date);

  if (Number.isNaN(target.getTime())) {
    return "";
  }

  const diff = target.getTime() - Date.now();

  if (diff <= 0) {
    return "Ready now";
  }

  const days = Math.ceil(
    diff / (24 * 60 * 60 * 1000)
  );

  if (days === 1) {
    return "Review tomorrow";
  }

  return `Review in ${days} days`;
};

// ==========================================================
// MAIN PAGE
// ==========================================================

const Review = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] =
    useState("");
  const [answerResult, setAnswerResult] =
    useState(null);

  const {
    data: reviewData,
    loading: reviewLoading,
    error: reviewError,
    refetch,
  } = useApiData(endpoints.reviews.list, {
    auth: true,
    params: {
      limit: 50,
    },
  });

  const {
    data: stats,
    loading: statsLoading,
  } = useApiData(endpoints.reviews.stats, {
    auth: true,
  });

  const {
    run: runAnswer,
    pending: answering,
    error: answerError,
  } = useAsyncAction();

  const items = reviewData?.items || [];

  const activeQueue = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status !== "mastered" &&
          item.question
      ),
    [items]
  );

  // Start with the highest priority question.
  useEffect(() => {
    if (
      !activeItem &&
      activeQueue.length > 0
    ) {
      setActiveItem(activeQueue[0]);
    }
  }, [activeItem, activeQueue]);

  const startReview = () => {
    if (!activeQueue.length) return;

    setActiveItem(activeQueue[0]);
    setSelectedAnswer("");
    setAnswerResult(null);
  };

  const closeReview = () => {
    setActiveItem(null);
    setSelectedAnswer("");
    setAnswerResult(null);
  };

  const submitAnswer = async () => {
    if (!activeItem || !selectedAnswer) {
      return;
    }

    const result = await runAnswer(() =>
      api.post(
        endpoints.reviews.answer(
          activeItem._id
        ),
        {
          selectedAnswer,
        }
      )
    );

    if (!result.ok) {
      return;
    }

    setAnswerResult(result.result);
  };

  const nextQuestion = () => {
    const currentIndex =
      activeQueue.findIndex(
        (item) =>
          item._id === activeItem?._id
      );

    const nextItem =
      activeQueue[
        currentIndex + 1
      ] || null;

    setSelectedAnswer("");
    setAnswerResult(null);

    if (nextItem) {
      setActiveItem(nextItem);
    } else {
      closeReview();
      refetch();
    }
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (reviewLoading || statsLoading) {
    return (
      <div className="shell py-6 lg:py-8">
        <div className="mb-6">
          <div className="h-8 w-64 animate-pulse rounded bg-surface" />

          <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-surface" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="mt-6">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // ========================================================
  // ERROR
  // ========================================================

  if (reviewError) {
    return (
      <div className="shell py-6 lg:py-8">
        <ErrorState
          error={reviewError}
          onRetry={refetch}
        />
      </div>
    );
  }

  // ========================================================
  // REVIEW SESSION
  // ========================================================

  if (activeItem) {
    const question = activeItem.question;

    return (
      <div className="shell py-6 lg:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-600">
                Smart Review
              </p>

              <h1 className="mt-1 text-2xl font-bold text-ink">
                Review this question
              </h1>
            </div>

            <button
  type="button"
  onClick={() => navigate("/dashboard")}
  className="btn btn-outline"
  disabled={answering}
>
  Exit
</button>
          </div>

          {/* Question info */}

          <div className="mb-4 flex flex-wrap gap-2">
            {question.subject?.name && (
              <Badge tone="neutral">
                {question.subject.name}
              </Badge>
            )}

            {question.topic?.title && (
              <Badge tone="neutral">
                {question.topic.title}
              </Badge>
            )}

            {question.difficulty && (
              <Badge tone="neutral">
                {question.difficulty}
              </Badge>
            )}
          </div>

          {/* Question */}

          <div className="card card-pad">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                {getStatusLabel(
                  activeItem.status
                )}
              </p>

              <span className="text-xs text-subtle">
                Wrong {activeItem.wrongCount} time
                {activeItem.wrongCount === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <h2 className="mt-5 text-lg font-semibold leading-7 text-ink">
              {question.questionText}
            </h2>

            {/* Options */}

            <div className="mt-6 space-y-3">
              {Object.entries(
                question.options || {}
              ).map(
                ([key, value]) => {
                  const isSelected =
                    selectedAnswer ===
                    key;

                  const isCorrect =
                    answerResult?.correctAnswer ===
                    key;

                  const isWrongSelected =
                    answerResult &&
                    isSelected &&
                    !answerResult.isCorrect;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={
                        answering ||
                        Boolean(
                          answerResult
                        )
                      }
                      onClick={() =>
                        setSelectedAnswer(
                          key
                        )
                      }
                      className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition ${
                        isCorrect
                          ? "border-green-500 bg-green-50"
                          : isWrongSelected
                            ? "border-red-400 bg-red-50"
                            : isSelected
                              ? "border-brand-500 bg-brand-50"
                              : "border-line hover:bg-surface"
                      }`}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold">
                        {key}
                      </span>

                      <span className="pt-1 text-sm text-ink">
                        {value}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Result */}

            {answerResult && (
              <div
                className={`mt-6 rounded-lg border p-4 ${
                  answerResult.isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {answerResult.isCorrect
                      ? "✅"
                      : "❌"}
                  </span>

                  <p
                    className={`font-bold ${
                      answerResult.isCorrect
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {answerResult.isCorrect
                      ? "Correct!"
                      : "Not quite"}
                  </p>
                </div>

                {!answerResult.isCorrect && (
                  <p className="mt-2 text-sm text-red-700">
                    Correct answer:{" "}
                    <strong>
                      {
                        answerResult.correctAnswer
                      }
                    </strong>
                  </p>
                )}

                {answerResult.explanation && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                      Explanation
                    </p>

                    <p className="mt-1 text-sm leading-6 text-ink">
                      {
                        answerResult.explanation
                      }
                    </p>
                  </div>
                )}

                {answerResult.review && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Badge
                      tone={
                        getStatusTone(
                          answerResult
                            .review
                            .status
                        )
                      }
                    >
                      {getStatusLabel(
                        answerResult
                          .review
                          .status
                      )}
                    </Badge>

                    <span className="rounded-full bg-white px-3 py-1 text-muted">
                      Priority{" "}
                      {
                        answerResult.review
                          .priority
                      }/10
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-muted">
                      {
                        answerResult
                          .review
                          .consecutiveCorrect
                      } correct in a row
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action */}

            <div className="mt-6 flex justify-end">
              {!answerResult ? (
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={
                    !selectedAnswer ||
                    answering
                  }
                  className="btn btn-primary"
                >
                  {answering
                    ? "Checking..."
                    : "Check answer"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    nextQuestion
                  }
                  className="btn btn-primary"
                >
                  Next question
                  <ArrowRightIcon className="size-4" />
                </button>
              )}
            </div>

            {answerError && (
              <p className="mt-3 text-sm text-red-600">
                {answerError.message ||
                  "Failed to check answer."}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // EMPTY
  // ========================================================

  if (activeQueue.length === 0) {
    return (
      <div className="shell py-6 lg:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <p className="text-sm font-semibold text-brand-600">
              Smart Review
            </p>

            <h1 className="mt-1 text-2xl font-bold text-ink">
              My Review Queue
            </h1>

            <p className="mt-2 text-muted">
              Questions you struggle with will
              automatically appear here.
            </p>
          </div>

          <div className="card">
            <EmptyState
              icon={BookIcon}
              title="You're all caught up!"
              description="You don't have any questions waiting for review right now. Keep practising and we'll add questions here when you need another look."
              action={
                <Link
                  to="/exams"
                  className="btn btn-primary"
                >
                  Practise questions
                </Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // DASHBOARD
  // ========================================================

  return (
    <div className="shell py-6 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-600">
            Smart Review
          </p>

          <h1 className="mt-1 text-2xl font-bold text-ink">
            My Review Queue
          </h1>

          <p className="mt-2 max-w-2xl text-muted">
            Xcel keeps track of questions you
            struggle with and brings them back
            until you've mastered them.
          </p>
        </div>

        <button
          type="button"
          onClick={startReview}
          className="btn btn-primary"
        >
          Start Review
        </button>
      </div>

      {/* ====================================================
          STATS
      ==================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-subtle">
            Needs review
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            {stats?.review || 0}
          </p>

          <p className="mt-1 text-xs text-muted">
            Questions to revisit
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-subtle">
            Almost mastered
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            {stats?.almostMastered || 0}
          </p>

          <p className="mt-1 text-xs text-muted">
            You're getting close
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-subtle">
            Mastered
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            {stats?.mastered || 0}
          </p>

          <p className="mt-1 text-xs text-muted">
            Questions you've cleared
          </p>
        </div>
      </div>

      {/* ====================================================
          QUEUE
      ==================================================== */}

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-ink">
              Questions to review
            </h2>

            <p className="mt-1 text-sm text-muted">
              Highest-priority questions appear
              first.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {activeQueue.map(
            (item, index) => {
              const question =
                item.question;

              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => {
                    setActiveItem(item);
                    setSelectedAnswer("");
                    setAnswerResult(null);
                  }}
                  className="card flex w-full items-start gap-4 p-4 text-left transition hover:shadow-md"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={getStatusTone(
                          item.status
                        )}
                      >
                        {getStatusLabel(
                          item.status
                        )}
                      </Badge>

                      <span className="text-xs text-subtle">
                        Priority{" "}
                        {item.priority}/10
                      </span>
                    </div>

                    <h3 className="mt-2 line-clamp-2 font-semibold text-ink">
                      {
                        question.questionText
                      }
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
                      {question
                        .subject
                        ?.name && (
                        <span className="font-semibold text-muted">
                          {
                            question
                              .subject
                              .name
                          }
                        </span>
                      )}

                      {question.topic
                        ?.title && (
                        <>
                          <span>
                            ·
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <LayersIcon className="size-3.5" />

                            {
                              question
                                .topic
                                .title
                            }
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-subtle">
                      Wrong{" "}
                      {item.wrongCount} time
                      {item.wrongCount ===
                      1
                        ? ""
                        : "s"}
                      {item.nextReviewAt &&
                        ` · ${formatNextReview(
                          item.nextReviewAt
                        )}`}
                    </div>
                  </div>

                  <ArrowRightIcon className="mt-1 size-4 shrink-0 text-subtle" />
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default Review;