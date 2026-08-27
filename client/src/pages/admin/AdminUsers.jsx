import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://xcelacad.onrender.com/api";

const AdminUsers = () => {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    if (!token) {
      setError("You are not authenticated.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load users."
        );
      }

      setUsers(
        data.users ||
          data.data ||
          []
      );
    } catch (error) {
      console.error(
        "Fetch users error:",
        error
      );

      setError(
        error.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // ==========================================
  // FILTER USERS
  // ==========================================

  const filteredUsers = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const name =
        user.name ||
        user.fullName ||
        "";

      const email =
        user.email || "";

      const role =
        user.role || "student";

      const matchesSearch =
        !searchValue ||
        name
          .toLowerCase()
          .includes(searchValue) ||
        email
          .toLowerCase()
          .includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        role === roleFilter;

      return (
        matchesSearch &&
        matchesRole
      );
    });
  }, [users, search, roleFilter]);

  // ==========================================
  // TOGGLE USER STATUS
  // ==========================================

  const handleToggleStatus = async (user) => {
    if (!token) {
      setError(
        "You are not authenticated."
      );
      return;
    }

    const userId =
      user._id || user.id;

    if (!userId) {
      setError(
        "Unable to identify this user."
      );
      return;
    }

    const currentStatus =
      user.isActive !== false;

    const nextStatus =
      !currentStatus;

    const confirmed = window.confirm(
      nextStatus
        ? `Activate ${user.email || "this user"}?`
        : `Deactivate ${user.email || "this user"}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingId(userId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/admin/users/${userId}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update user."
        );
      }

      setSuccess(
        nextStatus
          ? "User activated successfully."
          : "User deactivated successfully."
      );

      await fetchUsers();
    } catch (error) {
      console.error(
        "Update user status error:",
        error
      );

      setError(
        error.message ||
          "Failed to update user."
      );
    } finally {
      setSavingId(null);
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const getUserName = (user) => {
    return (
      user.name ||
      user.fullName ||
      "Unnamed User"
    );
  };

  const getInitials = (user) => {
    const name = getUserName(user);

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join("");
  };

  const getRole = (user) => {
    return user.role || "student";
  };

  const isActive = (user) => {
    return user.isActive !== false;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />

            <p style={styles.loadingText}>
              Loading users...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              User Management
            </h1>

            <p style={styles.subtitle}>
              Manage students and
              administrators on Xcel
              Academy.
            </p>
          </div>

          <div style={styles.countBadge}>
            {users.length}{" "}
            {users.length === 1
              ? "User"
              : "Users"}
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        {/* STATS */}

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Total Users
            </p>

            <p style={styles.statValue}>
              {users.length}
            </p>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Active Users
            </p>

            <p style={styles.statValue}>
              {
                users.filter(
                  (user) =>
                    isActive(user)
                ).length
              }
            </p>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Students
            </p>

            <p style={styles.statValue}>
              {
                users.filter(
                  (user) =>
                    getRole(user) ===
                    "student"
                ).length
              }
            </p>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>
              Administrators
            </p>

            <p style={styles.statValue}>
              {
                users.filter(
                  (user) =>
                    getRole(user) ===
                    "admin"
                ).length
              }
            </p>
          </div>
        </div>

        {/* USER LIST */}

        <div style={styles.card}>
          {/* LIST HEADER */}

          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                All Users
              </h2>

              <p style={styles.cardSubtitle}>
                Search and manage
                registered users.
              </p>
            </div>
          </div>

          {/* FILTERS */}

          <div style={styles.filters}>
            <div style={styles.searchWrapper}>
              <label
                htmlFor="user-search"
                style={styles.filterLabel}
              >
                Search
              </label>

              <input
                id="user-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name or email..."
                style={styles.input}
              />
            </div>

            <div style={styles.roleWrapper}>
              <label
                htmlFor="role-filter"
                style={styles.filterLabel}
              >
                Role
              </label>

              <select
                id="role-filter"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value
                  )
                }
                style={styles.select}
              >
                <option value="all">
                  All roles
                </option>

                <option value="student">
                  Students
                </option>

                <option value="admin">
                  Administrators
                </option>
              </select>
            </div>
          </div>

          {/* RESULT COUNT */}

          <div style={styles.resultInfo}>
            Showing{" "}
            <strong>
              {filteredUsers.length}
            </strong>{" "}
            of{" "}
            <strong>
              {users.length}
            </strong>{" "}
            users
          </div>

          {/* EMPTY */}

          {filteredUsers.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                👤
              </div>

              <h3 style={styles.emptyTitle}>
                No users found
              </h3>

              <p style={styles.emptyText}>
                {users.length === 0
                  ? "There are no registered users yet."
                  : "Try changing your search or role filter."}
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      User
                    </th>

                    <th style={styles.th}>
                      Role
                    </th>

                    <th style={styles.th}>
                      Status
                    </th>

                    <th style={styles.th}>
                      Joined
                    </th>

                    <th style={styles.th}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user) => {
                      const userId =
                        user._id ||
                        user.id;

                      const active =
                        isActive(user);

                      const role =
                        getRole(user);

                      return (
                        <tr
                          key={userId}
                        >
                          {/* USER */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            <div
                              style={
                                styles.userCell
                              }
                            >
                              <div
                                style={
                                  styles.avatar
                                }
                              >
                                {getInitials(
                                  user
                                )}
                              </div>

                              <div
                                style={
                                  styles.userInfo
                                }
                              >
                                <strong
                                  style={
                                    styles.userName
                                  }
                                >
                                  {getUserName(
                                    user
                                  )}
                                </strong>

                                <span
                                  style={
                                    styles.email
                                  }
                                >
                                  {user.email ||
                                    "No email"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* ROLE */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            <span
                              style={{
                                ...styles.role,
                                ...(role ===
                                "admin"
                                  ? styles.adminRole
                                  : styles.studentRole),
                              }}
                            >
                              {role ===
                              "admin"
                                ? "Admin"
                                : "Student"}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            <span
                              style={{
                                ...styles.status,
                                ...(active
                                  ? styles.activeStatus
                                  : styles.inactiveStatus),
                              }}
                            >
                              {active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          {/* JOINED */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            {formatDate(
                              user.createdAt
                            )}
                          </td>

                          {/* ACTION */}

                          <td
                            style={
                              styles.td
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(
                                  user
                                )
                              }
                              disabled={
                                savingId ===
                                userId
                              }
                              style={{
                                ...styles.actionButton,
                                ...(active
                                  ? styles.deactivateButton
                                  : styles.activateButton),
                                opacity:
                                  savingId ===
                                  userId
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              {savingId ===
                              userId
                                ? "Saving..."
                                : active
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
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
    padding: "40px 20px",
  },

  container: {
    maxWidth: "1200px",
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
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: "8px",
    color: "#64748b",
  },

  countBadge: {
    background: "#111827",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "20px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "25px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "22px",
  },

  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
  },

  statValue: {
    margin: "8px 0 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "28px",
  },

  listHeader: {
    marginBottom: "22px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },

  cardSubtitle: {
    marginTop: "6px",
    color: "#64748b",
  },

  filters: {
    display: "flex",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  searchWrapper: {
    flex: "1 1 320px",
  },

  roleWrapper: {
    width: "200px",
  },

  filterLabel: {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },

  resultInfo: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "15px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    borderBottom:
      "2px solid #e5e7eb",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "16px 14px",
    borderBottom:
      "1px solid #e5e7eb",
    verticalAlign: "middle",
  },

  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#eef2ff",
    color: "#3730a3",
    display: "grid",
    placeItems: "center",
    fontWeight: "700",
    fontSize: "14px",
    flexShrink: 0,
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    minWidth: 0,
  },

  userName: {
    color: "#111827",
    fontSize: "14px",
  },

  email: {
    color: "#64748b",
    fontSize: "13px",
  },

  role: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  adminRole: {
    background: "#ede9fe",
    color: "#6d28d9",
  },

  studentRole: {
    background: "#e0f2fe",
    color: "#0369a1",
  },

  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  activeStatus: {
    background: "#dcfce7",
    color: "#166534",
  },

  inactiveStatus: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  actionButton: {
    padding: "8px 12px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  activateButton: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  deactivateButton: {
    background: "#fff",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "36px",
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "18px",
  },

  emptyText: {
    marginTop: "7px",
  },

  loadingCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "60px 20px",
    textAlign: "center",
  },

  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#111827",
    borderRadius: "50%",
    margin: "0 auto",
    animation:
      "spin 0.8s linear infinite",
  },

  loadingText: {
    marginTop: "15px",
    color: "#64748b",
  },
};

export default AdminUsers;