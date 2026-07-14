import { EN_STRINGS } from '../locales/en';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateUiStrings, syncTranslations } from './api';
import { languageName } from '../utils/constants';
import { mergeLocaleStrings } from '../utils/mergeLocale';

const memory: Record<string, Record<string, string>> = { en: EN_STRINGS };
const bundledCache: Record<string, Record<string, string>> = {};
const CACHE_PREFIX = 'mframapa:mobile:locale:v5:';

const BUNDLED: Record<string, () => Record<string, string>> = {
  en: () => require('../locales/en').default,
  fr: () => require('../locales/fr').default,
  ar: () => require('../locales/ar').default,
  pt: () => require('../locales/pt').default,
  es: () => require('../locales/es').default,
  sw: () => require('../locales/sw').default,
  ha: () => require('../locales/ha').default,
  yo: () => require('../locales/yo').default,
  ig: () => require('../locales/ig').default,
  am: () => require('../locales/am').default,
  tw: () => require('../locales/tw').default,
  rw: () => require('../locales/rw').default,
  rn: () => require('../locales/rn').default,
  so: () => require('../locales/so').default,
  zu: () => require('../locales/zu').default,
  xh: () => require('../locales/xh').default,
  af: () => require('../locales/af').default,
  sn: () => require('../locales/sn').default,
  nd: () => require('../locales/nd').default,
  st: () => require('../locales/st').default,
  tn: () => require('../locales/tn').default,
  ti: () => require('../locales/ti').default,
  ss: () => require('../locales/ss').default,
  mg: () => require('../locales/mg').default,
  ny: () => require('../locales/ny').default,
  wo: () => require('../locales/wo').default,
  ga: () => require('../locales/ga').default,
};

function loadBundled(lang: string): Record<string, string> {
  if (bundledCache[lang]) return bundledCache[lang];
  const loader = BUNDLED[lang];
  if (!loader) return {};
  try {
    bundledCache[lang] = loader();
    return bundledCache[lang];
  } catch {
    return {};
  }
}

export function getLocaleStrings(lang: string): Record<string, string> {
  if (lang === 'system') return EN_STRINGS;
  // Return fully-loaded strings if ensureLocaleLoaded has completed.
  if (memory[lang]) return memory[lang];
  // During the async load, return bundled+en immediately for instant display.
  // Do NOT write to memory here — ensureLocaleLoaded must remain the sole writer
  // so it doesn't short-circuit before fetching Gemini translations.
  const bundled = loadBundled(lang);
  return mergeLocaleStrings(EN_STRINGS, {}, bundled);
}

export async function ensureLocaleLoaded(lang: string): Promise<Record<string, string>> {
  if (lang === 'en' || lang === 'system') return EN_STRINGS;
  if (memory[lang]) return memory[lang];

  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${lang}`);
    if (cached) {
      memory[lang] = JSON.parse(cached) as Record<string, string>;
      return memory[lang];
    }
  } catch {
    // ignore corrupt cache
  }

  const bundled = loadBundled(lang);
  const langDisplayName = languageName(lang);

  // Try OTA sync endpoint first (server-side Gemini caching = faster repeat loads).
  try {
    const { translations, fallback } = await syncTranslations(lang, langDisplayName);
    if (!fallback && Object.keys(translations).length > 0) {
      const merged = mergeLocaleStrings(EN_STRINGS, translations, bundled);
      memory[lang] = merged;
      try {
        await AsyncStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(merged));
      } catch {
        // ignore cache writes
      }
      return merged;
    }
  } catch {
    // OTA sync unavailable — fall through to on-demand translate
  }

  // Fallback: generate translations on-demand via POST /translate.
  const UI_STRINGS = Object.fromEntries(
    Object.entries(EN_STRINGS).filter(([k]) => !k.startsWith('legal.'))
  );

  try {
    const { translations, fallback } = await translateUiStrings(
      UI_STRINGS,
      lang,
      langDisplayName,
    );
    const merged = fallback
      ? mergeLocaleStrings(EN_STRINGS, bundled)
      : mergeLocaleStrings(EN_STRINGS, translations, bundled);
    memory[lang] = merged;

    try {
      await AsyncStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(merged));
    } catch {
      // ignore cache writes
    }

    return merged;
  } catch {
    memory[lang] = mergeLocaleStrings(EN_STRINGS, bundled);
    return memory[lang];
  }
}

/**
 * Background OTA sync — fetches the latest server-side translations on startup
 * without blocking the UI. Saves to AsyncStorage for the next cold start.
 */
export async function syncLocaleInBackground(lang: string): Promise<void> {
  if (lang === 'en' || lang === 'system') return;
  try {
    const { translations, fallback } = await syncTranslations(lang, languageName(lang));
    if (fallback || Object.keys(translations).length === 0) return;
    const bundled = loadBundled(lang);
    const merged = mergeLocaleStrings(EN_STRINGS, translations, bundled);
    memory[lang] = merged;
    await AsyncStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(merged));
  } catch {
    // background sync failures are silent
  }
}

export async function clearLocaleCache(lang?: string): Promise<void> {
  if (lang) {
    delete memory[lang];
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${lang}`);
    } catch {
      // ignore
    }
    return;
  }
  for (const key of Object.keys(memory)) {
    if (key !== 'en') delete memory[key];
  }
}
