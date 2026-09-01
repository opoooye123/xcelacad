// ==========================================================
// API CLIENT
// ==========================================================
// One place that knows the base URL and how to attach the JWT.
// Everything else in the app calls api.get / api.post etc.
//
// Base URL comes from VITE_API_URL (see client/.env.example) so
// a deployed build can point at a real host without a code edit.
// ==========================================================

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
   console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("FINAL API_URL:", API_URL);
const TOKEN_KEY = "xcelToken";
const USER_KEY = "xcelUser";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private mode / storage disabled — treat as signed out.
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch {
    // Non-fatal: the session just won't survive a reload.
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nothing to clear.
  }
};

// Thrown for every non-2xx response so callers can branch on
// status (401 → sign out, 404 → not-found screen) and show the
// server's own message instead of a generic one.
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data ?? null;
  }
}

// Listeners registered by AuthContext. When any request comes
// back 401 the token is stale, so we clear it once and let the
// app redirect, rather than every page handling it separately.
const unauthorizedHandlers = new Set();

export const onUnauthorized = (handler) => {
  unauthorizedHandlers.add(handler);

  return () => unauthorizedHandlers.delete(handler);
};

const buildQuery = (params) => {
  if (!params) return "";

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    // Drop empties so `?subject=` never reaches the server and
    // accidentally filters on an empty string.
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    search.append(key, String(value));
  }

  const qs = search.toString();

  return qs ? `?${qs}` : "";
};

const parseBody = async (response) => {
  const type = response.headers.get("content-type") || "";

  if (!type.includes("application/json")) {
    const text = await response.text();

    return text ? { message: text } : null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const apiFetch = async (
  path,
  {
    method = "GET",
    body,
    params,
    signal,
    auth = true,
    headers = {},
  } = {}
) => {
  const url = `${API_URL}${path}${buildQuery(params)}`;

  const finalHeaders = { ...headers };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();

    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response;

  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      signal,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (error) {
    // Aborts are expected (component unmounted mid-request) and
    // must not be reported to the user as a failure.
    if (error?.name === "AbortError") throw error;

    throw new ApiError(
      "Can't reach the server. Check your connection and try again.",
      0
    );
  }

  const data = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
      unauthorizedHandlers.forEach((handler) => handler());
    }

    throw new ApiError(
      data?.message ||
        `Request failed (${response.status})`,
      response.status,
      data
    );
  }

  return data;
};

export const api = {
  get: (path, options) =>
    apiFetch(path, { ...options, method: "GET" }),

  post: (path, body, options) =>
    apiFetch(path, { ...options, method: "POST", body }),

  put: (path, body, options) =>
    apiFetch(path, { ...options, method: "PUT", body }),

  patch: (path, body, options) =>
    apiFetch(path, { ...options, method: "PATCH", body }),

  delete: (path, options) =>
    apiFetch(path, { ...options, method: "DELETE" }),
};

// ==========================================================
// ENDPOINTS
// ==========================================================
// Named in one place so a server-side route change is a
// one-line edit here instead of a hunt through the pages.
// ==========================================================

export const endpoints = {
  auth: {
    me: "/auth/me",
    // Full-page redirect, so this one needs the absolute URL.
    google: `${API_URL}/auth/google`,
  },

  settings: {
    public: "/settings/public",
    admin: "/admin/settings",
  },

  catalog: {
    subjects: "/catalog/subjects",
    subject: (slug) => `/catalog/subjects/${slug}`,
  },

  exams: {
    list: "/exams",
    detail: (id) => `/exams/${id}`,
    start: (id) => `/exams/${id}/start`,
  },

  attempts: {
    history: "/attempts/history",
    active: "/attempts/active",
    detail: (id) => `/attempts/${id}`,
    result: (id) => `/attempts/${id}/result`,
    answer: (id) => `/attempts/${id}/answer`,
    submit: (id) => `/attempts/${id}/submit`,
  },

  practice: {
    options: "/practice/options",
    sessions: "/practice/sessions",
  },

  leaderboard: "/leaderboard",

  analytics: {
    me: "/analytics/me",
  },

  materials: {
    list: "/materials",
    detail: (id) => `/materials/${id}`,
  },
  reviews: {
  list: "/reviews",
  stats: "/reviews/stats",
  answer: (id) => `/reviews/${id}/answer`,
},

  users: {
    profile: "/users/profile",
  },

  admin: {
    overview: "/admin/overview",
    subjects: "/admin/subjects",
    subject: (id) => `/admin/subjects/${id}`,
    topics: "/admin/topics",
    topic: (id) => `/admin/topics/${id}`,
    questions: "/admin/questions",
    question: (id) => `/admin/questions/${id}`,
    questionsBulk: "/admin/questions/bulk",
    questionYears: "/admin/questions/years",
    exams: "/admin/exams",
    exam: (id) => `/admin/exams/${id}`,
    examPublish: (id) => `/admin/exams/${id}/publish`,
    materials: "/admin/materials",
    material: (id) => `/admin/materials/${id}`,
    users: "/admin/users",
    user: (id) => `/admin/users/${id}`,
    userRole: (id) => `/admin/users/${id}/role`,
    userBlock: (id) => `/admin/users/${id}/block`,
    settings: "/admin/settings",
  },
};
