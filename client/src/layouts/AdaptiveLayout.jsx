import { useAuth } from "../context/AuthContext";
import PublicLayout from "./PublicLayout";
import StudentLayout from "./StudentLayout";
import { PageLoader } from "../components/ui";

// ==========================================================
// ADAPTIVE LAYOUT
// ==========================================================
// Some pages are meaningful to both visitors and students —
// the subject catalogue, leaderboard and study notes. Giving them
// two URLs (a public one and an /app one) would split links and
// SEO, so instead one URL renders inside whichever chrome fits
// the viewer: the marketing header for a visitor, the student
// sidebar / bottom nav for someone signed in.
// ==========================================================

const AdaptiveLayout = () => {
  const { user, loading } = useAuth();

  // Without this the page would mount in the public shell and then
  // snap into the student shell a moment later.
  if (loading) {
    return (
      <div className="min-h-dvh bg-bg">
        <PageLoader />
      </div>
    );
  }

  return user ? <StudentLayout /> : <PublicLayout />;
};

export default AdaptiveLayout;
