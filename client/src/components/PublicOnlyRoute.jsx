import { Navigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { safeNext } from "../lib/authNext";
import { PageLoader } from "./ui";

// Keeps a signed-in user off /login. Admins land in the student
// dashboard rather than the admin area so the sign-in flow feels
// the same for everyone.
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return <PageLoader />;
  }

  if (user) {
    const intended = safeNext(searchParams.get("next"));

    return <Navigate to={intended || "/dashboard"} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
