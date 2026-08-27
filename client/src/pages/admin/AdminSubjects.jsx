import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://xcelacad.onrender.com/api";

const AdminSubjects = () => {
  const { token } = useAuth();

  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  // ==========================================
  // FETCH SUBJECTS
  // ==========================================

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/subjects`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load subjects"
        );
      }

      setSubjects(data.subjects || []);
    } catch (error) {
      console.error(
        "Fetch subjects error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError(
        "You are not authenticated."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing =
        Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/subjects/${editingId}`
        : `${API_URL}/subjects`;

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save subject"
        );
      }

      setSuccess(
        isEditing
          ? "Subject updated successfully."
          : "Subject created successfully."
      );

      resetForm();

      await fetchSubjects();
    } catch (error) {
      console.error(
        "Save subject error:",
        error
      );

      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (subject) => {
    setEditingId(subject._id);

    setForm({
      name: subject.name || "",
      slug: subject.slug || "",
      description:
        subject.description || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    if (!token) {
      setError(
        "You are not authenticated."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/subjects/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete subject"
        );
      }

      setSuccess(
        "Subject deleted successfully."
      );

      await fetchSubjects();
    } catch (error) {
      console.error(
        "Delete subject error:",
        error
      );

      setError(error.message);
    }
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setEditingId(null);

    setForm({
      name: "",
      slug: "",
      description: "",
    });
  };

  // ==========================================
  // GENERATE SLUG
  // ==========================================

  const generateSlug = () => {
    const slug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    setForm((previous) => ({
      ...previous,
      slug,
    }));
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h1>Subjects</h1>
          <p>Loading subjects...</p>
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
              Subject Management
            </h1>

            <p style={styles.subtitle}>
              Create and manage subjects for
              Xcel Academy.
            </p>
          </div>

          <div style={styles.countBadge}>
            {subjects.length} Subjects
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        {/* FORM */}

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {editingId
                  ? "Edit Subject"
                  : "Create New Subject"}
              </h2>

              <p style={styles.cardSubtitle}>
                {editingId
                  ? "Update the subject information below."
                  : "Add a new subject to Xcel Academy."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* NAME */}

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Subject Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Economics"
                required
                style={styles.input}
              />
            </div>

            {/* SLUG */}

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Slug
              </label>

              <div style={styles.slugRow}>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="e.g. economics"
                  required
                  style={{
                    ...styles.input,
                    flex: 1,
                  }}
                />

                <button
                  type="button"
                  onClick={generateSlug}
                  style={styles.generateButton}
                >
                  Generate
                </button>
              </div>
            </div>

            {/* DESCRIPTION */}

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter a short description..."
                rows={4}
                style={styles.textarea}
              />
            </div>

            {/* BUTTONS */}

            <div style={styles.formActions}>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                style={styles.primaryButton}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Subject"
                  : "Create Subject"}
              </button>
            </div>
          </form>
        </div>

        {/* SUBJECT LIST */}

        <div style={styles.card}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                All Subjects
              </h2>

              <p style={styles.cardSubtitle}>
                Manage your available subjects.
              </p>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div style={styles.empty}>
              <h3>No subjects yet</h3>

              <p>
                Create your first subject using
                the form above.
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      Name
                    </th>

                    <th style={styles.th}>
                      Slug
                    </th>

                    <th style={styles.th}>
                      Description
                    </th>

                    <th style={styles.th}>
                      Status
                    </th>

                    <th style={styles.th}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {subjects.map(
                    (subject) => (
                      <tr key={subject._id}>
                        <td style={styles.td}>
                          <strong>
                            {subject.name}
                          </strong>
                        </td>

                        <td style={styles.td}>
                          <code>
                            {subject.slug}
                          </code>
                        </td>

                        <td style={styles.td}>
                          {subject.description ||
                            "—"}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.status,
                              background:
                                subject.isActive
                                  ? "#dcfce7"
                                  : "#fee2e2",
                              color:
                                subject.isActive
                                  ? "#166534"
                                  : "#991b1b",
                            }}
                          >
                            {subject.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              styles.actions
                            }
                          >
                            <button
                              onClick={() =>
                                handleEdit(
                                  subject
                                )
                              }
                              style={
                                styles.editButton
                              }
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  subject._id
                                )
                              }
                              style={
                                styles.deleteButton
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
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
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "8px",
  },

  countBadge: {
    background: "#111827",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "20px",
    fontWeight: "600",
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "25px",
  },

  cardHeader: {
    marginBottom: "25px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "22px",
  },

  cardSubtitle: {
    color: "#64748b",
    marginTop: "6px",
  },

  formGroup: {
    marginBottom: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
  },

  slugRow: {
    display: "flex",
    gap: "10px",
  },

  generateButton: {
    padding: "0 18px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#f8fafc",
    cursor: "pointer",
    fontWeight: "600",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  primaryButton: {
    padding: "13px 22px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  cancelButton: {
    padding: "13px 22px",
    background: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
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

  listHeader: {
    marginBottom: "20px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    borderBottom: "2px solid #e5e7eb",
    color: "#475569",
    fontSize: "14px",
  },

  td: {
    padding: "15px 14px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "middle",
  },

  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  actions: {
    display: "flex",
    gap: "8px",
  },

  editButton: {
    padding: "7px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
  },

  deleteButton: {
    padding: "7px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "50px 20px",
    color: "#64748b",
  },
};

export default AdminSubjects;