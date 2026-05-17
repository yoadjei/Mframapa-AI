import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import en, { EN_STRINGS } from '../locales/en';
import { ensureLocaleLoaded, getLocaleStrings } from '../services/translation';

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
