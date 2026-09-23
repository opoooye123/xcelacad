import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://xcelacad.onrender.com/api";

const TeacherDashboard = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("xcelToken");

      if (!token) {
        throw new Error("You are not authenticated.");
      }

      const response = await fetch(
        `${API_URL}/schools/${schoolId}/teacher-dashboard`,
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
            `Failed to load teacher dashboard (${response.status})`
        );
      }

      setData(result);
    } catch (error) {
      console.error("Teacher dashboard error:", error);

      setError(
        error.message ||
          "Failed to load teacher dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [schoolId]);

  const groupedStudents = useMemo(() => {
    if (!data?.students) return {};

    return data.students.reduce((groups, membership) => {
      const classId =
        membership.class?._id || "unknown";

      if (!groups[classId]) {
        groups[classId] = {
          classInfo: membership.class,
          students: [],
        };
      }

      groups[classId].students.push(membership);

      return groups;
    }, {});
  }, [data]);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>
          Loading teacher dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>

          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button
            onClick={fetchDashboard}
            style={styles.primaryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const {
    teacher,
    assignments = [],
    summary = {},
    performance = {},
  } = data;

  const studentPerformance =
    performance.students || [];

  const studentsNeedingAttention =
    performance.studentsNeedingAttention || [];

  const classPerformance =
    performance.classes || [];

  const recentExams =
    performance.recentExams || [];

  return (
    <div style={styles.page}>
      {/* ==========================================
          HEADER
      ========================================== */}

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            onClick={() =>
              navigate(`/school/${schoolId}`)
            }
            style={styles.backButton}
          >
            ← School Dashboard
          </button>

          <h1 style={styles.title}>
            Teacher Dashboard
          </h1>

          <p style={styles.subtitle}>
            Welcome back, {teacher.name}
          </p>
        </div>

        <div style={styles.headerRight}>
          <button
            onClick={() =>
              navigate(
                `/school/${schoolId}/exams/create`
              )
            }
            style={styles.createButton}
          >
            + Create School Exam
          </button>

          <button
            onClick={() =>
              navigate(
                `/school/${schoolId}/exams`
              )
            }
            style={styles.secondaryButton}
          >
            My School Exams
          </button>

          {teacher.avatar ? (
            <img
              src={teacher.avatar}
              alt={teacher.name}
              style={styles.avatar}
            />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {teacher.name
                ?.charAt(0)
                ?.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          PERFORMANCE SUMMARY
      ========================================== */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Performance Overview
            </h2>

            <p style={styles.sectionSubtitle}>
              A quick view of your students'
              academic performance
            </p>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <StatCard
            icon="📚"
            label="Assignments"
            value={summary.assignmentCount || 0}
          />

          <StatCard
            icon="🏫"
            label="Classes"
            value={summary.classCount || 0}
          />

          <StatCard
            icon="👨‍🎓"
            label="Students"
            value={summary.studentCount || 0}
          />

          <StatCard
            icon="📝"
            label="School Exams"
            value={summary.examCount || 0}
          />

          <StatCard
            icon="📊"
            label="Attempts"
            value={summary.attemptCount || 0}
          />

          <StatCard
            icon="🎯"
            label="Overall Average"
            value={`${summary.overallAverage || 0}%`}
            highlight
          />
        </div>
      </section>

      {/* ==========================================
          ATTENTION + CLASS PERFORMANCE
      ========================================== */}

      <div style={styles.twoColumnGrid}>
        {/* STUDENTS NEEDING ATTENTION */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Students Needing Attention
              </h2>

              <p style={styles.cardSubtitle}>
                Students currently below 50%
              </p>
            </div>

            <span style={styles.warningBadge}>
              {studentsNeedingAttention.length}
            </span>
          </div>

          {studentsNeedingAttention.length === 0 ? (
            <div style={styles.successEmpty}>
              <div style={styles.successIcon}>
                ✓
              </div>

              <h3>No students flagged</h3>

              <p>
                No assessed students are currently
                below 50%.
              </p>
            </div>
          ) : (
            <div style={styles.performanceList}>
              {studentsNeedingAttention
                .slice(0, 8)
                .map((item) => (
                  <div
                    key={
                      item.student?._id
                    }
                    style={styles.performanceRow}
                  >
                    <div
                      style={
                        styles.performanceStudent
                      }
                    >
                      {item.student?.avatar ? (
                        <img
                          src={item.student.avatar}
                          alt={
                            item.student.name
                          }
                          style={
                            styles.smallAvatar
                          }
                        />
                      ) : (
                        <div
                          style={
                            styles.smallAvatarPlaceholder
                          }
                        >
                          {item.student?.name
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>
                      )}

                      <div>
                        <p
                          style={
                            styles.studentName
                          }
                        >
                          {item.student?.name ||
                            "Unknown Student"}
                        </p>

                        <p
                          style={
                            styles.mutedText
                          }
                        >
                          {item.attempts} exam
                          {item.attempts !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span
                      style={
                        styles.dangerScore
                      }
                    >
                      {item.percentage}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* CLASS PERFORMANCE */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Class Performance
              </h2>

              <p style={styles.cardSubtitle}>
                Average performance by class
              </p>
            </div>
          </div>

          {classPerformance.length === 0 ? (
            <div style={styles.emptySmall}>
              No submitted school exam attempts yet.
            </div>
          ) : (
            <div style={styles.classPerformanceList}>
              {classPerformance.map((item) => (
                <div
                  key={item.class?._id}
                  style={styles.classPerformanceItem}
                >
                  <div style={styles.classInfo}>
                    <strong>
                      {item.class?.name ||
                        "Unknown Class"}
                    </strong>

                    <span>
                      {item.attempts} attempt
                      {item.attempts !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  <div
                    style={
                      styles.progressBackground
                    }
                  >
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(
                          item.percentage || 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div style={styles.classPercentage}>
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ==========================================
          STUDENT PERFORMANCE
      ========================================== */}

      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Student Performance
            </h2>

            <p style={styles.cardSubtitle}>
              Performance across submitted school
              exams
            </p>
          </div>
        </div>

        {studentPerformance.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              📊
            </div>

            <h3>No performance data yet</h3>

            <p>
              Student performance will appear here
              after students submit school exams.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Student
                  </th>

                  <th style={styles.th}>
                    Exams
                  </th>

                  <th style={styles.th}>
                    Score
                  </th>

                  <th style={styles.th}>
                    Average
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {studentPerformance.map(
                  (item) => {
                    const percentage =
                      Number(
                        item.percentage || 0
                      );

                    let status =
                      "Needs attention";

                    let statusStyle =
                      styles.statusDanger;

                    if (percentage >= 75) {
                      status = "Strong";
                      statusStyle =
                        styles.statusSuccess;
                    } else if (
                      percentage >= 50
                    ) {
                      status = "Developing";
                      statusStyle =
                        styles.statusWarning;
                    }

                    return (
                      <tr
                        key={
                          item.student?._id
                        }
                      >
                        <td
                          style={
                            styles.td
                          }
                        >
                          <div
                            style={
                              styles.tableStudent
                            }
                          >
                            {item.student
                              ?.avatar ? (
                              <img
                                src={
                                  item
                                    .student
                                    .avatar
                                }
                                alt={
                                  item
                                    .student
                                    .name
                                }
                                style={
                                  styles.tableAvatar
                                }
                              />
                            ) : (
                              <div
                                style={
                                  styles.tableAvatarPlaceholder
                                }
                              >
                                {item.student?.name
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase()}
                              </div>
                            )}

                            <div>
                              <strong>
                                {item
                                  .student
                                  ?.name ||
                                  "Unknown"}
                              </strong>

                              <span
                                style={
                                  styles.emailText
                                }
                              >
                                {item
                                  .student
                                  ?.email ||
                                  ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {item.attempts}
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {item.totalScore} /{" "}
                          {item.totalMarks}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            fontWeight:
                              "700",
                          }}
                        >
                          {percentage}%
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <span
                            style={
                              statusStyle
                            }
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ==========================================
          RECENT EXAM ACTIVITY
      ========================================== */}

      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Recent Exam Activity
            </h2>

            <p style={styles.cardSubtitle}>
              Latest student submissions
            </p>
          </div>
        </div>

        {recentExams.length === 0 ? (
          <div style={styles.emptySmall}>
            No recent exam activity.
          </div>
        ) : (
          <div style={styles.activityList}>
            {recentExams.map((item) => (
              <div
                key={item.attemptId}
                style={styles.activityRow}
              >
                <div>
                  <strong>
                    {item.student?.name ||
                      "Unknown Student"}
                  </strong>

                  <p style={styles.activityExam}>
                    {item.exam?.title ||
                      "School Exam"}
                  </p>
                </div>

                <div style={styles.activityScore}>
                  <strong>
                    {item.percentage}%
                  </strong>

                  <span>
                    {item.score} /{" "}
                    {item.totalMarks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          ASSIGNMENTS
      ========================================== */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              My Assignments
            </h2>

            <p style={styles.sectionSubtitle}>
              Subjects and classes assigned to you
            </p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              📚
            </div>

            <h3>No teaching assignments yet</h3>

            <p>
              Your school administrator has not
              assigned any subjects or classes to you
              yet.
            </p>
          </div>
        ) : (
          <div style={styles.assignmentGrid}>
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                style={styles.assignmentCard}
              >
                <div style={styles.assignmentIcon}>
                  📖
                </div>

                <div>
                  <h3
                    style={
                      styles.assignmentSubject
                    }
                  >
                    {assignment.subject?.name ||
                      "Unknown Subject"}
                  </h3>

                  <p
                    style={
                      styles.assignmentClass
                    }
                  >
                    {assignment.class?.name ||
                      "Unknown Class"}
                  </p>

                  <p style={styles.session}>
                    Session:{" "}
                    {assignment.academicSession}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          STUDENTS
      ========================================== */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              My Students
            </h2>

            <p style={styles.sectionSubtitle}>
              Students in the classes you teach
            </p>
          </div>
        </div>

        {Object.keys(groupedStudents).length ===
        0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              👨‍🎓
            </div>

            <h3>No students found</h3>

            <p>
              Students will appear here when they
              are added to one of your assigned
              classes.
            </p>
          </div>
        ) : (
          <div style={styles.classSections}>
            {Object.values(groupedStudents).map(
              (group) => (
                <div
                  key={
                    group.classInfo?._id
                  }
                  style={styles.classCard}
                >
                  <div
                    style={
                      styles.classHeader
                    }
                  >
                    <div>
                      <h3>
                        {group.classInfo
                          ?.name ||
                          "Unknown Class"}
                      </h3>

                      <p>
                        {group.classInfo
                          ?.level || ""}

                        {group.classInfo
                          ?.section
                          ? ` • ${group.classInfo.section}`
                          : ""}
                      </p>
                    </div>

                    <span
                      style={
                        styles.studentCount
                      }
                    >
                      {group.students.length}{" "}
                      students
                    </span>
                  </div>

                  <div
                    style={
                      styles.studentList
                    }
                  >
                    {group.students.map(
                      (membership) => (
                        <div
                          key={
                            membership._id
                          }
                          style={
                            styles.studentRow
                          }
                        >
                          {membership.user
                            ?.avatar ? (
                            <img
                              src={
                                membership
                                  .user
                                  .avatar
                              }
                              alt={
                                membership
                                  .user
                                  .name
                              }
                              style={
                                styles.studentAvatar
                              }
                            />
                          ) : (
                            <div
                              style={
                                styles.studentAvatarPlaceholder
                              }
                            >
                              {membership.user?.name
                                ?.charAt(
                                  0
                                )
                                ?.toUpperCase()}
                            </div>
                          )}

                          <div>
                            <p
                              style={
                                styles.studentName
                              }
                            >
                              {membership.user
                                ?.name ||
                                "Unknown Student"}
                            </p>

                            <p
                              style={
                                styles.studentEmail
                              }
                            >
                              {membership.user
                                ?.email ||
                                ""}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
};

/* ==========================================
   STAT CARD
========================================== */

const StatCard = ({
  icon,
  label,
  value,
  highlight = false,
}) => {
  return (
    <div
      style={{
        ...styles.statCard,
        ...(highlight
          ? styles.highlightStatCard
          : {}),
      }}
    >
      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>
        <p style={styles.statLabel}>
          {label}
        </p>

        <h2 style={styles.statValue}>
          {value}
        </h2>
      </div>
    </div>
  );
};

/* ==========================================
   STYLES
========================================== */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f8fc",
    padding: "32px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#111827",
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
    borderTop:
      "4px solid #2563eb",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
  },

  loadingText: {
    color: "#6b7280",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "36px",
    flexWrap: "wrap",
  },

  headerLeft: {
    flex: 1,
    minWidth: "250px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  backButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    marginBottom: "12px",
    cursor: "pointer",
    color: "#2563eb",
    fontSize: "14px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "15px",
  },

  createButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
  },

  secondaryButton: {
    border:
      "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    padding: "10px 15px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
  },

  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  avatarPlaceholder: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    fontWeight: "700",
  },

  section: {
    marginBottom: "38px",
  },

  sectionHeader: {
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
  },

  statCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  highlightStatCard: {
    border:
      "1px solid #bfdbfe",
    background: "#eff6ff",
  },

  statIcon: {
    fontSize: "28px",
  },

  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
  },

  statValue: {
    margin: "5px 0 0",
    fontSize: "27px",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "24px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "19px",
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  warningBadge: {
    minWidth: "30px",
    height: "30px",
    padding: "0 8px",
    borderRadius: "20px",
    background: "#fef3c7",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  performanceList: {
    display: "flex",
    flexDirection: "column",
  },

  performanceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom:
      "1px solid #f1f5f9",
  },

  performanceStudent: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  smallAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  smallAvatarPlaceholder: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  studentName: {
    margin: 0,
    fontWeight: "600",
  },

  mutedText: {
    margin: "3px 0 0",
    color: "#9ca3af",
    fontSize: "12px",
  },

  dangerScore: {
    color: "#dc2626",
    fontWeight: "700",
  },

  successEmpty: {
    textAlign: "center",
    padding: "25px 10px",
  },

  successIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 10px",
    fontWeight: "700",
  },

  emptySmall: {
    padding: "25px 5px",
    color: "#9ca3af",
    textAlign: "center",
    fontSize: "14px",
  },

  classPerformanceList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  classPerformanceItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  classInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },

  progressBackground: {
    width: "100%",
    height: "9px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
  },

  classPercentage: {
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "right",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },

  th: {
    textAlign: "left",
    padding: "13px",
    background: "#f8fafc",
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  td: {
    padding: "14px 13px",
    borderBottom:
      "1px solid #f1f5f9",
    fontSize: "14px",
  },

  tableStudent: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  tableAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  tableAvatarPlaceholder: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  emailText: {
    display: "block",
    color: "#9ca3af",
    fontSize: "11px",
    marginTop: "3px",
  },

  statusSuccess: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "12px",
    fontWeight: "600",
  },

  statusWarning: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "12px",
    fontWeight: "600",
  },

  statusDanger: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "12px",
    fontWeight: "600",
  },

  activityList: {
    display: "flex",
    flexDirection: "column",
  },

  activityRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "15px 0",
    borderBottom:
      "1px solid #f1f5f9",
  },

  activityExam: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  activityScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
  },

  activityScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
  },

  assignmentGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },

  assignmentCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    gap: "14px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  assignmentIcon: {
    fontSize: "26px",
  },

  assignmentSubject: {
    margin: 0,
  },

  assignmentClass: {
    margin: "6px 0",
    color: "#374151",
  },

  session: {
    margin: 0,
    fontSize: "13px",
    color: "#9ca3af",
  },

  classSections: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  classCard: {
    background: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  classHeader: {
    padding: "20px",
    borderBottom:
      "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  studentCount: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "13px",
  },

  studentList: {
    padding: "8px 20px",
  },

  studentRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom:
      "1px solid #f1f1f1",
  },

  studentAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  studentAvatarPlaceholder: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#4b5563",
  },

  studentEmail: {
    margin: "3px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  emptyCard: {
    background: "#fff",
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
    background: "#fff",
    padding: "30px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
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
    margin: "0 auto 12px",
    fontWeight: "700",
    fontSize: "20px",
  },

  primaryButton: {
    marginTop: "15px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default TeacherDashboard;