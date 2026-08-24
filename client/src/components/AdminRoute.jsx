import { Link, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { EmptyState, PageLoader } from "./ui";
import { AlertIcon } from "./ui/Icons";

// ==========================================================
// ADMIN ROUTE
// ==========================================================
// Admin status comes from the server: passport.js promotes a
// Google account whose email is listed in ADMIN_EMAILS, and
// /auth/me reports the resulting role. This guard is a UX
// convenience only — every /api/admin/* route is independently
// gated by protect + adminOnly, so hiding the UI is not what
// keeps the data safe.
// ==========================================================

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Checking permissions…" />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (user.role !== "admin") {
    // Deliberately not a redirect: silently bouncing a signed-in
    // user to the dashboard reads like a broken link.
    return (
      <div className="shell py-16">
        <div className="card card-pad mx-auto max-w-md">
          <EmptyState
            icon={AlertIcon}
            title="Admins only"
            description="This area manages questions, content and users. Your account doesn't have admin access."
            action={
              <Link
                to="/dashboard"
                className="btn btn-primary"
              >
                Back to dashboard
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
