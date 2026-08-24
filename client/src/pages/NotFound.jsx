import { Link } from "react-router-dom";

import { useSettings } from "../context/SettingsContext";
import { useDocumentTitle } from "../hooks/useApi";

const NotFound = () => {
  const { siteName } = useSettings();

  useDocumentTitle("Page not found", siteName);

  return (
    <div className="shell flex min-h-[70vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-brand-200 sm:text-7xl">
          404
        </p>

        <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
          We can't find that page
        </h1>

        <p className="mt-3 text-sm text-muted">
          The link may be broken, or the page may have moved.
          Try the subject catalogue instead.
        </p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>

          <Link to="/subjects" className="btn btn-outline">
            Browse subjects
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
