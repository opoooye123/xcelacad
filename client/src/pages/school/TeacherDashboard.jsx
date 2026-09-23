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
        error.message || "Failed to load teacher dashboard."
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

          <h2 style={styles.errorTitle}>
            Unable to load dashboard
          </h2>

          <p style={styles.errorText}>{error}</p>

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

  const performanceData = {
    students: performance.students || [],
    studentsNeedingAttention:
      performance.studentsNeedingAttention || [],
    classes: performance.classes || [],
    recentExams: performance.recentExams || [],
  };

  return (
    <div style={styles.page}>
      {/* ==========================================
          HEADER
      ========================================== */}
      <header style={styles.header}>
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
            Welcome back,{" "}
            <strong>{teacher.name}</strong>
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
      </header>

      {/* ==========================================
          SUMMARY CARDS
      ========================================== */}
      <section style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              ...styles.blueIcon,
            }}
          >
            📚
          </div>

          <div>
            <p style={styles.statLabel}>
              Assignments
            </p>

            <h2 style={styles.statValue}>
              {summary.assignmentCount || 0}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              ...styles.purpleIcon,
            }}
          >
            🏫
          </div>

          <div>
            <p style={styles.statLabel}>
              Classes
            </p>

            <h2 style={styles.statValue}>
              {summary.classCount || 0}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              ...styles.greenIcon,
            }}
          >
            👨‍🎓
          </div>

          <div>
            <p style={styles.statLabel}>
              Students
            </p>

            <h2 style={styles.statValue}>
              {summary.studentCount || 0}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              ...styles.orangeIcon,
            }}
          >
            📝
          </div>

          <div>
            <p style={styles.statLabel}>
              School Exams
            </p>

            <h2 style={styles.statValue}>
              {summary.examCount || 0}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              ...styles.redIcon,
            }}
          >
            📊
          </div>

          <div>
            <p style={styles.statLabel}>
              Completed Attempts
            </p>

            <h2 style={styles.statValue}>
              {summary.attemptCount || 0}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              ...styles.tealIcon,
            }}
          >
            🎯
          </div>

          <div>
            <p style={styles.statLabel}>
              Average Performance
            </p>

            <h2 style={styles.statValue}>
              {summary.overallAverage || 0}%
            </h2>
          </div>
        </div>
      </section>

      {/* ==========================================
          PERFORMANCE OVERVIEW
      ========================================== */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Performance Overview
            </h2>

            <p style={styles.sectionSubtitle}>
              Monitor how your students are performing
              in school exams.
            </p>
          </div>
        </div>

        <div style={styles.performanceGrid}>
          {/* CLASS PERFORMANCE */}
          <div style={styles.performanceCard}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.performanceTitle}>
                  Class Performance
                </h3>

                <p style={styles.cardDescription}>
                  Average performance across your
                  assigned classes
                </p>
              </div>

              <div style={styles.cardIcon}>
                📈
              </div>
            </div>

            {performanceData.classes.length ===
            0 ? (
              <div style={styles.noData}>
                <div style={styles.noDataIcon}>
                  📊
                </div>

                <p>
                  No exam performance available yet.
                </p>
              </div>
            ) : (
              <div style={styles.performanceList}>
                {performanceData.classes.map(
                  (item) => (
                    <div
                      key={item.class?._id}
                      style={styles.classPerformanceItem}
                    >
                      <div
                        style={styles.performanceInfo}
                      >
                        <p
                          style={
                            styles.performanceName
                          }
                        >
                          {item.class?.name ||
                            "Unknown Class"}
                        </p>

                        <p
                          style={
                            styles.performanceMeta
                          }
                        >
                          {item.attempts || 0} exam
                          {item.attempts === 1
                            ? ""
                            : "s"} attempted
                        </p>
                      </div>

                      <div
                        style={
                          styles.percentageContainer
                        }
                      >
                        <strong
                          style={
                            styles.performancePercentage
                          }
                        >
                          {item.percentage || 0}%
                        </strong>

                        <div
                          style={
                            styles.progressTrack
                          }
                        >
                          <div
                            style={{
                              ...styles.progressBar,
                              width: `${Math.min(
                                item.percentage || 0,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* STUDENTS NEEDING ATTENTION */}
          <div style={styles.performanceCard}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.performanceTitle}>
                  Students Needing Attention
                </h3>

                <p style={styles.cardDescription}>
                  Students currently below 50%
                  average
                </p>
              </div>

              <div style={styles.cardIcon}>
                ⚠️
              </div>
            </div>

            {performanceData.studentsNeedingAttention
              .length === 0 ? (
              <div style={styles.goodState}>
                <div style={styles.goodIcon}>
                  ✓
                </div>

                <h4 style={styles.goodTitle}>
                  No students flagged
                </h4>

                <p style={styles.goodText}>
                  No students are currently below
                  the 50% performance threshold.
                </p>
              </div>
            ) : (
              <div style={styles.performanceList}>
                {performanceData.studentsNeedingAttention
                  .slice(0, 8)
                  .map((item) => (
                    <div
                      key={item.student?._id}
                      style={styles.attentionRow}
                    >
                      <div
                        style={
                          styles.studentPerformanceInfo
                        }
                      >
                        {item.student?.avatar ? (
                          <img
                            src={item.student.avatar}
                            alt={item.student.name}
                            style={
                              styles.smallStudentAvatar
                            }
                          />
                        ) : (
                          <div
                            style={
                              styles.smallStudentAvatarPlaceholder
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
                              styles.performanceName
                            }
                          >
                            {item.student?.name ||
                              "Unknown Student"}
                          </p>

                          <p
                            style={
                              styles.performanceMeta
                            }
                          >
                            {item.attempts || 0} exam
                            {item.attempts === 1
                              ? ""
                              : "s"}
                          </p>
                        </div>
                      </div>

                      <span
                        style={
                          styles.warningPercentage
                        }
                      >
                        {item.percentage || 0}%
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          RECENT EXAM ACTIVITY
      ========================================== */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Recent Exam Activity
            </h2>

            <p style={styles.sectionSubtitle}>
              Latest submissions from your students.
            </p>
          </div>

          {performanceData.recentExams.length >
            0 && (
            <button
              onClick={() =>
                navigate(
                  `/school/${schoolId}/exams`
                )
              }
              style={styles.viewButton}
            >
              View Exams →
            </button>
          )}
        </div>

        {performanceData.recentExams.length ===
        0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              📝
            </div>

            <h3 style={styles.emptyTitle}>
              No exam activity yet
            </h3>

            <p>
              Student exam submissions will appear
              here once they complete school exams.
            </p>
          </div>
        ) : (
          <div style={styles.activityCard}>
            {performanceData.recentExams.map(
              (item) => (
                <div
                  key={item.attemptId}
                  style={styles.activityRow}
                >
                  <div
                    style={styles.activityStudent}
                  >
                    {item.student?.avatar ? (
                      <img
                        src={item.student.avatar}
                        alt={item.student.name}
                        style={
                          styles.activityAvatar
                        }
                      />
                    ) : (
                      <div
                        style={
                          styles.activityAvatarPlaceholder
                        }
                      >
                        {item.student?.name
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p
                        style={styles.studentName}
                      >
                        {item.student?.name ||
                          "Unknown Student"}
                      </p>

                      <p
                        style={styles.examName}
                      >
                        {item.exam?.title ||
                          "School Exam"}
                      </p>
                    </div>
                  </div>

                  <div
                    style={styles.activityClass}
                  >
                    {item.exam?.schoolClass
                      ?.name || "Class"}
                  </div>

                  <div
                    style={styles.activityScore}
                  >
                    <strong>
                      {item.score || 0}/
                      {item.totalMarks || 0}
                    </strong>

                    <span
                      style={
                        item.percentage < 50
                          ? styles.scoreWarning
                          : styles.scoreGood
                      }
                    >
                      {item.percentage || 0}%
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ==========================================
          MY ASSIGNMENTS
      ========================================== */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              My Assignments
            </h2>

            <p style={styles.sectionSubtitle}>
              Subjects and classes assigned to you.
            </p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              📚
            </div>

            <h3 style={styles.emptyTitle}>
              No teaching assignments yet
            </h3>

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
                    {assignment.academicSession ||
                      assignment.class
                        ?.academicSession ||
                      "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          MY STUDENTS
      ========================================== */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              My Students
            </h2>

            <p style={styles.sectionSubtitle}>
              Students in the classes you teach.
            </p>
          </div>
        </div>

        {Object.keys(groupedStudents).length ===
        0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              👨‍🎓
            </div>

            <h3 style={styles.emptyTitle}>
              No students found
            </h3>

            <p>
              Students will appear here when they are
              added to one of your assigned classes.
            </p>
          </div>
        ) : (
          <div style={styles.classSections}>
            {Object.values(groupedStudents).map(
              (group) => (
                <div
                  key={group.classInfo?._id}
                  style={styles.classCard}
                >
                  <div style={styles.classHeader}>
                    <div>
                      <h3
                        style={styles.classTitle}
                      >
                        {group.classInfo?.name ||
                          "Unknown Class"}
                      </h3>

                      <p
                        style={styles.classSubtitle}
                      >
                        {group.classInfo?.level ||
                          ""}

                        {group.classInfo?.section
                          ? ` • ${group.classInfo.section}`
                          : ""}
                      </p>
                    </div>

                    <span
                      style={styles.studentCount}
                    >
                      {group.students.length}{" "}
                      {group.students.length === 1
                        ? "student"
                        : "students"}
                    </span>
                  </div>

                  <div style={styles.studentList}>
                    {group.students.map(
                      (membership) => (
                        <div
                          key={membership._id}
                          style={
                            styles.studentRow
                          }
                        >
                          {membership.user
                            ?.avatar ? (
                            <img
                              src={
                                membership.user.avatar
                              }
                              alt={
                                membership.user.name
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
                                ?.email || ""}
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
    width: "38px",
    height: "38px",
    border: "4px solid #e5e7eb",
    borderTop:
      "4px solid #2563eb",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
  },

  loadingText: {
    marginTop: "14px",
    color: "#6b7280",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    marginBottom: "32px",
    flexWrap: "wrap",
  },

  headerLeft: {
    flex: 1,
    minWidth: "260px",
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
    marginBottom: "10px",
    cursor: "pointer",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "600",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.2,
    color: "#111827",
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#6b7280",
    fontSize: "15px",
  },

  createButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "11px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },

  secondaryButton: {
    border: "1px solid #d1d5db",
    background: "white",
    color: "#374151",
    padding: "10px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },

  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid white",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",
  },

  avatarPlaceholder: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    fontWeight: "bold",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginBottom: "42px",
  },

  statCard: {
    background: "white",
    borderRadius: "14px",
    padding: "19px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.045)",
    border: "1px solid #f0f1f5",
  },

  statIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  blueIcon: {
    background: "#eff6ff",
  },

  purpleIcon: {
    background: "#f5f3ff",
  },

  greenIcon: {
    background: "#ecfdf5",
  },

  orangeIcon: {
    background: "#fff7ed",
  },

  redIcon: {
    background: "#fef2f2",
  },

  tealIcon: {
    background: "#f0fdfa",
  },

  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
  },

  statValue: {
    margin: "5px 0 0",
    color: "#111827",
    fontSize: "26px",
  },

  section: {
    marginBottom: "42px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
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
    fontSize: "14px",
  },

  performanceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },

  performanceCard: {
    background: "white",
    borderRadius: "16px",
    padding: "22px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.045)",
    border: "1px solid #f0f1f5",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "16px",
  },

  performanceTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#111827",
  },

  cardDescription: {
    margin: "5px 0 0",
    color: "#9ca3af",
    fontSize: "13px",
  },

  cardIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
  },

  performanceList: {
    display: "flex",
    flexDirection: "column",
  },

  classPerformanceItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "14px 0",
    borderBottom:
      "1px solid #f1f1f1",
  },

  performanceInfo: {
    minWidth: 0,
  },

  performanceName: {
    margin: 0,
    fontWeight: "600",
    color: "#111827",
    fontSize: "14px",
  },

  performanceMeta: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#9ca3af",
  },

  percentageContainer: {
    width: "100px",
    flexShrink: 0,
  },

  performancePercentage: {
    display: "block",
    textAlign: "right",
    fontSize: "15px",
    color: "#2563eb",
    marginBottom: "5px",
  },

  progressTrack: {
    width: "100%",
    height: "5px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "10px",
  },

  attentionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "12px 0",
    borderBottom:
      "1px solid #f1f1f1",
  },

  studentPerformanceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  smallStudentAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  smallStudentAvatarPlaceholder: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#4b5563",
    fontSize: "13px",
    flexShrink: 0,
  },

  warningPercentage: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#dc2626",
    flexShrink: 0,
  },

  goodState: {
    padding: "25px 10px 10px",
    textAlign: "center",
    color: "#6b7280",
  },

  goodIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 10px",
    fontSize: "23px",
    fontWeight: "bold",
  },

  goodTitle: {
    margin: "0 0 5px",
    color: "#166534",
    fontSize: "15px",
  },

  goodText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
  },

  noData: {
    padding: "28px 10px",
    textAlign: "center",
    color: "#9ca3af",
  },

  noDataIcon: {
    fontSize: "30px",
    marginBottom: "8px",
  },

  viewButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },

  activityCard: {
    background: "white",
    borderRadius: "16px",
    padding: "6px 20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.045)",
    border: "1px solid #f0f1f5",
  },

  activityRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(220px, 1fr) 150px 100px",
    alignItems: "center",
    gap: "20px",
    padding: "15px 0",
    borderBottom:
      "1px solid #f1f1f1",
  },

  activityStudent: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    minWidth: 0,
  },

  activityAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  activityAvatarPlaceholder: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#4b5563",
    flexShrink: 0,
  },

  studentName: {
    margin: 0,
    fontWeight: "600",
    color: "#111827",
    fontSize: "14px",
  },

  examName: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  activityClass: {
    color: "#6b7280",
    fontSize: "13px",
  },

  activityScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
    color: "#111827",
    fontSize: "14px",
  },

  scoreGood: {
    color: "#16a34a",
    fontWeight: "600",
  },

  scoreWarning: {
    color: "#dc2626",
    fontWeight: "600",
  },

  assignmentGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },

  assignmentCard: {
    background: "white",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    gap: "14px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.045)",
    border: "1px solid #f0f1f5",
  },

  assignmentIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "11px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    flexShrink: 0,
  },

  assignmentSubject: {
    margin: 0,
    color: "#111827",
    fontSize: "16px",
  },

  assignmentClass: {
    margin: "6px 0",
    color: "#374151",
    fontSize: "14px",
  },

  session: {
    margin: 0,
    fontSize: "12px",
    color: "#9ca3af",
  },

  classSections: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  classCard: {
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.045)",
    border: "1px solid #f0f1f5",
  },

  classHeader: {
    padding: "20px",
    borderBottom:
      "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
  },

  classTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#111827",
  },

  classSubtitle: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  studentCount: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "6px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  studentList: {
    padding: "5px 20px",
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
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  studentAvatarPlaceholder: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#4b5563",
    flexShrink: 0,
  },

  emptyCard: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
    border: "1px solid #f0f1f5",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.035)",
  },

  emptyIcon: {
    fontSize: "38px",
    marginBottom: "10px",
  },

  emptyTitle: {
    margin: "0 0 8px",
    color: "#111827",
    fontSize: "17px",
  },

  errorCard: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "white",
    padding: "35px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
  },

  errorIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    fontWeight: "bold",
    fontSize: "22px",
  },

  errorTitle: {
    margin: 0,
    color: "#111827",
  },

  errorText: {
    color: "#6b7280",
    margin: "10px 0 0",
    lineHeight: 1.5,
  },

  primaryButton: {
    marginTop: "18px",
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default TeacherDashboard;

