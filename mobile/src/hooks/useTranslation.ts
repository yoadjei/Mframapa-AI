import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import en, { EN_STRINGS } from '../locales/en';
import { generateInsight } from '../services/api';
import { ensureLocaleLoaded, getLocaleStrings } from '../services/translation';
import { languageName } from '../utils/constants';

function applyParams(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  let out = text;
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp(`{{${k}}}`, 'g'), v);
  }
  return out;
}

export function useTranslation() {
  const language = useStore((state) => state.language);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(language !== 'en');

  useEffect(() => {
    if (language === 'en') {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    ensureLocaleLoaded(language)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRevision((n) => n + 1);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  // Re-localize AI insight when the user switches language.
  useEffect(() => {
    const pred = useStore.getState().lastPrediction;
    if (!pred || language === 'en') return undefined;

    let cancelled = false;
    (async () => {
      try {
        const fullName = useStore.getState().profile.fullName;
        const insight = await generateInsight({
          pm25: pred.pm25,
          aqi_category: pred.aqi_category,
          weather: pred.weather,
          language,
          language_name: languageName(language),
          name: fullName && fullName !== 'Guest' ? fullName : undefined,
        });
        if (!cancelled) {
          useStore.getState().setPrediction({ ...pred, insight });
        }
      } catch {
        // keep previous insight
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const strings = getLocaleStrings(language);
  void revision;

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const text = strings[key] ?? EN_STRINGS[key] ?? en[key] ?? key;
      return applyParams(text, params);
    },
    [strings]
  );

  return { t, language, loading };
}
