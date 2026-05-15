import { useStore } from '../store/useStore';

type TranslationRecord = Record<string, string>;

const modules: Record<string, () => TranslationRecord> = {
  en: () => require('../locales/en').default ?? require('../locales/en'),
  fr: () => require('../locales/fr').default ?? require('../locales/fr'),
};

const cache: Record<string, TranslationRecord> = {};

export function getTranslations(lang: string): TranslationRecord {
  if (cache[lang]) return cache[lang];
  const loader = modules[lang] ?? modules['en'];
  try {
    cache[lang] = loader() as TranslationRecord;
  } catch {
    cache[lang] = (modules['en']?.() as TranslationRecord) ?? {};
  }
  return cache[lang];
}

export function translate(key: string, lang: string, params?: Record<string, string>): string {
  const translations = getTranslations(lang);
  let text = translations[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
    }
  }
  return text;
}

export function useI18n() {
  const language = useStore((s) => s.language);
  return {
    t: (key: string, params?: Record<string, string>) => translate(key, language, params),
    language,
  };
}
