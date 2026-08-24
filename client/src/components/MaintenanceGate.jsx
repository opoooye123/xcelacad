import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "../layouts/PublicLayout";

// ==========================================================
// MAINTENANCE GATE
// ==========================================================
// Backs the `features.maintenanceMode` flag in the CMS. Admins
// keep full access so whoever flipped the switch can still get
// in and turn it off — locking yourself out of the dashboard
// with a toggle in the dashboard would be a poor design.
// ==========================================================

const MaintenanceGate = ({ children }) => {
  const { features, loading } = useSettings();
  const { user, loading: authLoading } = useAuth();

  const isDown = features?.maintenanceMode === true;

  // Don't flash the notice while settings are still loading, and
  // don't lock an admin out before their role is known.
  if (!isDown || loading || authLoading) {
    return children;
  }

  if (user?.role === "admin") {
    return (
      <>
        <div className="sticky top-0 z-50 bg-warning-soft px-4 py-2 text-center text-xs font-semibold text-warning">
          Maintenance mode is on — visitors see a holding page.
          You can see the site because you are an admin.
        </div>

        {children}
      </>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <BrandMark />
        </div>

        <div className="card card-pad">
          <span
            className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-warning-soft text-2xl"
            aria-hidden="true"
          >
            🔧
          </span>

          <h1 className="text-xl font-bold text-ink">
            We'll be right back
          </h1>

          <p className="mt-2 text-sm text-muted">
            We're carrying out scheduled maintenance. Your
            progress is safe — please check back shortly.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-6"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceGate;
