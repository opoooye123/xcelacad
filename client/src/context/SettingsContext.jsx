import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, endpoints } from "../lib/api";
import { FALLBACK_SETTINGS } from "../lib/fallbackSettings";

const SettingsContext = createContext(null);

// A hex colour the admin typed could be anything. Only push a
// value into the CSS custom property once it is a real hex, or a
// typo would blank out the whole palette.
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const applyBrandColors = (branding) => {
  const root = document.documentElement;

  if (HEX.test(branding?.primaryColor || "")) {
    root.style.setProperty(
      "--brand-primary",
      branding.primaryColor
    );
  }

  if (HEX.test(branding?.accentColor || "")) {
    root.style.setProperty(
      "--brand-accent",
      branding.accentColor
    );
  }
};

// Deep-merge the API payload onto the fallback so a settings
// document saved before a new field existed doesn't leave the UI
// reading `undefined.map`.
const mergeDeep = (base, incoming) => {
  if (incoming === null || incoming === undefined) return base;

  if (Array.isArray(incoming)) return incoming;

  if (typeof incoming !== "object") return incoming;

  const output = { ...base };

  for (const [key, value] of Object.entries(incoming)) {
    const current = base?.[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      output[key] = mergeDeep(current, value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  }

  return output;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (signal) => {
    try {
      const data = await api.get(endpoints.settings.public, {
        auth: false,
        signal,
      });

      const merged = mergeDeep(
        FALLBACK_SETTINGS,
        data?.settings || {}
      );

      setSettings(merged);
      applyBrandColors(merged.branding);
      setError(null);

      return merged;
    } catch (requestError) {
      if (requestError?.name === "AbortError") return null;

      // Non-fatal: the fallback defaults are already rendering.
      setError(requestError);

      return null;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    load(controller.signal);

    return () => controller.abort();
  }, [load]);

  // Called by the admin settings page after a successful save so
  // the live site reflects the change without a reload.
  const applySettings = useCallback((next) => {
    if (!next) return;

    const merged = mergeDeep(FALLBACK_SETTINGS, next);

    setSettings(merged);
    applyBrandColors(merged.branding);
  }, []);

  const value = useMemo(() => {
    const features = settings.features || {};

    return {
      settings,
      loading,
      error,
      branding: settings.branding,
      landing: settings.landing,
      navigation: settings.navigation,
      banner: settings.banner,
      features,
      curation: settings.curation,
      siteName:
        settings.branding?.siteName ||
        FALLBACK_SETTINGS.branding.siteName,
      isFeatureOn: (name) => features[name] !== false,
      reload: load,
      applySettings,
    };
  }, [settings, loading, error, load, applySettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used inside a <SettingsProvider>"
    );
  }

  return context;
};
