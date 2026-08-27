import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, endpoints } from "../lib/api";

const CBT = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { success, error: toastError } = useToast();

  const [attempt, setAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Used to prevent duplicate start requests in React StrictMode.
  const startedRef = useRef(false);

  // Used to prevent the timer from submitting more than once.
  const autoSubmittedRef = useRef(false);

  // ----------------------------------------------------------
  // START / RESUME EXAM
  // ----------------------------------------------------------

  const startExam = useCallback(async () => {
    if (!id) {
      setError("Exam ID is missing.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await api.post(endpoints.exams.start(id));

      if (!data?.attempt) {
        throw new Error("No exam attempt was returned.");
      }

      setAttempt(data.attempt);

      // Restore answers from the server.
      const restoredAnswers = {};

      if (Array.isArray(data.attempt.answers)) {
        data.attempt.answers.forEach((answer) => {
          if (!answer?.question) return;

          const questionId =
            typeof answer.question === "object"
              ? answer.question._id
              : answer.question;

          if (questionId && answer.selectedAnswer) {
            restoredAnswers[questionId] = answer.selectedAnswer;
          }
        });
      }

      setSelectedAnswers(restoredAnswers);

      // Server sends the authoritative endTime.
      let endTime = null;

      if (data.attempt.endTime) {
        endTime = new Date(data.attempt.endTime).getTime();
      } else if (
        data.attempt.startedAt &&
        data.attempt.exam?.duration
      ) {
        endTime =
          new Date(data.attempt.startedAt).getTime() +
          data.attempt.exam.duration * 60 * 1000;
      }

      if (endTime) {
        const remaining = Math.max(
          0,
          Math.ceil((endTime - Date.now()) / 1000)
        );

        setTimeLeft(remaining);
      } else {
        setTimeLeft(0);
      }
    } catch (requestError) {
      console.error("Start exam error:", requestError);
      setError(
        requestError?.message || "Failed to start the examination."
      );
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (startedRef.current) return;

    if (!id || !token) {
      if (!token) {
        setLoading(false);
      }
      return;
    }

    startedRef.current = true;
    startExam();
  }, [id, token, startExam]);

  // ----------------------------------------------------------
  // CURRENT QUESTION / COUNTS
  // ----------------------------------------------------------

  const questions = attempt?.questions || [];
  const totalQuestions = questions.length;
  const question = questions[currentQuestion] || null;

  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers]
  );

  const unansweredCount = Math.max(
    0,
    totalQuestions - answeredCount
  );

  const progress =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  // ----------------------------------------------------------
  // TIMER
  // ----------------------------------------------------------

  const submitExam = useCallback(
    async (automatic = false) => {
      if (!attempt?._id || submitting) return;

      if (!automatic) {
        const confirmed = window.confirm(
          `You have answered ${answeredCount} out of ${totalQuestions} questions.\n\nAre you sure you want to submit your exam?`
        );

        if (!confirmed) return;
      }

      if (!token) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      try {
        setSubmitting(true);
        setError("");

        const data = await api.post(
          endpoints.attempts.submit(attempt._id)
        );

        if (!data?.result) {
          throw new Error(
            "The exam was submitted, but no result was returned."
          );
        }

        success(
          automatic
            ? "Time is up. Your exam has been submitted."
            : "Exam submitted successfully."
        );

        navigate(`/exam-result/${attempt._id}`, {
          replace: true,
        });
      } catch (requestError) {
        console.error("Submit exam error:", requestError);

        setError(
          requestError?.message || "Failed to submit exam."
        );

        toastError(
          requestError?.message || "Failed to submit exam."
        );

        setSubmitting(false);
      }
    },
    [
      attempt?._id,
      submitting,
      answeredCount,
      totalQuestions,
      token,
      navigate,
      success,
      toastError,
    ]
  );

  useEffect(() => {
    if (!attempt || submitting) return;

    if (timeLeft <= 0) {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        submitExam(true);
      }
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attempt, submitting, timeLeft, submitExam]);

  // ----------------------------------------------------------
  // FORMAT TIMER
  // ----------------------------------------------------------

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);

    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  };

  // ----------------------------------------------------------
  // SAVE ANSWER
  // ----------------------------------------------------------

  const handleAnswerSelect = async (questionId, answer) => {
    if (!attempt?._id || submitting || savingAnswer) return;

    if (!questionId) {
      setError("Question ID is missing.");
      return;
    }

    if (!["A", "B", "C", "D"].includes(answer)) {
      setError("Invalid answer selected.");
      return;
    }

    // Optimistic UI update.
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));

    try {
      setSavingAnswer(true);
      setError("");

      await api.post(
        endpoints.attempts.answer(attempt._id),
        {
          questionId,
          selectedAnswer: answer,
        }
      );
    } catch (requestError) {
      console.error("Save answer error:", requestError);

      setError(
        requestError?.message || "Failed to save answer."
      );

      toastError(
        requestError?.message ||
          "Your answer could not be saved. Please try again."
      );
    } finally {
      setSavingAnswer(false);
    }
  };

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  const goToQuestion = (index) => {
    if (
      index < 0 ||
      index >= totalQuestions ||
      submitting
    ) {
      return;
    }

    setCurrentQuestion(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handlePrevious = () => {
    goToQuestion(currentQuestion - 1);
  };

  const handleNext = () => {
    goToQuestion(currentQuestion + 1);
  };

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="shell flex min-h-[70vh] items-center justify-center">
          <div className="card card-pad w-full max-w-md text-center">
            <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <h1 className="text-xl font-bold text-ink">
              Loading examination...
            </h1>
            <p className="mt-2 text-sm text-muted">
              Preparing your CBT attempt.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR BEFORE EXAM LOAD
  // ----------------------------------------------------------

  if (error && !attempt) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="shell flex min-h-[70vh] items-center justify-center">
          <div className="card card-pad w-full max-w-lg text-center">
            <h1 className="text-2xl font-bold text-ink">
              Unable to load examination
            </h1>

            <p className="mt-3 text-danger">{error}</p>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn btn-primary mt-6"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // NO QUESTIONS
  // ----------------------------------------------------------

  if (!attempt || totalQuestions === 0 || !question) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="shell flex min-h-[70vh] items-center justify-center">
          <div className="card card-pad w-full max-w-lg text-center">
            <h1 className="text-2xl font-bold text-ink">
              No Questions Available
            </h1>

            <p className="mt-3 text-muted">
              This examination does not contain any questions.
            </p>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn btn-primary mt-6"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questionId = question._id;
  const currentSelectedAnswer = selectedAnswers[questionId];

  const timerDanger = timeLeft <= 300;
  const timerCritical = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-surface py-4 sm:py-6">
      <div className="shell">
        {/* HEADER */}
        <header className="card mb-4 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
              Xcel Academy CBT
            </p>

            <h1 className="mt-1 truncate text-lg font-bold text-ink sm:text-xl">
              {attempt.exam?.title || "Examination"}
            </h1>

            <p className="mt-1 text-sm text-muted">
              Question {currentQuestion + 1} of {totalQuestions}
            </p>
          </div>

          <div
            className={`rounded-md border px-5 py-3 text-center font-mono text-lg font-bold sm:min-w-40 ${
              timerCritical
                ? "border-danger/30 bg-danger-soft text-danger"
                : timerDanger
                  ? "border-warning/30 bg-warning-soft text-warning"
                  : "border-line bg-surface-2 text-ink"
            }`}
            aria-label="Time remaining"
          >
            {timerCritical ? "⚠ " : "⏱ "}
            {formatTime(timeLeft)}
          </div>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mb-4 rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* QUESTION */}
          <main className="card card-pad">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="badge badge-brand">
                Question {currentQuestion + 1} of {totalQuestions}
              </span>

              <span
                className={`text-sm ${
                  savingAnswer ? "text-warning" : "text-muted"
                }`}
              >
                {savingAnswer ? "Saving answer..." : "Answer saved automatically"}
              </span>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-bold leading-relaxed text-ink sm:text-2xl">
                {question.questionText}
              </h2>
            </div>

            {/* OPTIONS */}
            <div className="mt-7 space-y-3">
              {Object.entries(question.options || {}).map(
                ([letter, text]) => {
                  const isSelected =
                    currentSelectedAnswer === letter;

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={submitting || savingAnswer}
                      onClick={() =>
                        handleAnswerSelect(questionId, letter)
                      }
                      className={`flex w-full items-start gap-3 rounded-md border p-4 text-left transition ${
                        isSelected
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                          : "border-line bg-surface hover:border-brand-300 hover:bg-brand-50/40"
                      } ${
                        submitting || savingAnswer
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                          isSelected
                            ? "bg-brand-600 text-white"
                            : "bg-surface-2 text-ink"
                        }`}
                      >
                        {letter}
                      </span>

                      <span className="pt-1 leading-relaxed text-ink">
                        {text}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* NAVIGATION */}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestion === 0 || submitting}
                className="btn btn-outline"
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={
                  currentQuestion === totalQuestions - 1 ||
                  submitting
                }
                className="btn btn-primary"
              >
                Next →
              </button>
            </div>

            <button
              type="button"
              onClick={() => submitExam(false)}
              disabled={submitting || savingAnswer}
              className="btn btn-primary mt-4 w-full"
            >
              {submitting
                ? "Submitting Exam..."
                : savingAnswer
                  ? "Saving answer..."
                  : "Submit Exam"}
            </button>
          </main>

          {/* QUESTION NAVIGATOR */}
          <aside className="card h-fit p-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink">Questions</h2>

              <span className="text-sm font-semibold text-muted">
                {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* PROGRESS */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* NUMBERS */}
            <div className="mt-5 grid grid-cols-4 gap-2">
              {questions.map((item, index) => {
                const answered = Boolean(
                  selectedAnswers[item._id]
                );
                const isCurrent = currentQuestion === index;

                return (
                  <button
                    key={item._id}
                    type="button"
                    disabled={submitting}
                    onClick={() => goToQuestion(index)}
                    className={`grid aspect-square place-items-center rounded-md border text-sm font-semibold transition ${
                      isCurrent
                        ? "border-brand-600 bg-brand-600 text-white"
                        : answered
                          ? "border-success/30 bg-success-soft text-success"
                          : "border-line bg-surface text-muted hover:border-brand-300"
                    }`}
                    aria-label={`Go to question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* LEGEND */}
            <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <p className="flex justify-between">
                <span className="text-muted">Answered</span>
                <strong className="text-success">
                  {answeredCount}
                </strong>
              </p>

              <p className="flex justify-between">
                <span className="text-muted">Unanswered</span>
                <strong className="text-muted">
                  {unansweredCount}
                </strong>
              </p>

              <p className="flex justify-between">
                <span className="text-muted">Current</span>
                <strong className="text-brand-600">
                  {currentQuestion + 1}
                </strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => submitExam(false)}
              disabled={submitting || savingAnswer}
              className="btn btn-primary mt-5 w-full"
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CBT;
