import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useDocumentTitle } from "../hooks/useApi";
import { apiFetch, endpoints } from "../lib/api";
import { takeNext } from "../lib/authNext";
import { Alert, Spinner } from "../components/ui";
import { BrandMark } from "../layouts/PublicLayout";

// ==========================================================
// AUTH SUCCESS
// ==========================================================
// Google sends the browser here with ?token=… in the query. We
// verify that token against /auth/me before storing it, so a
// bogus token pasted into the URL never ends up in localStorage
// pretending to be a session.
//
// The token is passed as an explicit header rather than being
// stored first: nothing is persisted until the server has
// confirmed it.
// ==========================================================

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { login } = useAuth();
  const { siteName } = useSettings();

  useDocumentTitle("Signing you in", siteName);

  const [error, setError] = useState(null);

  // React 18+ mounts effects twice in development. Without this
  // the token would be verified twice and the second call could
  // land after the redirect.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    handled.current = true;

    const token = searchParams.get("token");

    if (!token) {
      navigate("/login?error=auth_failed", {
        replace: true,
      });

      return;
    }

    const destination = takeNext() || "/dashboard";

    apiFetch(endpoints.auth.me, {
      auth: false,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        if (!data?.user) {
          throw new Error("Malformed response");
        }

        login(data.user, token);

        navigate(destination, { replace: true });
      })
      .catch((requestError) => {
        // A 403 here means the account exists but is blocked —
        // worth saying so rather than showing a generic failure.
        if (requestError?.status === 403) {
          navigate("/login?error=blocked", {
            replace: true,
          });

          return;
        }

        setError(requestError);
      });
  }, [searchParams, navigate, login]);

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>

        {error ? (
          <div className="card card-pad">
            <Alert tone="danger" title="We couldn't sign you in">
              {error.message}
            </Alert>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/login"
                className="btn btn-primary"
              >
                Try again
              </Link>

              <Link to="/" className="btn btn-outline">
                Back to home
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-4"
            role="status"
            aria-live="polite"
          >
            <Spinner className="size-8 text-brand-500" />

            <div>
              <p className="font-semibold text-ink">
                Signing you in…
              </p>
              <p className="mt-1 text-sm text-muted">
                Just a moment while we set up your session.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;
