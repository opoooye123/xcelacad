import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [classLevel, setClassLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        setUser(data.user);

        setName(data.user.name || "");
        setSchool(data.user.school || "");
        setClassLevel(data.user.classLevel || "");
      } catch (error) {
        console.error(
          "Load profile error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadProfile();
    }
  }, [token]);

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/users/profile",
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            school,
            classLevel,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      setUser(data.user);

      setMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={styles.center}>
        <h2>Loading profile...</h2>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !user) {
    return (
      <div style={styles.center}>
        <div>
          <h2>Unable to load profile</h2>

          <p>{error}</p>

          <button
            onClick={() => navigate("/dashboard")}
            style={styles.primaryButton}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              My Profile
            </h1>

            <p style={styles.subtitle}>
              Manage your Xcel Academy account.
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

        {/* MESSAGES */}

        {message && (
          <div style={styles.success}>
            {message}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* PROFILE CARD */}

        <div style={styles.card}>
          <h2>Account Information</h2>

          <div style={styles.accountInfo}>
            <p>
              <strong>Email:</strong>{" "}
              {user?.email}
            </p>

            <p>
              <strong>Account Type:</strong>{" "}
              {user?.role}
            </p>

            <p>
              <strong>Login Provider:</strong>{" "}
              {user?.authProvider}
            </p>
          </div>
        </div>

        {/* EDIT PROFILE */}

        <form
          onSubmit={handleSubmit}
          style={styles.card}
        >
          <h2>Personal Information</h2>

          {/* NAME */}

          <div style={styles.field}>
            <label>Name</label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              style={styles.input}
            />
          </div>

          {/* SCHOOL */}

          <div style={styles.field}>
            <label>School</label>

            <input
              type="text"
              value={school}
              onChange={(e) =>
                setSchool(e.target.value)
              }
              placeholder="Enter your school"
              style={styles.input}
            />
          </div>

          {/* CLASS */}

          <div style={styles.field}>
            <label>Class Level</label>

            <select
              value={classLevel}
              onChange={(e) =>
                setClassLevel(e.target.value)
              }
              style={styles.input}
            >
              <option value="">
                Select class
              </option>

              <option value="JSS1">
                JSS1
              </option>

              <option value="JSS2">
                JSS2
              </option>

              <option value="JSS3">
                JSS3
              </option>

              <option value="SS1">
                SS1
              </option>

              <option value="SS2">
                SS2
              </option>

              <option value="SS3">
                SS3
              </option>
            </select>
          </div>

          {/* SAVE */}

          <button
            type="submit"
            disabled={saving}
            style={styles.primaryButton}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </form>
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
    maxWidth: "800px",
    margin: "0 auto",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    gap: "20px",
  },

  title: {
    margin: 0,
  },

  subtitle: {
    color: "#64748b",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "25px",
    marginBottom: "20px",
  },

  accountInfo: {
    marginTop: "20px",
    lineHeight: "1.8",
  },

  field: {
    marginBottom: "20px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginTop: "8px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },

  primaryButton: {
    padding: "12px 20px",
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  secondaryButton: {
    padding: "10px 18px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
};

export default Profile;