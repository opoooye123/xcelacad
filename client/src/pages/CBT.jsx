import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CBT = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [attempt, setAttempt] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [selectedAnswers, setSelectedAnswers] = useState({});

  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);

  const [savingAnswer, setSavingAnswer] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return token || localStorage.getItem("xcelToken");
  };

  // ==========================================
  // START / RESUME EXAM
  // ==========================================

  const startExam = useCallback(async () => {
    const authToken = getToken();

    if (!authToken) {
      setLoading(false);
      setError("You are not authenticated.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/exams/${id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to start exam"
        );
      }

      console.log("=================================");
      console.log("EXAM STARTED / RESUMED");
      console.log("Attempt:", data.attempt);
      console.log("=================================");

      if (!data.attempt) {
        throw new Error("No exam attempt was returned.");
      }

      setAttempt(data.attempt);

      // ==========================================
      // RESTORE SAVED ANSWERS
      // ==========================================

      const restoredAnswers = {};

      if (Array.isArray(data.attempt.answers)) {
        data.attempt.answers.forEach((answer) => {
          if (!answer.question) return;

          // question can be:
          // "64abc..."
          // OR { _id: "64abc..." }

          const questionId =
            typeof answer.question === "object"
              ? answer.question._id
              : answer.question;

          if (questionId) {
            restoredAnswers[questionId] =
              answer.selectedAnswer;
          }
        });
      }

      console.log(
        "Restored answers:",
        restoredAnswers
      );

      setSelectedAnswers(restoredAnswers);

      // ==========================================
      // CALCULATE REMAINING TIME
      // ==========================================

      let endTime;

      if (data.attempt.endTime) {
        endTime = new Date(
          data.attempt.endTime
        ).getTime();
      } else if (
        data.attempt.startedAt &&
        data.attempt.exam?.duration
      ) {
        const startedAt = new Date(
          data.attempt.startedAt
        ).getTime();

        const durationMilliseconds =
          data.attempt.exam.duration *
          60 *
          1000;

        endTime =
          startedAt + durationMilliseconds;
      }

      if (endTime) {
        const remaining = Math.max(
          0,
          Math.floor(
            (endTime - Date.now()) / 1000
          )
        );

        setTimeLeft(remaining);
      } else {
        console.warn(
          "Unable to calculate exam end time."
        );
      }
    } catch (error) {
      console.error(
        "Start exam error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  // ==========================================
  // START EXAM ON PAGE LOAD
  // ==========================================

  useEffect(() => {
    if (!id) {
      setError("Exam ID is missing.");
      setLoading(false);
      return;
    }

    startExam();
  }, [id, startExam]);

  // ==========================================
  // CURRENT QUESTION
  // ==========================================

  const question =
    attempt?.questions?.[currentQuestion];

  // ==========================================
  // COUNT ANSWERED QUESTIONS
  // ==========================================

  const answeredCount =
    Object.keys(selectedAnswers).length;

  const totalQuestions =
    attempt?.questions?.length || 0;

  const unansweredCount =
    totalQuestions - answeredCount;

  // ==========================================
  // COUNTDOWN TIMER
  // ==========================================

  useEffect(() => {
    if (!attempt || submitting) {
      return;
    }

    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          clearInterval(timer);

          // Auto-submit when time expires
          handleSubmitExam(true);

          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [attempt, submitting, timeLeft]);

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(
      0,
      Number(seconds) || 0
    );

    const hours = Math.floor(
      safeSeconds / 3600
    );

    const minutes = Math.floor(
      (safeSeconds % 3600) / 60
    );

    const remainingSeconds =
      safeSeconds % 60;

    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  };

  // ==========================================
  // SELECT / SAVE ANSWER
  // ==========================================

  const handleAnswerSelect = async (
    questionId,
    answer
  ) => {
    const authToken = getToken();

    // ==========================================
    // IMPORTANT VALIDATION
    // ==========================================

    if (!questionId) {
      console.error(
        "❌ Question ID is missing."
      );
      return;
    }

    if (
      !["A", "B", "C", "D"].includes(answer)
    ) {
      console.error(
        "❌ Invalid answer:",
        answer
      );
      return;
    }

    if (!attempt?._id) {
      console.error(
        "❌ No active attempt."
      );
      return;
    }

    if (!authToken) {
      console.error(
        "❌ Authentication token missing."
      );
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    try {
      setSavingAnswer(true);

      setError("");

      // ==========================================
      // UPDATE UI IMMEDIATELY
      // ==========================================

      setSelectedAnswers((previous) => ({
        ...previous,
        [questionId]: answer,
      }));

      // ==========================================
      // DEBUG
      // ==========================================

      console.log(
        "================================="
      );

      console.log("SAVING ANSWER");

      console.log(
        "Attempt ID:",
        attempt._id
      );

      console.log(
        "Question ID:",
        questionId
      );

      console.log(
        "Selected Answer:",
        answer
      );

      console.log(
        "================================="
      );

      // ==========================================
      // SEND ANSWER TO BACKEND
      // ==========================================

      const response = await fetch(
        `http://localhost:5000/api/exams/attempt/${attempt._id}/answer`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            questionId: questionId,
            selectedAnswer: answer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save answer"
        );
      }

      console.log(
        "✅ ANSWER SAVED SUCCESSFULLY",
        data
      );
    } catch (error) {
      console.error(
        "❌ Save answer error:",
        error
      );

      setError(error.message);
    } finally {
      setSavingAnswer(false);
    }
  };

  // ==========================================
  // NEXT QUESTION
  // ==========================================

  const handleNext = () => {
    if (!attempt?.questions?.length) {
      return;
    }

    if (
      currentQuestion <
      attempt.questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) => previous + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // ==========================================
  // PREVIOUS QUESTION
  // ==========================================

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        (previous) => previous - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // ==========================================
  // GO TO QUESTION
  // ==========================================

  const goToQuestion = (index) => {
    if (
      index < 0 ||
      index >= totalQuestions
    ) {
      return;
    }

    setCurrentQuestion(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // SUBMIT EXAM
  // ==========================================

  const handleSubmitExam = async (
    automatic = false
  ) => {
    if (!attempt?._id || submitting) {
      return;
    }

    // ==========================================
    // CONFIRM MANUAL SUBMISSION
    // ==========================================

    if (!automatic) {
      const confirmed = window.confirm(
        `You have answered ${answeredCount} out of ${totalQuestions} questions.\n\nAre you sure you want to submit your exam?`
      );

      if (!confirmed) {
        return;
      }
    }

    const authToken = getToken();

    if (!authToken) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      console.log(
        "================================="
      );

      console.log("SUBMITTING EXAM");

      console.log(
        "Attempt ID:",
        attempt._id
      );

      console.log(
        "Answered:",
        answeredCount
      );

      console.log(
        "Unanswered:",
        unansweredCount
      );

      console.log(
        "================================="
      );

      const response = await fetch(
        `http://localhost:5000/api/exams/attempt/${attempt._id}/submit`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log(
        "SUBMIT RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit exam"
        );
      }

      // ==========================================
      // SAVE RESULT TEMPORARILY
      // ==========================================

      if (data.result) {
        sessionStorage.setItem(
          "xcelExamResult",
          JSON.stringify(data.result)
        );
      }

      // ==========================================
      // GO TO RESULT PAGE
      // ==========================================

      navigate(
        `/exam-result/${attempt._id}`,
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Submit exam error:",
        error
      );

      setError(error.message);

      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          padding: "30px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "40px",
            borderRadius: "16px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
          }}
        >
          <h1>XCEL CBT</h1>

          <p>
            Loading examination...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR SCREEN
  // ==========================================

  if (error && !attempt) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          padding: "30px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "40px",
            borderRadius: "16px",
            maxWidth: "500px",
            width: "100%",
            textAlign: "center",
            border: "1px solid #e5e7eb",
          }}
        >
          <h1>XCEL CBT</h1>

          <p
            style={{
              color: "#dc2626",
              marginTop: "20px",
            }}
          >
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            style={{
              marginTop: "20px",
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              background: "#111827",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO QUESTIONS
  // ==========================================

  if (
    !attempt ||
    !attempt.questions ||
    attempt.questions.length === 0
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          padding: "30px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "40px",
            borderRadius: "16px",
            textAlign: "center",
          }}
        >
          <h1>No Questions Available</h1>

          <p>
            This examination does not contain
            any questions.
          </p>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            style={{
              marginTop: "20px",
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              background: "#111827",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SAFETY CHECK
  // ==========================================

  if (!question) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "40px",
          background: "#f5f7fb",
        }}
      >
        <h1>Question not found</h1>

        <button
          onClick={() =>
            setCurrentQuestion(0)
          }
        >
          Return to first question
        </button>
      </div>
    );
  }

  // ==========================================
  // QUESTION ID
  // ==========================================

  const questionId = question._id;

  // ==========================================
  // SELECTED ANSWER FOR CURRENT QUESTION
  // ==========================================

  const currentSelectedAnswer =
    selectedAnswers[questionId];

  // ==========================================
  // TIMER WARNING
  // ==========================================

  const timerDanger = timeLeft <= 300;

  // ==========================================
  // MAIN CBT SCREEN
  // ==========================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "25px",
      }}
    >
      {/* ======================================
          HEADER
      ====================================== */}

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto 25px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "20px 25px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
            }}
          >
            XCEL CBT
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#6b7280",
            }}
          >
            {attempt.exam?.title ||
              "Examination"}
          </p>
        </div>

        {/* TIMER */}

        <div
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            background: timerDanger
              ? "#fee2e2"
              : "#f3f4f6",
            border: timerDanger
              ? "1px solid #fecaca"
              : "1px solid #e5e7eb",
            color: timerDanger
              ? "#b91c1c"
              : "#111827",
            fontWeight: "bold",
            fontSize: "20px",
            minWidth: "150px",
            textAlign: "center",
          }}
        >
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && (
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto 20px",
            padding: "14px 18px",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================
          MAIN LAYOUT
      ====================================== */}

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) 300px",
          gap: "25px",
        }}
      >
        {/* ====================================
            QUESTION AREA
        ==================================== */}

        <div
          style={{
            background: "#ffffff",
            padding: "30px",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* QUESTION HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  padding: "7px 12px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                Question{" "}
                {currentQuestion + 1} of{" "}
                {totalQuestions}
              </span>
            </div>

            {savingAnswer && (
              <span
                style={{
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Saving answer...
              </span>
            )}
          </div>

          {/* QUESTION TEXT */}

          <h2
            style={{
              margin: "0 0 30px",
              fontSize: "22px",
              lineHeight: "1.6",
              color: "#111827",
            }}
          >
            {question.questionText}
          </h2>

          {/* ==================================
              OPTIONS
          ================================== */}

          <div>
            {Object.entries(
              question.options || {}
            ).map(([letter, text]) => {
              const isSelected =
                currentSelectedAnswer ===
                letter;

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() =>
                    handleAnswerSelect(
                      questionId,
                      letter
                    )
                  }
                  disabled={submitting}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    width: "100%",
                    textAlign: "left",
                    padding: "18px",
                    marginBottom: "14px",
                    borderRadius: "10px",

                    border: isSelected
                      ? "2px solid #2563eb"
                      : "1px solid #d1d5db",

                    background: isSelected
                      ? "#eff6ff"
                      : "#ffffff",

                    cursor: submitting
                      ? "not-allowed"
                      : "pointer",

                    fontSize: "16px",
                    color: "#111827",
                  }}
                >
                  {/* LETTER */}

                  <span
                    style={{
                      width: "36px",
                      height: "36px",
                      minWidth: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      marginRight: "14px",

                      background:
                        isSelected
                          ? "#2563eb"
                          : "#f3f4f6",

                      color: isSelected
                        ? "#ffffff"
                        : "#374151",

                      fontWeight: "bold",
                    }}
                  >
                    {letter}
                  </span>

                  {/* ANSWER TEXT */}

                  <span
                    style={{
                      paddingTop: "7px",
                      lineHeight: "1.5",
                    }}
                  >
                    {text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ==================================
              NAVIGATION
          ================================== */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: "15px",
              marginTop: "35px",
              paddingTop: "25px",
              borderTop:
                "1px solid #e5e7eb",
            }}
          >
            <button
              type="button"
              onClick={handlePrevious}
              disabled={
                currentQuestion === 0 ||
                submitting
              }
              style={{
                padding: "12px 22px",
                borderRadius: "8px",
                border:
                  "1px solid #d1d5db",
                background: "#ffffff",
                cursor:
                  currentQuestion === 0 ||
                  submitting
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                currentQuestion ===
                  totalQuestions - 1 ||
                submitting
              }
              style={{
                padding: "12px 22px",
                borderRadius: "8px",
                border: "none",
                background:
                  currentQuestion ===
                  totalQuestions - 1
                    ? "#d1d5db"
                    : "#2563eb",
                color: "#ffffff",
                cursor:
                  currentQuestion ===
                    totalQuestions - 1 ||
                  submitting
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Next →
            </button>
          </div>

          {/* ==================================
              SUBMIT BUTTON
          ================================== */}

          <button
            type="button"
            onClick={() =>
              handleSubmitExam(false)
            }
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "15px",
              border: "none",
              borderRadius: "9px",
              background: submitting
                ? "#6b7280"
                : "#111827",
              color: "#ffffff",
              cursor: submitting
                ? "not-allowed"
                : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {submitting
              ? "Submitting Exam..."
              : "Submit Exam"}
          </button>
        </div>

        {/* ====================================
            QUESTION NAVIGATOR
        ==================================== */}

        <div
          style={{
            background: "#ffffff",
            padding: "22px",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            height: "fit-content",
            position: "sticky",
            top: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "18px",
            }}
          >
            Questions
          </h3>

          {/* PROGRESS */}

          <div
            style={{
              marginBottom: "20px",
              padding: "14px",
              background: "#f9fafb",
              borderRadius: "9px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              <span>Progress</span>

              <strong>
                {answeredCount}/
                {totalQuestions}
              </strong>
            </div>

            <div
              style={{
                width: "100%",
                height: "7px",
                background: "#e5e7eb",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width:
                    totalQuestions > 0
                      ? `${
                          (answeredCount /
                            totalQuestions) *
                          100
                        }%`
                      : "0%",
                  height: "100%",
                  background: "#2563eb",
                }}
              />
            </div>
          </div>

          {/* QUESTION NUMBERS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, 1fr)",
              gap: "9px",
            }}
          >
            {attempt.questions.map(
              (item, index) => {
                const itemQuestionId =
                  item._id;

                const answered =
                  Boolean(
                    selectedAnswers[
                      itemQuestionId
                    ]
                  );

                const isCurrent =
                  currentQuestion === index;

                return (
                  <button
                    key={itemQuestionId}
                    type="button"
                    onClick={() =>
                      goToQuestion(index)
                    }
                    disabled={submitting}
                    style={{
                      height: "42px",
                      borderRadius: "7px",

                      border: isCurrent
                        ? "2px solid #2563eb"
                        : "1px solid #d1d5db",

                      background: answered
                        ? "#dcfce7"
                        : "#ffffff",

                      color: answered
                        ? "#166534"
                        : "#374151",

                      fontWeight:
                        isCurrent ||
                        answered
                          ? "bold"
                          : "normal",

                      cursor: submitting
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {index + 1}
                  </button>
                );
              }
            )}
          </div>

          {/* ==================================
              LEGEND
          ================================== */}

          <div
            style={{
              marginTop: "25px",
              paddingTop: "20px",
              borderTop:
                "1px solid #e5e7eb",
              fontSize: "14px",
            }}
          >
            <p>
              🟢 Answered:{" "}
              <strong>
                {answeredCount}
              </strong>
            </p>

            <p>
              ⚪ Unanswered:{" "}
              <strong>
                {unansweredCount}
              </strong>
            </p>

            <p>
              🔵 Current:{" "}
              <strong>
                {currentQuestion + 1}
              </strong>
            </p>
          </div>

          {/* ==================================
              SIDEBAR SUBMIT
          ================================== */}

          <button
            type="button"
            onClick={() =>
              handleSubmitExam(false)
            }
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "13px",
              border: "none",
              borderRadius: "8px",
              background: submitting
                ? "#6b7280"
                : "#111827",
              color: "#ffffff",
              cursor: submitting
                ? "not-allowed"
                : "pointer",
              fontWeight: "bold",
            }}
          >
            {submitting
              ? "Submitting..."
              : "Submit Exam"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CBT;