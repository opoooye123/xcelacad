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
      const classId = membership.class?._id || "unknown";

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
        <p>Loading teacher dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
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

  const { teacher, assignments, summary } = data;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
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
            Welcome, {teacher.name}
          </p>
        </div>
        <button
  onClick={() =>
    navigate(
      `/school/${schoolId}/exams/create`
    )
  }
  className="rounded-lg bg-blue-600 px-4 py-2 text-white"
>
  Create School Exam
</button>
<button
  onClick={() =>
    navigate(
      `/school/${schoolId}/exams`
    )
  }
  className="rounded-lg border px-4 py-2"
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
            {teacher.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📚</div>
          <div>
            <p style={styles.statLabel}>Assignments</p>
            <h2 style={styles.statValue}>
              {summary.assignmentCount}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏫</div>
          <div>
            <p style={styles.statLabel}>Classes</p>
            <h2 style={styles.statValue}>
              {summary.classCount}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>👨‍🎓</div>
          <div>
            <p style={styles.statLabel}>Students</p>
            <h2 style={styles.statValue}>
              {summary.studentCount}
            </h2>
          </div>
        </div>
      </div>

      {/* ASSIGNMENTS */}
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
            <div style={styles.emptyIcon}>📚</div>

            <h3>No teaching assignments yet</h3>

            <p>
              Your school administrator has not assigned
              any subjects or classes to you yet.
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
                  <h3 style={styles.assignmentSubject}>
                    {assignment.subject?.name ||
                      "Unknown Subject"}
                  </h3>

                  <p style={styles.assignmentClass}>
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

      {/* STUDENTS */}
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

        {Object.keys(groupedStudents).length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>👨‍🎓</div>

            <h3>No students found</h3>

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
                      <h3>
                        {group.classInfo?.name ||
                          "Unknown Class"}
                      </h3>

                      <p>
                        {group.classInfo?.level || ""}
                        {group.classInfo?.section
                          ? ` • ${group.classInfo.section}`
                          : ""}
                      </p>
                    </div>

                    <span style={styles.studentCount}>
                      {group.students.length} students
                    </span>
                  </div>

                  <div style={styles.studentList}>
                    {group.students.map(
                      (membership) => (
                        <div
                          key={membership._id}
                          style={styles.studentRow}
                        >
                          {membership.user?.avatar ? (
                            <img
                              src={membership.user.avatar}
                              alt={membership.user.name}
                              style={styles.studentAvatar}
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
                            <p style={styles.studentName}>
                              {membership.user?.name ||
                                "Unknown Student"}
                            </p>

                            <p style={styles.studentEmail}>
                              {membership.user?.email ||
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

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
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
    color: "#111827",
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
  },

  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  avatarPlaceholder: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "bold",
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
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },

  statIcon: {
    fontSize: "28px",
  },

  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },

  statValue: {
    margin: "4px 0 0",
    color: "#111827",
    fontSize: "28px",
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
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },

  assignmentIcon: {
    fontSize: "26px",
  },

  assignmentSubject: {
    margin: 0,
    color: "#111827",
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
    background: "white",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },

  classHeader: {
    padding: "20px",
    borderBottom: "1px solid #eee",
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
    borderBottom: "1px solid #f1f1f1",
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

  studentName: {
    margin: 0,
    fontWeight: "600",
    color: "#111827",
  },

  studentEmail: {
    margin: "3px 0 0",
    fontSize: "13px",
    color: "#6b7280",
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
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
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

export default TeacherDashboard;