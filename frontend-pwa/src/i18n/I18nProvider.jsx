import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EN_STRINGS } from "../locales/enBundle.js";
import { useAppState } from "../state/appState.jsx";
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES } from "./languages.js";
import { clearLocaleMemory, ensureLocale } from "./translationService.js";

const I18nContext = createContext(null);

function applyParams(text, params) {
  if (!params) return text;
  let out = text;
  for (const [key, value] of Object.entries(params)) {
    out = out.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return out;
}

export function I18nProvider({ children }) {
  const { state, dispatch } = useAppState();
  const language = state.preferences.language ?? "en";
  const [strings, setStrings] = useState(EN_STRINGS);
  const [loading, setLoading] = useState(language !== "en");

  useEffect(() => {
    if (language === "en") {
      setStrings(EN_STRINGS);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    ensureLocale(language)
      .then((loaded) => {
        if (!cancelled) setStrings(loaded);
      })
      .catch(() => {
        if (!cancelled) setStrings(EN_STRINGS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  // screen readers pick their voice and pronunciation from the document
  // language, so a swahili interface announced with an english voice is close
  // to unusable. arabic also needs right to left or the layout reads backwards.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = language || "en";
    el.dir = RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = useCallback(
    (code) => {
      if (code !== language) {
        clearLocaleMemory(code);
      }
      dispatch({ type: "UPDATE_PREFERENCES", payload: { language: code } });
    },
    [dispatch, language]
  );

  const t = useCallback(
    (key, params) => {
      const text = strings[key] ?? EN_STRINGS[key] ?? key;
      return applyParams(text, params);
    },
    [strings]
  );

  const value = useMemo(
    () => ({ t, language, setLanguage, loading, supportedLanguages: SUPPORTED_LANGUAGES }),
    [t, language, setLanguage, loading]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used inside I18nProvider");
  }
  return context;
}
