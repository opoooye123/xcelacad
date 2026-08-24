import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { loginPath } from "../lib/authNext";
import { PageLoader } from "./ui";

// Signed-in users only. Remembers where they were headed so the
// login screen can send them back after Google returns — carried
// as `?next=` rather than router state, because the sign-in flow
// leaves the app entirely and state wouldn't survive it.
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Checking your session…" />;
  }

  if (!user) {
    return (
      <Navigate
        to={loginPath(location.pathname + location.search)}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
