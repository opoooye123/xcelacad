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
            result.message ||
              "Failed to load student performance."
          );
        }

        setData(result);
      } catch (err) {
        console.error(
          "Student performance error:",
          err
        );

        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [schoolId, studentId, navigate]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Loading student performance...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div style={styles.page}>
        <button
          onClick={() =>
            navigate(
              `/school/${schoolId}/teacher-dashboard`
            )
          }
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>

        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>!</div>

          <h2>
            Unable to load performance
          </h2>

          <p>{error}</p>

          <button
            onClick={() => window.location.reload()}
            style={styles.retryButton}
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
    performance,
  } = data;

  const subjects =
    performance?.subjects || [];

  const topics =
    performance?.topics || [];

  const weakSubjects =
    performance?.weakSubjects || [];

  const weakTopics =
    performance?.weakTopics || [];

  const exams =
    performance?.exams || [];

  // ==========================================
  // DERIVED STATS
  // ==========================================

  const totalQuestions =
    subjects.reduce(
      (total, subject) =>
        total +
        Number(subject.questions || 0),
      0
    );

  const totalCorrect =
    subjects.reduce(
      (total, subject) =>
        total +
        Number(subject.correct || 0),
      0
    );

  const totalWrong =
    subjects.reduce(
      (total, subject) =>
        total +
        Number(subject.wrong || 0),
      0
    );

  const totalUnanswered =
    subjects.reduce(
      (total, subject) =>
        total +
        Number(subject.unanswered || 0),
      0
    );

  return (
    <div style={styles.page}>

      {/* ======================================
          HEADER
      ====================================== */}

      <div style={styles.header}>
        <div>
          <button
            onClick={() =>
              navigate(
                `/school/${schoolId}/teacher-dashboard`
              )
            }
            style={styles.backButton}
          >
            ← Back to Dashboard
          </button>

          <h1 style={styles.title}>
            Student Performance
          </h1>

          <p style={styles.subtitle}>
            Detailed academic performance,
            subject analysis, and learning
            insights.
          </p>
        </div>
      </div>

      {/* ======================================
          STUDENT PROFILE
      ====================================== */}

      <div style={styles.profileCard}>
        <div style={styles.avatar}>
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              style={styles.avatarImage}
            />
          ) : (
            student.name
              ?.charAt(0)
              ?.toUpperCase()
          )}
        </div>

        <div style={styles.profileInfo}>
          <h2 style={styles.studentName}>
            {student.name}
          </h2>

          <p style={styles.muted}>
            {student.email}
          </p>

          {student.class && (
            <div style={styles.classBadge}>
              {student.class.name}

              {student.class.level
                ? ` • ${student.class.level}`
                : ""}

              {student.class.section
                ? ` • ${student.class.section}`
                : ""}
            </div>
          )}

          {student.class?.academicSession && (
            <p style={styles.sessionText}>
              Academic Session:{" "}
              {student.class.academicSession}
            </p>
          )}
        </div>
      </div>

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div style={styles.summaryGrid}>

        <SummaryCard
          title="Average Score"
          value={`${summary.averagePercentage}%`}
          description="Across completed exams"
        />

        <SummaryCard
          title="Exams Taken"
          value={summary.attemptCount}
          description={`Out of ${summary.examCount} assigned`}
        />

        <SummaryCard
          title="Questions"
          value={totalQuestions}
          description={`${totalCorrect} answered correctly`}
        />

        <SummaryCard
          title="Total Score"
          value={`${summary.totalScore}/${summary.totalMarks}`}
          description="Combined exam score"
        />

      </div>

      {/* ======================================
          QUESTION BREAKDOWN
      ====================================== */}

      {summary.attemptCount > 0 && (
        <div style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Question Breakdown
          </h2>

          <div style={styles.breakdownGrid}>

            <BreakdownCard
              label="Correct"
              value={totalCorrect}
              description="Questions answered correctly"
            />

            <BreakdownCard
              label="Wrong"
              value={totalWrong}
              description="Questions answered incorrectly"
            />

            <BreakdownCard
              label="Unanswered"
              value={totalUnanswered}
              description="Questions left unanswered"
            />

          </div>
        </div>
      )}

      {/* ======================================
          PERFORMANCE OVERVIEW
      ====================================== */}

      <div style={styles.section}>

        <h2 style={styles.sectionTitle}>
          Performance Overview
        </h2>

        {summary.attemptCount === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📊
            </div>

            <h3>
              No exam results yet
            </h3>

            <p>
              This student has not completed
              any assigned school exams yet.
            </p>
          </div>
        ) : (
          <div style={styles.overviewGrid}>

            {/* AVERAGE */}

            <div style={styles.overviewCard}>
              <p style={styles.label}>
                Average Performance
              </p>

              <h2
                style={{
                  ...styles.bigNumber,
                  ...getScoreTextStyle(
                    summary.averagePercentage
                  ),
                }}
              >
                {summary.averagePercentage}%
              </h2>

              <p style={styles.performanceLabel}>
                {getPerformanceLabel(
                  summary.averagePercentage
                )}
              </p>
            </div>

            {/* BEST EXAM */}

            <div style={styles.overviewCard}>
              <p style={styles.label}>
                Best Exam
              </p>

              {performance.bestExam ? (
                <>
                  <h3 style={styles.examName}>
                    {performance.bestExam.exam?.title ||
                      performance.bestExam.title}
                  </h3>

                  <div
                    style={{
                      ...styles.examPercentage,
                      ...getScoreTextStyle(
                        performance.bestExam
                          .percentage
                      ),
                    }}
                  >
                    {performance.bestExam.percentage}%
                  </div>
                </>
              ) : (
                <p style={styles.muted}>
                  —
                </p>
              )}
            </div>

            {/* LOWEST EXAM */}

            <div style={styles.overviewCard}>
              <p style={styles.label}>
                Lowest Exam
              </p>

              {performance.lowestExam ? (
                <>
                  <h3 style={styles.examName}>
                    {performance.lowestExam.exam?.title ||
                      performance.lowestExam.title}
                  </h3>

                  <div
                    style={{
                      ...styles.examPercentage,
                      ...getScoreTextStyle(
                        performance.lowestExam
                          .percentage
                      ),
                    }}
                  >
                    {performance.lowestExam.percentage}%
                  </div>
                </>
              ) : (
                <p style={styles.muted}>
                  —
                </p>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ======================================
          NEEDS ATTENTION
      ====================================== */}

      {summary.attemptCount > 0 &&
        (weakSubjects.length > 0 ||
          weakTopics.length > 0) && (
          <div style={styles.section}>

            <div style={styles.attentionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Needs Attention
                </h2>

                <p style={styles.sectionDescription}>
                  Areas where the student may
                  benefit from additional practice.
                </p>
              </div>
            </div>

            <div style={styles.attentionGrid}>

              {/* WEAK SUBJECTS */}

              <div style={styles.attentionCard}>
                <div style={styles.attentionCardHeader}>
                  <h3>
                    Subjects
                  </h3>

                  <span style={styles.attentionCount}>
                    {weakSubjects.length}
                  </span>
                </div>

                {weakSubjects.length === 0 ? (
                  <p style={styles.successText}>
                    No subjects currently need
                    attention.
                  </p>
                ) : (
                  <div style={styles.attentionList}>
                    {weakSubjects.map(
                      (item) => (
                        <div
                          key={
                            item.subject?.id
                          }
                          style={
                            styles.attentionItem
                          }
                        >
                          <div>
                            <strong>
                              {
                                item.subject
                                  ?.name
                              }
                            </strong>

                            <p
                              style={
                                styles.smallMuted
                              }
                            >
                              {item.correct}/
                              {item.questions}{" "}
                              correct
                            </p>
                          </div>

                          <span
                            style={{
                              ...styles.scoreBadge,
                              ...getScoreBadgeStyle(
                                item.percentage
                              ),
                            }}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* WEAK TOPICS */}

              <div style={styles.attentionCard}>
                <div style={styles.attentionCardHeader}>
                  <h3>
                    Topics
                  </h3>

                  <span style={styles.attentionCount}>
                    {weakTopics.length}
                  </span>
                </div>

                {weakTopics.length === 0 ? (
                  <p style={styles.successText}>
                    No topics currently need
                    attention.
                  </p>
                ) : (
                  <div style={styles.attentionList}>
                    {weakTopics.map(
                      (item) => (
                        <div
                          key={
                            item.topic?.id
                          }
                          style={
                            styles.attentionItem
                          }
                        >
                          <div>
                            <strong>
                              {
                                item.topic
                                  ?.name
                              }
                            </strong>

                            <p
                              style={
                                styles.smallMuted
                              }
                            >
                              {item.subject?.name ||
                                "Subject"}{" "}
                              •{" "}
                              {item.correct}/
                              {item.questions}{" "}
                              correct
                            </p>
                          </div>

                          <span
                            style={{
                              ...styles.scoreBadge,
                              ...getScoreBadgeStyle(
                                item.percentage
                              ),
                            }}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      {/* ======================================
          SUBJECT PERFORMANCE
      ====================================== */}

      <div style={styles.section}>

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Subject Performance
            </h2>

            <p style={styles.sectionDescription}>
              Performance calculated from the
              actual questions answered.
            </p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div style={styles.empty}>
            <p>
              No subject performance data yet.
            </p>
          </div>
        ) : (
          <div style={styles.subjectGrid}>

            {subjects.map((subject) => (
              <div
                key={subject.subject?.id}
                style={styles.subjectCard}
              >

                <div style={styles.subjectHeader}>
                  <div>
                    <h3 style={styles.subjectName}>
                      {subject.subject?.name ||
                        "Unknown Subject"}
                    </h3>

                    <p style={styles.smallMuted}>
                      {subject.questions} question
                      {subject.questions !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  <div
                    style={{
                      ...styles.subjectScore,
                      ...getScoreTextStyle(
                        subject.percentage
                      ),
                    }}
                  >
                    {subject.percentage}%
                  </div>
                </div>

                <div
                  style={
                    styles.progressBackground
                  }
                >
                  <div
                    style={{
                      ...styles.progress,
                      width: `${Math.min(
                        Math.max(
                          Number(
                            subject.percentage ||
                              0
                          ),
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div style={styles.subjectStats}>

                  <span>
                    <strong>
                      {subject.correct}
                    </strong>{" "}
                    Correct
                  </span>

                  <span>
                    <strong>
                      {subject.wrong}
                    </strong>{" "}
                    Wrong
                  </span>

                  <span>
                    <strong>
                      {subject.unanswered}
                    </strong>{" "}
                    Unanswered
                  </span>

                </div>

                <div style={styles.subjectFooter}>
                  <span
                    style={styles.performanceBadge}
                  >
                    {getPerformanceLabel(
                      subject.percentage
                    )}
                  </span>

                  <span style={styles.smallMuted}>
                    {subject.totalScore}/
                    {subject.totalMarks} marks
                  </span>
                </div>

              </div>
            ))}

          </div>
        )}
      </div>

      {/* ======================================
          TOPIC PERFORMANCE
      ====================================== */}

      <div style={styles.section}>

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Topic Performance
            </h2>

            <p style={styles.sectionDescription}>
              Detailed breakdown of the topics
              covered in completed exams.
            </p>
          </div>
        </div>

        {topics.length === 0 ? (
          <div style={styles.empty}>
            <p>
              No topic performance data yet.
            </p>
          </div>
        ) : (
          <div style={styles.topicList}>

            {topics.map((topic) => (
              <div
                key={topic.topic?.id}
                style={styles.topicRow}
              >

                <div style={styles.topicInfo}>
                  <strong>
                    {topic.topic?.name ||
                      "Unknown Topic"}
                  </strong>

                  <span style={styles.smallMuted}>
                    {topic.subject?.name ||
                      "Unknown Subject"}
                  </span>
                </div>

                <div style={styles.topicMiddle}>

                  <div
                    style={
                      styles.progressBackground
                    }
                  >
                    <div
                      style={{
                        ...styles.progress,
                        width: `${Math.min(
                          Math.max(
                            Number(
                              topic.percentage ||
                                0
                            ),
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div
                    style={styles.topicStats}
                  >
                    {topic.correct} correct •{" "}
                    {topic.wrong} wrong •{" "}
                    {topic.unanswered} unanswered
                  </div>

                </div>

                <div
                  style={{
                    ...styles.topicPercentage,
                    ...getScoreTextStyle(
                      topic.percentage
                    ),
                  }}
                >
                  {topic.percentage}%
                </div>

              </div>
            ))}

          </div>
        )}
      </div>

      {/* ======================================
          EXAM HISTORY
      ====================================== */}

      <div style={styles.section}>

        <h2 style={styles.sectionTitle}>
          Exam History
        </h2>

        {exams.length === 0 ? (
          <div style={styles.empty}>
            <p>
              No completed exams found.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>

              <thead>
                <tr>
                  <th style={styles.th}>
                    Exam
                  </th>

                  <th style={styles.th}>
                    Type
                  </th>

                  <th style={styles.th}>
                    Score
                  </th>

                  <th style={styles.th}>
                    Percentage
                  </th>

                  <th style={styles.th}>
                    Performance
                  </th>

                  <th style={styles.th}>
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {exams.map((exam) => (
                  <tr
                    key={exam.attemptId}
                    style={styles.tableRow}
                  >

                    <td style={styles.td}>
                      <strong>
                        {exam.exam?.title ||
                          exam.title ||
                          "Untitled Exam"}
                      </strong>
                    </td>

                    <td style={styles.td}>
                      {exam.exam?.examType ||
                        "—"}
                    </td>

                    <td style={styles.td}>
                      {exam.score}/
                      {exam.totalMarks}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.scoreBadge,
                          ...getScoreBadgeStyle(
                            exam.percentage
                          ),
                        }}
                      >
                        {exam.percentage}%
                      </span>
                    </td>

                    <td style={styles.td}>
                      {getPerformanceLabel(
                        exam.percentage
                      )}
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

    </div>
  );
};

// ==========================================
// SUMMARY CARD
// ==========================================

const SummaryCard = ({
  title,
  value,
  description,
}) => {
  return (
    <div style={styles.summaryCard}>
      <p style={styles.label}>
        {title}
      </p>

      <h2 style={styles.cardValue}>
        {value}
      </h2>

      <p style={styles.cardDescription}>
        {description}
      </p>
    </div>
  );
};

// ==========================================
// BREAKDOWN CARD
// ==========================================

const BreakdownCard = ({
  label,
  value,
  description,
}) => {
  return (
    <div style={styles.breakdownCard}>
      <div style={styles.breakdownNumber}>
        {value}
      </div>

      <div>
        <strong>
          {label}
        </strong>

        <p style={styles.smallMuted}>
          {description}
        </p>
      </div>
    </div>
  );
};

// ==========================================
// PERFORMANCE LABEL
// ==========================================

const getPerformanceLabel = (
  percentage
) => {
  const score = Number(
    percentage || 0
  );

  if (score >= 70) {
    return "Strong";
  }

  if (score >= 50) {
    return "Average";
  }

  return "Needs Attention";
};

// ==========================================
// SCORE TEXT STYLE
// ==========================================

const getScoreTextStyle = (
  percentage
) => {
  const score = Number(
    percentage || 0
  );

  if (score >= 70) {
    return {
      color: "#16803c",
    };
  }

  if (score >= 50) {
    return {
      color: "#9a6700",
    };
  }

  return {
    color: "#c62828",
  };
};

// ==========================================
// SCORE BADGE STYLE
// ==========================================

const getScoreBadgeStyle = (
  percentage
) => {
  const score = Number(
    percentage || 0
  );

  if (score >= 70) {
    return {
      background: "#e8f5e9",
      color: "#16803c",
    };
  }

  if (score >= 50) {
    return {
      background: "#fff8e1",
      color: "#9a6700",
    };
  }

  return {
    background: "#ffebee",
    color: "#c62828",
  };
};

// ==========================================
// STYLES
// ==========================================

const styles = {
  page: {
    padding: "30px",
    maxWidth: "1250px",
    margin: "0 auto",
    background: "#f8f9fb",
    minHeight: "100vh",
  },

  center: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingBox: {
    textAlign: "center",
    color: "#666",
  },

  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid #e5e5e5",
    borderTop: "3px solid #333",
    borderRadius: "50%",
    margin: "0 auto 15px",
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
    color: "#444",
  },

  title: {
    margin: "0",
    fontSize: "30px",
    fontWeight: "700",
  },

  subtitle: {
    color: "#666",
    marginTop: "8px",
    marginBottom: "0",
  },

  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "24px",
    border: "1px solid #e5e5e5",
    borderRadius: "16px",
    marginBottom: "20px",
    background: "#fff",
  },

  avatar: {
    width: "72px",
    height: "72px",
    minWidth: "72px",
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

  profileInfo: {
    minWidth: 0,
  },

  studentName: {
    margin: "0 0 5px",
    fontSize: "23px",
  },

  muted: {
    color: "#777",
    margin: "5px 0",
  },

  classBadge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "6px 10px",
    borderRadius: "8px",
    background: "#f1f3f5",
    fontSize: "13px",
    fontWeight: "600",
  },

  sessionText: {
    margin: "8px 0 0",
    color: "#777",
    fontSize: "13px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
    marginBottom: "25px",
  },

  summaryCard: {
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

  cardDescription: {
    margin: "8px 0 0",
    color: "#888",
    fontSize: "13px",
  },

  section: {
    marginBottom: "30px",
  },

  sectionHeader: {
    marginBottom: "15px",
  },

  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "21px",
  },

  sectionDescription: {
    margin: "0",
    color: "#777",
    fontSize: "14px",
  },

  breakdownGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  breakdownCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
  },

  breakdownNumber: {
    fontSize: "30px",
    fontWeight: "700",
  },

  smallMuted: {
    margin: "4px 0 0",
    color: "#888",
    fontSize: "12px",
  },

  overviewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  overviewCard: {
    padding: "24px",
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
    background: "#fff",
  },

  bigNumber: {
    fontSize: "40px",
    margin: "0",
  },

  performanceLabel: {
    margin: "8px 0 0",
    fontWeight: "600",
  },

  examName: {
    margin: "8px 0",
    lineHeight: "1.4",
  },

  examPercentage: {
    fontSize: "27px",
    fontWeight: "700",
  },

  attentionHeader: {
    marginBottom: "15px",
  },

  attentionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },

  attentionCard: {
    padding: "20px",
    border: "1px solid #f0d7d7",
    borderRadius: "14px",
    background: "#fffafa",
  },

  attentionCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  attentionCardTitle: {
    margin: 0,
  },

  attentionCount: {
    minWidth: "28px",
    height: "28px",
    padding: "0 8px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffebee",
    color: "#c62828",
    fontWeight: "700",
    fontSize: "13px",
  },

  attentionList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  attentionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "12px",
    borderRadius: "10px",
    background: "#fff",
    border: "1px solid #eee",
  },

  successText: {
    color: "#16803c",
    margin: 0,
  },

  scoreBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px 9px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  subjectGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },

  subjectCard: {
    border: "1px solid #e5e5e5",
    borderRadius: "14px",
    padding: "20px",
    background: "#fff",
  },

  subjectHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  subjectName: {
    margin: "0",
    fontSize: "17px",
  },

  subjectScore: {
    fontSize: "27px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  progressBackground: {
    width: "100%",
    height: "8px",
    background: "#eee",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "15px",
  },

  progress: {
    height: "100%",
    background: "#333",
    borderRadius: "10px",
    transition: "width 0.3s ease",
  },

  subjectStats: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "16px",
    fontSize: "12px",
    color: "#777",
  },

  subjectFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #eee",
  },

  performanceBadge: {
    fontSize: "12px",
    fontWeight: "600",
  },

  topicList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  topicRow: {
    display: "grid",
    gridTemplateColumns:
      "220px 1fr 70px",
    alignItems: "center",
    gap: "20px",
    padding: "16px 18px",
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: "12px",
  },

  topicInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  topicMiddle: {
    minWidth: 0,
  },

  topicStats: {
    marginTop: "7px",
    color: "#888",
    fontSize: "12px",
  },

  topicPercentage: {
    fontSize: "18px",
    fontWeight: "700",
    textAlign: "right",
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
    minWidth: "700px",
  },

  th: {
    textAlign: "left",
    padding: "15px",
    borderBottom: "1px solid #eee",
    fontSize: "13px",
    color: "#666",
    background: "#fafafa",
  },

  td: {
    padding: "15px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  },

  tableRow: {
    background: "#fff",
  },

  empty: {
    padding: "40px",
    border: "1px dashed #ccc",
    borderRadius: "14px",
    textAlign: "center",
    color: "#777",
    background: "#fff",
  },

  emptyIcon: {
    fontSize: "30px",
    marginBottom: "10px",
  },

  errorBox: {
    marginTop: "30px",
    padding: "30px",
    borderRadius: "14px",
    border: "1px solid #e5e5e5",
    background: "#fff",
    textAlign: "center",
  },

  errorIcon: {
    width: "40px",
    height: "40px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffebee",
    color: "#c62828",
    fontWeight: "700",
    fontSize: "20px",
  },

  retryButton: {
    marginTop: "15px",
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
  },
};

export default TeacherStudentPerformance;