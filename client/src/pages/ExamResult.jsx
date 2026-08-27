import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const ExamResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { token, loading: authLoading } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD RESULT
  // ==========================================

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    loadResult();
  }, [id, token, authLoading]);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError("");

      // ==========================================
      // 1. CHECK SESSION STORAGE FIRST
      // ==========================================

      const storedResult =
        sessionStorage.getItem("xcelExamResult");

      if (storedResult) {
        try {
          const parsedResult =
            JSON.parse(storedResult);

          console.log(
            "================================="
          );
          console.log(
            "RESULT FROM SESSION STORAGE"
          );
          console.log("Result:", parsedResult);
          console.log(
            "================================="
          );

          /*
           * Make sure this result belongs to
           * the current attempt.
           */

          if (
            parsedResult?.attemptId?.toString() ===
            id?.toString()
          ) {
            setResult(parsedResult);

            /*
             * Do NOT return permanently here.
             *
             * The submit response only contains
             * summary information such as:
             *
             * score
             * totalMarks
             * status
             *
             * We still want to fetch the full
             * question review from the server.
             */

            try {
              await fetchFullResult();
            } catch (serverError) {
              console.warn(
                "Could not load full result. Using submitted result.",
                serverError
              );
            }

            setLoading(false);
            return;
          }
        } catch (storageError) {
          console.warn(
            "Invalid stored exam result:",
            storageError
          );
        }
      }

      // ==========================================
      // 2. NO VALID SESSION RESULT
      // FETCH FROM SERVER
      // ==========================================

      await fetchFullResult();
    } catch (error) {
      console.error(
        "Fetch result error:",
        error
      );

      setError(
        error.message ||
          "Failed to load exam result"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH FULL RESULT
  // ==========================================


const fetchFullResult = async () => {
  console.log(
    "================================="
  );
  console.log("FETCHING RESULT FROM SERVER");
  console.log("Attempt ID:", id);
  console.log(
    "================================="
  );

  try {
    const response = await fetch(
      `${API_URL}/attempts/${id}/result`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log(
      "================================="
    );
    console.log("RESULT API RESPONSE");
    console.log(data);
    console.log(
      "================================="
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Exam result not found"
      );
    }

    /*
     * Support both possible backend formats:
     *
     * {
     *   result: {...}
     * }
     *
     * and
     *
     * {
     *   attempt: {...}
     * }
     */

    const serverResult =
      data.result || data.attempt;

    if (!serverResult) {
      throw new Error(
        "The server returned no exam result."
      );
    }

    setResult(serverResult);

    return serverResult;
  } catch (error) {
    console.error(
      "Fetch result error:",
      error
    );

    throw error;
  }
};

  // ==========================================
  // STATISTICS
  // ==========================================

  const stats = useMemo(() => {
    if (!result) {
      return {
        correct: 0,
        wrong: 0,
        unanswered: 0,
      };
    }

    /*
     * If backend already calculated the
     * statistics, use them.
     */

    if (
      typeof result.correct === "number" ||
      typeof result.wrong === "number" ||
      typeof result.unanswered === "number"
    ) {
      return {
        correct: result.correct || 0,
        wrong: result.wrong || 0,
        unanswered: result.unanswered || 0,
      };
    }

    /*
     * Otherwise calculate from answers.
     */

    if (
      !Array.isArray(result.answers) ||
      result.answers.length === 0
    ) {
      return {
        correct: 0,
        wrong: 0,
        unanswered: 0,
      };
    }

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    result.answers.forEach((answer) => {
      if (
        answer.selectedAnswer === null ||
        answer.selectedAnswer === undefined ||
        answer.selectedAnswer === ""
      ) {
        unanswered++;
        return;
      }

      /*
       * If backend stored isCorrect,
       * use it.
       */

      if (answer.isCorrect === true) {
        correct++;
        return;
      }

      if (answer.isCorrect === false) {
        wrong++;
        return;
      }

      /*
       * Otherwise compare against
       * populated question.
       */

      if (
        answer.question?.correctAnswer &&
        answer.selectedAnswer ===
          answer.question.correctAnswer
      ) {
        correct++;
      } else {
        wrong++;
      }
    });

    return {
      correct,
      wrong,
      unanswered,
    };
  }, [result]);

  // ==========================================
  // LOADING
  // ==========================================

  if (authLoading || loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />

          <h2>
            Loading your result...
          </h2>

          <p>
            Please wait while we prepare
            your examination result.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div style={styles.center}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>
            !
          </div>

          <h2>
            Unable to load result
          </h2>

          <p>{error}</p>

          <div style={styles.errorActions}>
            <button
              onClick={loadResult}
              style={styles.primaryButton}
            >
              Try Again
            </button>

            <button
              onClick={() =>
                navigate("/dashboard")
              }
              style={styles.secondaryButton}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO RESULT
  // ==========================================

  if (!result) {
    return (
      <div style={styles.center}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>
            !
          </div>

          <h2>Result not found</h2>

          <p>
            No result is available for this
            examination attempt.
          </p>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            style={styles.primaryButton}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCORE
  // ==========================================

  const score = Number(result.score || 0);

  const totalMarks = Number(
    result.totalMarks || 0
  );

  const percentage =
    totalMarks > 0
      ? ((score / totalMarks) * 100).toFixed(
          1
        )
      : "0.0";

  // ==========================================
  // EXAM TITLE
  // ==========================================

  const examTitle =
    result.exam?.title ||
    result.examTitle ||
    "Xcel Academy Examination";

  // ==========================================
  // ANSWERS
  // ==========================================

  const answers = Array.isArray(
    result.answers
  )
    ? result.answers
    : [];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* =====================================
            HEADER
        ====================================== */}

        <div style={styles.header}>
          <div>
            <p style={styles.brand}>
              XCEL ACADEMY
            </p>

            <h1 style={styles.title}>
              Exam Result
            </h1>

            <p style={styles.subtitle}>
              {examTitle}
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            style={styles.secondaryButton}
          >
            Dashboard
          </button>
        </div>

        {/* =====================================
            SUCCESS BANNER
        ====================================== */}

        <div style={styles.successBanner}>
          <div style={styles.successIcon}>
            ✓
          </div>

          <div>
            <h2 style={styles.bannerTitle}>
              Examination Completed
            </h2>

            <p style={styles.bannerText}>
              Your examination has been
              submitted successfully.
            </p>
          </div>
        </div>

        {/* =====================================
            SCORE CARD
        ====================================== */}

        <div style={styles.scoreCard}>
          <p style={styles.scoreLabel}>
            YOUR SCORE
          </p>

          <div style={styles.scoreWrapper}>
            <span style={styles.score}>
              {score}
            </span>

            <span style={styles.total}>
              / {totalMarks}
            </span>
          </div>

          <div style={styles.percentageBadge}>
            {percentage}%
          </div>

          <p style={styles.statusText}>
            Status:{" "}
            <strong>
              {result.status || "Submitted"}
            </strong>
          </p>
        </div>

        {/* =====================================
            STATISTICS
        ====================================== */}

        <div style={styles.statsGrid}>
          <div
            style={{
              ...styles.statCard,
              borderTop:
                "4px solid #16a34a",
            }}
          >
            <div style={styles.statNumber}>
              {stats.correct}
            </div>

            <div style={styles.statLabel}>
              Correct
            </div>
          </div>

          <div
            style={{
              ...styles.statCard,
              borderTop:
                "4px solid #dc2626",
            }}
          >
            <div style={styles.statNumber}>
              {stats.wrong}
            </div>

            <div style={styles.statLabel}>
              Wrong
            </div>
          </div>

          <div
            style={{
              ...styles.statCard,
              borderTop:
                "4px solid #f59e0b",
            }}
          >
            <div style={styles.statNumber}>
              {stats.unanswered}
            </div>

            <div style={styles.statLabel}>
              Unanswered
            </div>
          </div>
        </div>

        {/* =====================================
            EXAM INFORMATION
        ====================================== */}

        <div style={styles.infoCard}>
          <h2 style={styles.sectionTitle}>
            Exam Information
          </h2>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>
                Examination
              </span>

              <strong>
                {examTitle}
              </strong>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>
                Exam Type
              </span>

              <strong>
                {result.exam?.examType ||
                  result.examType ||
                  "Practice"}
              </strong>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>
                Total Marks
              </span>

              <strong>
                {totalMarks}
              </strong>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>
                Score
              </span>

              <strong>
                {score}
              </strong>
            </div>

            {result.submittedAt && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>
                  Submitted
                </span>

                <strong>
                  {new Date(
                    result.submittedAt
                  ).toLocaleString()}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* =====================================
            QUESTION REVIEW
        ====================================== */}

        <div style={styles.reviewSection}>
          <div style={styles.reviewHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Question Review
              </h2>

              <p style={styles.reviewSubtitle}>
                Review your answers and the
                correct answers.
              </p>
            </div>

            <div style={styles.reviewCount}>
              {answers.length} Questions
            </div>
          </div>

          {/* NO ANSWERS */}

          {answers.length === 0 ? (
            <div style={styles.infoCard}>
              <div
                style={
                  styles.noAnswersIcon
                }
              >
                📋
              </div>

              <h3>
                No answer details are
                available for this attempt.
              </h3>

              <p style={styles.mutedText}>
                Your score has still been
                recorded successfully.
              </p>
            </div>
          ) : (
            <div style={styles.questions}>
              {answers.map(
                (answer, index) => {
                  const question =
                    answer.question;

                  const selected =
                    answer.selectedAnswer;

                  const correct =
                    question?.correctAnswer;

                  const isUnanswered =
                    selected === null ||
                    selected === undefined ||
                    selected === "";

                  let isCorrect =
                    false;

                  if (
                    answer.isCorrect ===
                    true
                  ) {
                    isCorrect = true;
                  } else if (
                    answer.isCorrect ===
                    false
                  ) {
                    isCorrect = false;
                  } else {
                    isCorrect =
                      !isUnanswered &&
                      correct &&
                      selected === correct;
                  }

                  return (
                    <div
                      key={
                        answer._id ||
                        `${index}-${question?._id}`
                      }
                      style={{
                        ...styles.questionCard,
                        borderLeft: isUnanswered
                          ? "5px solid #f59e0b"
                          : isCorrect
                          ? "5px solid #16a34a"
                          : "5px solid #dc2626",
                      }}
                    >
                      {/* QUESTION HEADER */}

                      <div
                        style={
                          styles.questionHeader
                        }
                      >
                        <div>
                          <span
                            style={
                              styles.questionNumber
                            }
                          >
                            QUESTION{" "}
                            {index + 1}
                          </span>
                        </div>

                        <span
                          style={{
                            ...styles.statusBadge,
                            background:
                              isUnanswered
                                ? "#fef3c7"
                                : isCorrect
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              isUnanswered
                                ? "#92400e"
                                : isCorrect
                                ? "#166534"
                                : "#991b1b",
                          }}
                        >
                          {isUnanswered
                            ? "Unanswered"
                            : isCorrect
                            ? "Correct"
                            : "Wrong"}
                        </span>
                      </div>

                      {/* QUESTION TEXT */}

                      <p
                        style={
                          styles.questionText
                        }
                      >
                        {question?.questionText ||
                          "Question unavailable"}
                      </p>

                      {/* OPTIONS */}

                      {question?.options && (
                        <div>
                          {Object.entries(
                            question.options
                          ).map(
                            ([
                              letter,
                              text,
                            ]) => {
                              const isSelected =
                                selected ===
                                letter;

                              const isAnswer =
                                correct ===
                                letter;

                              let background =
                                "#f8fafc";

                              let border =
                                "1px solid #e5e7eb";

                              if (isAnswer) {
                                background =
                                  "#dcfce7";

                                border =
                                  "1px solid #16a34a";
                              } else if (
                                isSelected
                              ) {
                                background =
                                  "#fee2e2";

                                border =
                                  "1px solid #dc2626";
                              }

                              return (
                                <div
                                  key={
                                    letter
                                  }
                                  style={{
                                    ...styles.option,
                                    background,
                                    border,
                                  }}
                                >
                                  <div
                                    style={
                                      styles.optionContent
                                    }
                                  >
                                    <strong
                                      style={
                                        styles.optionLetter
                                      }
                                    >
                                      {
                                        letter
                                      }
                                      .
                                    </strong>

                                    <span>
                                      {text}
                                    </span>
                                  </div>

                                  <div
                                    style={
                                      styles.optionTags
                                    }
                                  >
                                    {isSelected && (
                                      <span
                                        style={
                                          styles.answerTag
                                        }
                                      >
                                        Your
                                        answer
                                      </span>
                                    )}

                                    {isAnswer && (
                                      <span
                                        style={
                                          styles.correctTag
                                        }
                                      >
                                        Correct
                                        answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}

                      {/* EXPLANATION */}

                      {question?.explanation && (
                        <div
                          style={
                            styles.explanation
                          }
                        >
                          <strong>
                            Explanation
                          </strong>

                          <p>
                            {
                              question.explanation
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* =====================================
            BOTTOM ACTIONS
        ====================================== */}

        <div style={styles.bottomActions}>
          <button
            onClick={() =>
              navigate("/dashboard")
            }
            style={styles.primaryButton}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px 20px",
  },

  container: {
    maxWidth: "950px",
    margin: "0 auto",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "#f5f7fb",
  },

  loadingCard: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px solid #e5e7eb",
  },

  spinner: {
    width: "35px",
    height: "35px",
    border: "4px solid #e5e7eb",
    borderTop:
      "4px solid #2563eb",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation:
      "spin 1s linear infinite",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    gap: "20px",
  },

  brand: {
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "2px",
    color: "#2563eb",
    margin: "0 0 5px",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    color: "#111827",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "8px",
    fontSize: "16px",
  },

  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "20px",
  },

  successIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
  },

  bannerTitle: {
    margin: 0,
    color: "#166534",
  },

  bannerText: {
    margin: "5px 0 0",
    color: "#166534",
  },

  scoreCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    border: "1px solid #e5e7eb",
    marginBottom: "20px",
  },

  scoreLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "1px",
    margin: 0,
  },

  scoreWrapper: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    margin: "10px 0",
  },

  score: {
    fontSize: "64px",
    fontWeight: "800",
    color: "#111827",
  },

  total: {
    fontSize: "30px",
    color: "#94a3b8",
    marginLeft: "8px",
  },

  percentageBadge: {
    display: "inline-block",
    background: "#eff6ff",
    color: "#2563eb",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "20px",
    fontWeight: "800",
  },

  statusText: {
    color: "#64748b",
    marginTop: "15px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },

  statCard: {
    background: "#ffffff",
    borderRight:
      "1px solid #e5e7eb",
    borderBottom:
      "1px solid #e5e7eb",
    borderLeft:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "25px",
    textAlign: "center",
  },

  statNumber: {
    fontSize: "34px",
    fontWeight: "800",
    color: "#111827",
  },

  statLabel: {
    color: "#64748b",
    marginTop: "5px",
  },

  infoCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "25px",
    marginBottom: "25px",
    textAlign: "left",
  },

  sectionTitle: {
    marginTop: 0,
    color: "#111827",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  infoLabel: {
    color: "#64748b",
    fontSize: "13px",
  },

  reviewSection: {
    marginTop: "35px",
  },

  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "20px",
    marginBottom: "20px",
  },

  reviewSubtitle: {
    color: "#64748b",
    marginTop: "5px",
  },

  reviewCount: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "8px 14px",
    borderRadius: "20px",
    color: "#64748b",
    fontSize: "13px",
  },

  questions: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  questionCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "25px",
    borderTop:
      "1px solid #e5e7eb",
    borderRight:
      "1px solid #e5e7eb",
    borderBottom:
      "1px solid #e5e7eb",
  },

  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
  },

  questionNumber: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: "1px",
  },

  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  questionText: {
    fontSize: "17px",
    lineHeight: "1.7",
    margin: "20px 0",
    color: "#111827",
  },

  option: {
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "10px",
  },

  optionContent: {
    display: "flex",
    gap: "10px",
    lineHeight: "1.5",
  },

  optionLetter: {
    minWidth: "22px",
  },

  optionTags: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    marginLeft: "32px",
  },

  answerTag: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#991b1b",
    background: "#fee2e2",
    padding: "4px 8px",
    borderRadius: "5px",
  },

  correctTag: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#166534",
    background: "#dcfce7",
    padding: "4px 8px",
    borderRadius: "5px",
  },

  explanation: {
    marginTop: "20px",
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "8px",
    lineHeight: "1.6",
    color: "#334155",
  },

  noAnswersIcon: {
    fontSize: "35px",
    marginBottom: "10px",
  },

  mutedText: {
    color: "#64748b",
  },

  bottomActions: {
    marginTop: "35px",
    paddingBottom: "50px",
  },

  primaryButton: {
    padding: "13px 22px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    background: "#111827",
    color: "#ffffff",
  },

  secondaryButton: {
    padding: "11px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    color: "#111827",
  },

  errorBox: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    maxWidth: "500px",
    border: "1px solid #e5e7eb",
  },

  errorIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    fontSize: "24px",
    fontWeight: "bold",
  },

  errorActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginTop: "25px",
    flexWrap: "wrap",
  },
};

export default ExamResult;