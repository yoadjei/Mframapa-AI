import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from './useTranslation';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../utils/constants';

interface UseLanguageReturn {
  language: string;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, params?: Record<string, string>) => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

export function useLanguage(): UseLanguageReturn {
  const language = useStore((s) => s.language);
  const setLanguageInStore = useStore((s) => s.setLanguage);
  const { t } = useTranslation();

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      setLanguageInStore(code);
    },
    [setLanguageInStore]
  );

  return { language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES };
}
