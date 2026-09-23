import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const TeacherStudentPerformance = () => {
  const { schoolId, studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("xcelToken");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/schools/${schoolId}/teacher-dashboard/students/${studentId}/performance`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load student performance."
          );
        }

        setData(result);
      } catch (err) {
        console.error("Student performance error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [schoolId, studentId, navigate]);

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading student performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <button
          onClick={() =>
            navigate(`/school/${schoolId}/teacher-dashboard`)
          }
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>

        <div style={styles.errorBox}>
          <h2>Unable to load performance</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { student, summary, performance } = data;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <button
            onClick={() =>
              navigate(`/school/${schoolId}/teacher-dashboard`)
            }
            style={styles.backButton}
          >
            ← Back to Dashboard
          </button>

          <h1 style={styles.title}>Student Performance</h1>
          <p style={styles.subtitle}>
            Detailed academic performance and exam history
          </p>
        </div>
      </div>

      {/* STUDENT PROFILE */}
      <div style={styles.profileCard}>
        <div style={styles.avatar}>
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              style={styles.avatarImage}
            />
          ) : (
            student.name?.charAt(0)?.toUpperCase()
          )}
        </div>

        <div>
          <h2 style={styles.studentName}>{student.name}</h2>

          <p style={styles.muted}>
            {student.email}
          </p>

          {student.class && (
            <p style={styles.classText}>
              {student.class.name}
              {student.class.level
                ? ` • ${student.class.level}`
                : ""}
              {student.class.section
                ? ` • ${student.class.section}`
                : ""}
            </p>
          )}
        </div>
      </div>

      {/* SUMMARY */}
      <div style={styles.grid}>
        <SummaryCard
          title="Average Score"
          value={`${summary.averagePercentage}%`}
        />

        <SummaryCard
          title="Exams Taken"
          value={summary.attemptCount}
        />

        <SummaryCard
          title="Total Score"
          value={`${summary.totalScore}/${summary.totalMarks}`}
        />

        <SummaryCard
          title="Exam Count"
          value={summary.examCount}
        />
      </div>

      {/* PERFORMANCE STATUS */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Performance Overview</h2>

        {summary.attemptCount === 0 ? (
          <div style={styles.empty}>
            <h3>No exam results yet</h3>
            <p>
              This student has not completed any assigned school
              exams yet.
            </p>
          </div>
        ) : (
          <div style={styles.overview}>
            <div>
              <p style={styles.label}>Average Performance</p>
              <h2 style={styles.bigNumber}>
                {summary.averagePercentage}%
              </h2>
            </div>

            <div>
              <p style={styles.label}>Best Exam</p>

              <h3>
                {performance.bestExam
                  ? performance.bestExam.title
                  : "—"}
              </h3>

              {performance.bestExam && (
                <p style={styles.muted}>
                  {performance.bestExam.percentage}%
                </p>
              )}
            </div>

            <div>
              <p style={styles.label}>Lowest Exam</p>

              <h3>
                {performance.lowestExam
                  ? performance.lowestExam.title
                  : "—"}
              </h3>

              {performance.lowestExam && (
                <p style={styles.muted}>
                  {performance.lowestExam.percentage}%
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EXAM HISTORY */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Exam History</h2>

        {performance.exams?.length === 0 ? (
          <div style={styles.empty}>
            <p>No completed exams found.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Exam</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Percentage</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>

              <tbody>
                {performance.exams.map((exam) => (
                  <tr key={exam.attemptId}>
                    <td style={styles.td}>
                      <strong>{exam.title}</strong>
                    </td>

                    <td style={styles.td}>
                      {exam.score}/{exam.totalMarks}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={getPercentageStyle(
                          exam.percentage
                        )}
                      >
                        {exam.percentage}%
                      </span>
                    </td>

                    <td style={styles.td}>
                      {getPerformanceLabel(exam.percentage)}
                    </td>

                    <td style={styles.td}>
                      {exam.submittedAt
                        ? new Date(
                            exam.submittedAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SUBJECT PERFORMANCE */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Subject Performance
        </h2>

        {performance.subjects?.length === 0 ? (
          <div style={styles.empty}>
            <p>No subject performance data yet.</p>
          </div>
        ) : (
          <div style={styles.subjectGrid}>
            {performance.subjects.map((subject) => (
              <div
                key={subject.subjectId}
                style={styles.subjectCard}
              >
                <h3>{subject.subjectName}</h3>

                <div style={styles.subjectScore}>
                  {subject.percentage}%
                </div>

                <p style={styles.muted}>
                  {subject.attempts} exam
                  {subject.attempts !== 1 ? "s" : ""}
                </p>

                <div style={styles.progressBackground}>
                  <div
                    style={{
                      ...styles.progress,
                      width: `${Math.min(
                        subject.percentage,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value }) => {
  return (
    <div style={styles.card}>
      <p style={styles.label}>{title}</p>
      <h2 style={styles.cardValue}>{value}</h2>
    </div>
  );
};

const getPerformanceLabel = (percentage) => {
  if (percentage >= 70) return "Strong";
  if (percentage >= 50) return "Average";
  return "Needs Attention";
};

const getPercentageStyle = (percentage) => {
  if (percentage >= 70) {
    return {
      fontWeight: "700",
    };
  }

  if (percentage >= 50) {
    return {
      fontWeight: "700",
    };
  }

  return {
    fontWeight: "700",
  };
};

const styles = {
  page: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  center: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    marginBottom: "25px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "0",
    marginBottom: "15px",
    fontSize: "15px",
  },

  title: {
    margin: "0",
    fontSize: "30px",
  },

  subtitle: {
    color: "#666",
    marginTop: "8px",
  },

  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "24px",
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
    marginBottom: "20px",
    background: "#fff",
  },

  avatar: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eee",
    fontSize: "28px",
    fontWeight: "700",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  studentName: {
    margin: "0 0 5px",
  },

  muted: {
    color: "#777",
    margin: "5px 0",
  },

  classText: {
    margin: "8px 0 0",
    fontWeight: "600",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "25px",
  },

  card: {
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
    padding: "20px",
    background: "#fff",
  },

  label: {
    margin: "0 0 8px",
    color: "#777",
    fontSize: "14px",
  },

  cardValue: {
    margin: "0",
    fontSize: "28px",
  },

  section: {
    marginBottom: "30px",
  },

  sectionTitle: {
    marginBottom: "15px",
  },

  overview: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    padding: "24px",
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
    background: "#fff",
  },

  bigNumber: {
    fontSize: "38px",
    margin: "0",
  },

  empty: {
    padding: "35px",
    border: "1px dashed #ccc",
    borderRadius: "14px",
    textAlign: "center",
    color: "#777",
  },

  errorBox: {
    marginTop: "30px",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid #ddd",
  },

  tableWrapper: {
    overflowX: "auto",
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
    background: "#fff",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "15px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  },

  td: {
    padding: "15px",
    borderBottom: "1px solid #eee",
  },

  subjectGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  subjectCard: {
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
    padding: "20px",
    background: "#fff",
  },

  subjectScore: {
    fontSize: "30px",
    fontWeight: "700",
    margin: "12px 0",
  },

  progressBackground: {
    width: "100%",
    height: "8px",
    background: "#eee",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    background: "#333",
    borderRadius: "10px",
  },
};

export default TeacherStudentPerformance;