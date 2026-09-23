import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const TeacherStudentPerformance = () => {
  const { schoolId, studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("xcelToken");

      if (!token) {
        throw new Error(
          "You are not authenticated."
        );
      }

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/teacher-dashboard/students/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load student performance."
        );
      }

      setData(result);
    } catch (error) {
      console.error(
        "Student performance error:",
        error
      );

      setError(
        error.message ||
          "Failed to load student performance."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [schoolId, studentId]);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p>Loading student performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <h2>Unable to load performance</h2>

          <p>{error}</p>

          <button
            onClick={fetchPerformance}
            style={styles.primaryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    student,
    summary,
    exams,
  } = data;

  const getPerformanceColor = (
    percentage
  ) => {
    if (percentage < 50) return "#dc2626";
    if (percentage < 70) return "#d97706";
    return "#16a34a";
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}

      <div style={styles.topBar}>
        <button
          onClick={() =>
            navigate(
              `/school/${schoolId}/teacher-dashboard`
            )
          }
          style={styles.backButton}
        >
          ← Teacher Dashboard
        </button>
      </div>

      {/* STUDENT PROFILE */}

      <div style={styles.profileCard}>
        <div style={styles.profileLeft}>
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              style={styles.avatar}
            />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {student.name
                ?.charAt(0)
                ?.toUpperCase()}
            </div>
          )}

          <div>
            <h1 style={styles.name}>
              {student.name}
            </h1>

            <p style={styles.email}>
              {student.email}
            </p>

            <p style={styles.className}>
              {student.class?.name || "Unknown Class"}

              {student.class?.section
                ? ` • ${student.class.section}`
                : ""}
            </p>
          </div>
        </div>

        <div
          style={{
            ...styles.statusBadge,
            color: getPerformanceColor(
              summary.overallAverage
            ),
            background:
              summary.overallAverage < 50
                ? "#fee2e2"
                : summary.overallAverage < 70
                ? "#fef3c7"
                : "#dcfce7",
          }}
        >
          {summary.performanceStatus}
        </div>
      </div>

      {/* SUMMARY */}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            Overall Average
          </p>

          <h2
            style={{
              ...styles.statValue,
              color: getPerformanceColor(
                summary.overallAverage
              ),
            }}
          >
            {summary.overallAverage}%
          </h2>
        </div>

        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            Exams Attempted
          </p>

          <h2 style={styles.statValue}>
            {summary.attemptedCount}
          </h2>

          <p style={styles.statSmall}>
            of {summary.examCount} exams
          </p>
        </div>

        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            Best Score
          </p>

          <h2 style={styles.statValue}>
            {summary.bestScore
              ? `${summary.bestScore.percentage}%`
              : "—"}
          </h2>
        </div>

        <div style={styles.statCard}>
          <p style={styles.statLabel}>
            Lowest Score
          </p>

          <h2 style={styles.statValue}>
            {summary.lowestScore
              ? `${summary.lowestScore.percentage}%`
              : "—"}
          </h2>
        </div>
      </div>

      {/* EXAM HISTORY */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Exam Performance
            </h2>

            <p style={styles.sectionSubtitle}>
              Detailed results from school exams
            </p>
          </div>
        </div>

        {exams.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              📊
            </div>

            <h3>No exam results yet</h3>

            <p>
              This student has not submitted
              any school exams yet.
            </p>
          </div>
        ) : (
          <div style={styles.examList}>
            {exams.map((result) => (
              <div
                key={result.attemptId}
                style={styles.examCard}
              >
                <div>
                  <h3 style={styles.examTitle}>
                    {result.exam?.title ||
                      "School Exam"}
                  </h3>

                  <p style={styles.examDate}>
                    Submitted{" "}
                    {result.submittedAt
                      ? new Date(
                          result.submittedAt
                        ).toLocaleDateString()
                      : "Unknown date"}
                  </p>

                  <div
                    style={
                      styles.subjectContainer
                    }
                  >
                    {result.exam?.subjects?.map(
                      (subject) => (
                        <span
                          key={subject._id}
                          style={
                            styles.subjectBadge
                          }
                        >
                          {subject.name}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div style={styles.examScore}>
                  <strong
                    style={{
                      color:
                        getPerformanceColor(
                          result.percentage
                        ),
                    }}
                  >
                    {result.percentage}%
                  </strong>

                  <span>
                    {result.score} /{" "}
                    {result.totalMarks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ATTENTION MESSAGE */}

      {summary.overallAverage < 50 &&
        summary.attemptedCount > 0 && (
          <div style={styles.attentionCard}>
            <div style={styles.attentionIcon}>
              ⚠️
            </div>

            <div>
              <h3>
                Student may need additional support
              </h3>

              <p>
                {student.name}'s current average is{" "}
                {summary.overallAverage}%. Consider
                reviewing their recent exam results
                and identifying topics that need more
                attention.
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f8fc",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f7f8fc",
  },

  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid #ddd",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  topBar: {
    marginBottom: "24px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
  },

  profileCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  profileLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  avatarPlaceholder: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "bold",
  },

  name: {
    margin: 0,
    fontSize: "26px",
    color: "#111827",
  },

  email: {
    margin: "6px 0",
    color: "#6b7280",
  },

  className: {
    margin: 0,
    color: "#374151",
    fontWeight: "600",
  },

  statusBadge: {
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "40px",
  },

  statCard: {
    background: "white",
    borderRadius: "14px",
    padding: "20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },

  statValue: {
    margin: "8px 0 0",
    fontSize: "28px",
    color: "#111827",
  },

  statSmall: {
    margin: "4px 0 0",
    color: "#9ca3af",
    fontSize: "13px",
  },

  section: {
    marginBottom: "40px",
  },

  sectionHeader: {
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },

  examList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  examCard: {
    background: "white",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  examTitle: {
    margin: 0,
    color: "#111827",
  },

  examDate: {
    margin: "6px 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  subjectContainer: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  subjectBadge: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
  },

  examScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
    whiteSpace: "nowrap",
  },

  attentionCard: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    gap: "14px",
    color: "#9a3412",
  },

  attentionIcon: {
    fontSize: "24px",
  },

  

  emptyCard: {
    background: "white",
    borderRadius: "14px",
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  errorCard: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "white",
    padding: "30px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  primaryButton: {
    marginTop: "15px",
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default TeacherStudentPerformance;