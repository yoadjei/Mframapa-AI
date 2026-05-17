import { getLocaleStrings } from '../services/translation';

export function getTranslations(lang: string): Record<string, string> {
  return getLocaleStrings(lang);
}

export function translate(key: string, lang: string, params?: Record<string, string>): string {
  const translations = getTranslations(lang);
  const en = getTranslations('en');
  let text = translations[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
    }
  }
  return text;
}
