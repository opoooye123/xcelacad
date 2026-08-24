import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ExamHistory = () => {
  const navigate = useNavigate();

  const {
    token,
    loading: authLoading,
  } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    fetchHistory();
  }, [token, authLoading]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/exams/attempts/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load exam history"
        );
      }

      setHistory(data.history || []);
    } catch (error) {
      console.error(
        "Fetch exam history error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 70) {
      return "#166534";
    }

    if (percentage >= 50) {
      return "#92400e";
    }

    return "#991b1b";
  };

  if (authLoading || loading) {
    return (
      <div style={styles.center}>
        <h2>Loading exam history...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <div style={styles.errorBox}>
          <h2>Unable to load history</h2>

          <p>{error}</p>

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

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Exam History
            </h1>

            <p style={styles.subtitle}>
              View your completed Xcel Academy
              examinations.
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

        {/* EMPTY STATE */}

        {history.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>
              No completed exams yet
            </h2>

            <p>
              Once you complete an exam,
              your result will appear here.
            </p>

            <button
              onClick={() =>
                navigate("/dashboard")
              }
              style={styles.primaryButton}
            >
              Find an Exam
            </button>
          </div>
        ) : (
          <div style={styles.list}>

            {history.map((attempt) => (
              <div
                key={attempt.attemptId}
                style={styles.examCard}
              >

                {/* EXAM INFO */}

                <div style={styles.examInfo}>
                  <h2>
                    {attempt.exam?.title ||
                      "Unknown Exam"}
                  </h2>

                  <p
                    style={
                      styles.examType
                    }
                  >
                    {attempt.exam
                      ?.examType ||
                      "Practice"}
                  </p>

                  <p
                    style={
                      styles.date
                    }
                  >
                    Submitted:{" "}
                    {attempt.submittedAt
                      ? new Date(
                          attempt.submittedAt
                        ).toLocaleString()
                      : "N/A"}
                  </p>
                </div>

                {/* SCORE */}

                <div style={styles.scoreBox}>
                  <div
                    style={{
                      ...styles.score,
                      color:
                        getScoreColor(
                          attempt.percentage
                        ),
                    }}
                  >
                    {attempt.score}
                    <span>
                      /
                      {attempt.totalMarks}
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.percentage,
                      color:
                        getScoreColor(
                          attempt.percentage
                        ),
                    }}
                  >
                    {attempt.percentage}%
                  </div>

                  <div
                    style={{
                      ...styles.status,
                      background:
                        attempt.status ===
                        "submitted"
                          ? "#dcfce7"
                          : "#fef3c7",
                      color:
                        attempt.status ===
                        "submitted"
                          ? "#166534"
                          : "#92400e",
                    }}
                  >
                    {attempt.status}
                  </div>
                </div>

                {/* ACTION */}

                <button
                  onClick={() =>
                    navigate(
                      `/exam-result/${attempt.attemptId}`
                    )
                  }
                  style={
                    styles.viewButton
                  }
                >
                  View Result
                </button>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px 20px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "8px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  examCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "22px",
    display: "grid",
    gridTemplateColumns:
      "1fr auto auto",
    alignItems: "center",
    gap: "25px",
  },

  examInfo: {
    minWidth: 0,
  },

  examType: {
    display: "inline-block",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  date: {
    color: "#64748b",
    fontSize: "14px",
  },

  scoreBox: {
    textAlign: "center",
    minWidth: "110px",
  },

  score: {
    fontSize: "25px",
    fontWeight: "bold",
  },

  percentage: {
    fontSize: "15px",
    fontWeight: "600",
    marginTop: "3px",
  },

  scoreSpan: {
    fontSize: "16px",
  },

  status: {
    marginTop: "8px",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "11px",
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  viewButton: {
    padding: "11px 17px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  primaryButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  secondaryButton: {
    padding: "10px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
  },

  emptyCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "50px 30px",
    textAlign: "center",
  },

  errorBox: {
    textAlign: "center",
  },
};

export default ExamHistory;