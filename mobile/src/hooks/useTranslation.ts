import { useStore } from '../store/useStore';
import en from '../locales/en';
import fr from '../locales/fr';

const locales: Record<string, Record<string, string>> = { en, fr };

export function useTranslation() {
  const language = useStore((state) => state.language);
  const strings = locales[language] ?? locales['en'];

  function t(key: string): string {
    return strings[key] ?? locales['en'][key] ?? key;
  }

  return { t, language };
}
