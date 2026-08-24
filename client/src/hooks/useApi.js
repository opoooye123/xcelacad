import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../lib/api";

// ==========================================================
// useApiData
// ==========================================================
// The loading / error / abort dance repeated on every screen,
// written once.
//
// `params` is compared by value (serialised), not identity, so
// callers can pass an inline object literal without re-fetching
// on every render.
// ==========================================================

export const useApiData = (
  path,
  { params, auth = true, enabled = true, select } = {}
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const paramsKey = JSON.stringify(params ?? null);

  // Keep `select` out of the effect's dependency list — an inline
  // arrow would otherwise re-run the request every render.
  const selectRef = useRef(select);
  selectRef.current = select;

  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    let active = true;

    setLoading(true);

    api
      .get(path, {
        params: paramsKey ? JSON.parse(paramsKey) : undefined,
        auth,
        signal: controller.signal,
      })
      .then((payload) => {
        if (!active) return;

        setData(
          selectRef.current
            ? selectRef.current(payload)
            : payload
        );

        setError(null);
      })
      .catch((requestError) => {
        if (!active || requestError?.name === "AbortError") {
          return;
        }

        setError(requestError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [path, paramsKey, auth, enabled, reloadToken]);

  return { data, loading, error, refetch, setData };
};

// ==========================================================
// useDebounced
// ==========================================================
// Search boxes on the admin tables hit paginated endpoints, so
// the value they filter on is debounced rather than the request
// being fired per keystroke.

export const useDebounced = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebounced(value),
      delay
    );

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

// ==========================================================
// useAsyncAction
// ==========================================================
// For saves and deletes: tracks a pending flag so a button can
// disable itself, and surfaces the server's message.

export const useAsyncAction = () => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (action) => {
    setPending(true);
    setError(null);

    try {
      const result = await action();

      return { ok: true, result };
    } catch (actionError) {
      setError(actionError);

      return { ok: false, error: actionError };
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, error, setError };
};

// ==========================================================
// useDocumentTitle
// ==========================================================

export const useDocumentTitle = (title, siteName) => {
  useEffect(() => {
    if (!title) return;

    const previous = document.title;

    document.title = siteName
      ? `${title} · ${siteName}`
      : title;

    return () => {
      document.title = previous;
    };
  }, [title, siteName]);
};
