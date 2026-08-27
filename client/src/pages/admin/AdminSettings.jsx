import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://xcelacad.onrender.com/api";

const AdminSettings = () => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settings, setSettings] = useState({
    siteName: "Xcel Academy",
    siteDescription:
      "A learning platform for JAMB, Post-UTME and academic practice.",
    maintenanceMode: false,
    allowRegistration: true,
    allowGoogleLogin: true,
  });

  // ==========================================
  // FETCH SETTINGS
  // ==========================================

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * This endpoint is optional for now.
       *
       * If your backend already has:
       * GET /api/admin/settings
       *
       * it will load the saved settings.
       *
       * If it does not exist yet, the page will
       * simply use the default settings above.
       */

      const response = await fetch(
        `${API_URL}/admin/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load settings."
        );
      }

      if (data.settings) {
        setSettings((previous) => ({
          ...previous,
          ...data.settings,
        }));
      }
    } catch (error) {
      console.error(
        "Fetch settings error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [token]);

  // ==========================================
  // HANDLE CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ==========================================
  // SAVE SETTINGS
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

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

      const response = await fetch(
        `${API_URL}/admin/settings`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save settings."
        );
      }

      if (data.settings) {
        setSettings((previous) => ({
          ...previous,
          ...data.settings,
        }));
      }

      setSuccess(
        data.message ||
          "Settings saved successfully."
      );
    } catch (error) {
      console.error(
        "Save settings error:",
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
      <div className="shell py-8">
        <div className="card card-pad">
          <p className="text-sm text-muted">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="shell py-6 lg:py-8">
      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          Site Settings
        </h1>

        <p className="mt-2 text-sm text-muted sm:text-base">
          Manage the general settings and behaviour
          of Xcel Academy.
        </p>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="mb-6 rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-success-soft px-4 py-3 text-sm font-medium text-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ========================================
              GENERAL SETTINGS
          ========================================= */}

          <div className="space-y-6">
            <section className="card card-pad">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-ink">
                  General Settings
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Basic information displayed across
                  the Xcel Academy platform.
                </p>
              </div>

              {/* SITE NAME */}

              <div className="mb-5">
                <label
                  htmlFor="siteName"
                  className="label"
                >
                  Site Name
                </label>

                <input
                  id="siteName"
                  name="siteName"
                  type="text"
                  value={settings.siteName}
                  onChange={handleChange}
                  className="input mt-2 w-full"
                  placeholder="Xcel Academy"
                  required
                  disabled={saving}
                />
              </div>

              {/* SITE DESCRIPTION */}

              <div>
                <label
                  htmlFor="siteDescription"
                  className="label"
                >
                  Site Description
                </label>

                <textarea
                  id="siteDescription"
                  name="siteDescription"
                  value={
                    settings.siteDescription
                  }
                  onChange={handleChange}
                  rows={4}
                  className="input mt-2 w-full resize-y"
                  placeholder="Describe your platform..."
                  disabled={saving}
                />

                <p className="mt-2 text-xs text-subtle">
                  A short description of your platform.
                </p>
              </div>
            </section>

            {/* ========================================
                ACCOUNT SETTINGS
            ========================================= */}

            <section className="card card-pad">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-ink">
                  Account & Authentication
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Control how students can access
                  Xcel Academy.
                </p>
              </div>

              {/* REGISTRATION */}

              <SettingToggle
                name="allowRegistration"
                checked={
                  settings.allowRegistration
                }
                onChange={handleChange}
                disabled={saving}
                title="Allow new registrations"
                description="Students can create new Xcel Academy accounts."
              />

              {/* GOOGLE LOGIN */}

              <div className="mt-5">
                <SettingToggle
                  name="allowGoogleLogin"
                  checked={
                    settings.allowGoogleLogin
                  }
                  onChange={handleChange}
                  disabled={saving}
                  title="Allow Google login"
                  description="Students can sign in using their Google account."
                />
              </div>
            </section>

            {/* ========================================
                MAINTENANCE
            ========================================= */}

            <section className="card card-pad">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-ink">
                  Maintenance
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Temporarily restrict access while
                  you work on the platform.
                </p>
              </div>

              <div
                className={`rounded-lg border p-4 ${
                  settings.maintenanceMode
                    ? "border-warning bg-warning-soft"
                    : "border-line bg-surface-2"
                }`}
              >
                <SettingToggle
                  name="maintenanceMode"
                  checked={
                    settings.maintenanceMode
                  }
                  onChange={handleChange}
                  disabled={saving}
                  title="Maintenance mode"
                  description={
                    settings.maintenanceMode
                      ? "Maintenance mode is currently enabled."
                      : "The platform is currently available to students."
                  }
                />

                {settings.maintenanceMode && (
                  <div className="mt-4 rounded-md bg-warning-soft px-3 py-3 text-sm text-warning">
                    <strong>
                      Warning:
                    </strong>{" "}
                    Students may be unable to access
                    parts of the platform while
                    maintenance mode is active.
                  </div>
                )}
              </div>
            </section>

            {/* SAVE */}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary min-w-36"
              >
                {saving
                  ? "Saving..."
                  : "Save Settings"}
              </button>
            </div>
          </div>

          {/* ========================================
              SIDEBAR
          ========================================= */}

          <aside className="space-y-6">
            <section className="card card-pad">
              <h2 className="font-bold text-ink">
                Platform Status
              </h2>

              <div className="mt-5 flex items-center gap-3">
                <span
                  className={`size-3 rounded-full ${
                    settings.maintenanceMode
                      ? "bg-warning"
                      : "bg-success"
                  }`}
                />

                <div>
                  <p className="font-semibold text-ink">
                    {settings.maintenanceMode
                      ? "Maintenance Mode"
                      : "Platform Online"}
                  </p>

                  <p className="text-xs text-muted">
                    {settings.maintenanceMode
                      ? "Students may have limited access."
                      : "Xcel Academy is available."}
                  </p>
                </div>
              </div>
            </section>

            <section className="card card-pad">
              <h2 className="font-bold text-ink">
                Quick Information
              </h2>

              <div className="mt-4 space-y-4">
                <InfoRow
                  label="Application"
                  value="Xcel Academy"
                />

                <InfoRow
                  label="Environment"
                  value="Development"
                />

                <InfoRow
                  label="Authentication"
                  value="Google OAuth"
                />

                <InfoRow
                  label="Backend"
                  value="Node / Express"
                />

                <InfoRow
                  label="Database"
                  value="MongoDB"
                />
              </div>
            </section>

            <section className="rounded-lg border border-info/20 bg-info-soft p-4">
              <h3 className="font-semibold text-info">
                About Settings
              </h3>

              <p className="mt-2 text-sm leading-6 text-info">
                Changes made here affect the behaviour
                of the Xcel Academy platform. Make sure
                you understand a setting before changing
                it in production.
              </p>
            </section>
          </aside>
        </div>
      </form>
    </div>
  );
};

// ==========================================
// TOGGLE COMPONENT
// ==========================================

const SettingToggle = ({
  name,
  checked,
  onChange,
  disabled,
  title,
  description,
}) => {
  return (
    <label
      htmlFor={name}
      className="flex cursor-pointer items-start justify-between gap-5"
    >
      <span className="min-w-0">
        <span className="block font-semibold text-ink">
          {title}
        </span>

        <span className="mt-1 block text-sm leading-5 text-muted">
          {description}
        </span>
      </span>

      <span className="relative mt-0.5 shrink-0">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
        />

        <span
          className="
            block h-6 w-11 rounded-full
            bg-surface-3
            transition-colors
            peer-checked:bg-brand-600
            peer-focus-visible:ring-2
            peer-focus-visible:ring-brand-500
            peer-focus-visible:ring-offset-2
            peer-disabled:cursor-not-allowed
            peer-disabled:opacity-50
          "
        />

        <span
          className="
            pointer-events-none
            absolute left-1 top-1
            size-4 rounded-full
            bg-white shadow-sm
            transition-transform
            peer-checked:translate-x-5
          "
        />
      </span>
    </label>
  );
};

// ==========================================
// INFO ROW
// ==========================================

const InfoRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-ink">
        {value}
      </span>
    </div>
  );
};

export default AdminSettings;

