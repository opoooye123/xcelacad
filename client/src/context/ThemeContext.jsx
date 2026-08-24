import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSettings } from "./SettingsContext";

const ThemeContext = createContext(null);

const STORAGE_KEY = "xcelTheme";

const readStored = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
};

const systemPrefersDark = () => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)")
    .matches;
};

export const ThemeProvider = ({ children }) => {
  const { branding } = useSettings();

  // `null` means "no explicit choice yet" — follow the admin's
  // configured default, which itself may be "system".
  const [preference, setPreference] = useState(() => readStored());

  const [systemDark, setSystemDark] = useState(() =>
    systemPrefersDark()
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const query = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const onChange = (event) => setSystemDark(event.matches);

    query.addEventListener("change", onChange);

    return () => query.removeEventListener("change", onChange);
  }, []);

  const siteDefault = branding?.defaultTheme || "system";

  const resolved = useMemo(() => {
    if (preference) return preference;

    if (siteDefault === "light" || siteDefault === "dark") {
      return siteDefault;
    }

    return systemDark ? "dark" : "light";
  }, [preference, siteDefault, systemDark]);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
  }, [resolved]);

  const setTheme = useCallback((next) => {
    if (next !== "light" && next !== "dark") return;

    setPreference(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference just won't survive a reload.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  // Lets the user hand control back to the system / site default.
  const clearPreference = useCallback(() => {
    setPreference(null);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to remove.
    }
  }, []);

  const value = useMemo(
    () => ({
      theme: resolved,
      isDark: resolved === "dark",
      preference,
      setTheme,
      toggleTheme,
      clearPreference,
    }),
    [resolved, preference, setTheme, toggleTheme, clearPreference]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside a <ThemeProvider>"
    );
  }

  return context;
};
