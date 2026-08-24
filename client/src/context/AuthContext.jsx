import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  api,
  clearStoredAuth,
  endpoints,
  getToken,
  onUnauthorized,
  setStoredAuth,
} from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getToken());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredAuth();

    setToken(null);
    setUser(null);
  }, []);

  // Any 401 from anywhere in the app means the token is stale.
  // Clear it once here instead of in every page's catch block.
  useEffect(() => {
    return onUnauthorized(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const verify = async () => {
      const storedToken = getToken();

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const data = await api.get(endpoints.auth.me, {
          signal: controller.signal,
        });

        setUser(data.user);
        setToken(storedToken);
      } catch (error) {
        if (error?.name === "AbortError") return;

        // A network blip shouldn't sign the user out — only an
        // actual rejection from the server should.
        if (error?.status === 0) {
          setLoading(false);
          return;
        }

        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    verify();

    return () => controller.abort();
  }, []);

  const login = useCallback((userData, authToken) => {
    setStoredAuth(authToken, userData);

    setToken(authToken);
    setUser(userData);
  }, []);

  // Called after a profile edit so the header avatar and name
  // update without a round trip to /auth/me.
  const updateUser = useCallback((patch) => {
    setUser((current) => {
      if (!current) return current;

      const next = { ...current, ...patch };

      setStoredAuth(null, next);

      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return null;

    const data = await api.get(endpoints.auth.me);

    setUser(data.user);

    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      logout,
      updateUser,
      refresh,
    }),
    [user, token, loading, login, logout, updateUser, refresh]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an <AuthProvider>"
    );
  }

  return context;
};
