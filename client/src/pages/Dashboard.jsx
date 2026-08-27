import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ExamList from "../componenet/ExamList";
import { API_URL } from "../lib/api";


const Dashboard = () => {
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    fetchHistory();
  }, [token, authLoading]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);

     const response = await fetch(
  `${API_URL}/attempts/history`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load statistics"
        );
      }

      setHistory(data.history || []);
    } catch (error) {
      console.error(
        "Dashboard history error:",
        error
      );

      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const statistics = useMemo(() => {
    if (!history.length) {
      return {
        completed: 0,
        average: 0,
        best: 0,
      };
    }

    const percentages = history.map(
      (attempt) =>
        Number(attempt.percentage) || 0
    );

    const total = percentages.reduce(
      (sum, percentage) =>
        sum + percentage,
      0
    );

    return {
      completed: history.length,

      average: (
        total / percentages.length
      ).toFixed(1),

      best: Math.max(...percentages),
    };
  }, [history]);

  // ==========================================
  // RECENT EXAMS
  // ==========================================

  const recentExams = history.slice(0, 5);

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Welcome to Xcel Academy 👋
            </h1>

            <p style={styles.subtitle}>
              Prepare for JAMB, Post-UTME and
              your academic exams.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/exam-history")
            }
            style={styles.historyButton}
          >
            Exam History
          </button>
        </div>

        <button
  onClick={() => navigate("/profile")}
>
  My Profile
</button>

        {/* STATISTICS */}

        <div style={styles.statsGrid}>

          <StatCard
            title="Exams Completed"
            value={
              historyLoading
                ? "..."
                : statistics.completed
            }
            icon="📚"
          />

          <StatCard
            title="Average Score"
            value={
              historyLoading
                ? "..."
                : `${statistics.average}%`
            }
            icon="🎯"
          />

          <StatCard
            title="Best Score"
            value={
              historyLoading
                ? "..."
                : `${statistics.best}%`
            }
            icon="🏆"
          />

        </div>

        {/* RECENT EXAMS */}

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Recent Exams
              </h2>

              <p style={styles.sectionSubtitle}>
                Your latest completed
                examinations.
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={() =>
                  navigate("/exam-history")
                }
                style={styles.viewAllButton}
              >
                View All
              </button>
            )}
          </div>

          {historyLoading ? (
            <div style={styles.emptyCard}>
              <p>
                Loading your recent exams...
              </p>
            </div>
          ) : recentExams.length === 0 ? (
            <div style={styles.emptyCard}>
              <h3>
                No completed exams yet
              </h3>

              <p>
                Take your first exam and
                your performance will appear
                here.
              </p>
            </div>
          ) : (
            <div style={styles.recentList}>
              {recentExams.map((attempt) => (
                <div
                  key={attempt.attemptId}
                  style={styles.recentCard}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        marginBottom: "6px",
                      }}
                    >
                      {attempt.exam?.title ||
                        "Unknown Exam"}
                    </h3>

                    <p
                      style={
                        styles.recentDate
                      }
                    >
                      {attempt.submittedAt
                        ? new Date(
                            attempt.submittedAt
                          ).toLocaleDateString()
                        : "No date"}
                    </p>
                  </div>

                  <div
                    style={
                      styles.recentScore
                    }
                  >
                    <strong>
                      {attempt.score}/
                      {attempt.totalMarks}
                    </strong>

                    <span>
                      {attempt.percentage}%
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/exam-result/${attempt.attemptId}`
                      )
                    }
                    style={
                      styles.resultButton
                    }
                  >
                    View Result
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AVAILABLE EXAMS */}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Available Exams
          </h2>

          <p style={styles.sectionSubtitle}>
            Choose an exam and start
            practicing.
          </p>

          <ExamList />
        </div>

      </div>
    </div>
  );
};

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>
        <p style={styles.statTitle}>
          {title}
        </p>

        <h2 style={styles.statValue}>
          {value}
        </h2>
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
    maxWidth: "1100px",
    margin: "0 auto",
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
    fontSize: "16px",
  },

  historyButton: {
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginBottom: "35px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  statIcon: {
    fontSize: "30px",
  },

  statTitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },

  statValue: {
    margin: "5px 0 0",
    fontSize: "28px",
  },

  section: {
    marginBottom: "40px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  sectionTitle: {
    margin: 0,
  },

  sectionSubtitle: {
    color: "#64748b",
    marginTop: "5px",
  },

  viewAllButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
  },

  emptyCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "30px",
    textAlign: "center",
    color: "#64748b",
  },

  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  recentCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px 20px",
    display: "grid",
    gridTemplateColumns:
      "1fr auto auto",
    alignItems: "center",
    gap: "20px",
  },

  recentDate: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "13px",
  },

  recentScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "80px",
  },

  resultButton: {
    padding: "9px 14px",
    border: "none",
    borderRadius: "7px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default Dashboard;