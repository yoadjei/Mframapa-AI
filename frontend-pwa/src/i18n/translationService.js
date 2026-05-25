import { EN_STRINGS } from "../locales/enBundle.js";
import { translateUiStrings } from "../services/api.js";
import { languageName } from "./languages.js";
import { mergeLocaleStrings } from "./mergeLocale.js";

const CACHE_PREFIX = "mframapa:pwa:locale:v3:";
const memory = { en: EN_STRINGS };

const localeModules = import.meta.glob("../locales/*.json");

function loaderForLanguage(lang) {
  const suffix = `/${lang}.json`;
  const entry = Object.entries(localeModules).find(([path]) => path.endsWith(suffix));
  return entry?.[1] ?? null;
}

export function getCachedStrings(lang) {
  if (lang === "en") return EN_STRINGS;
  return memory[lang] ?? EN_STRINGS;
}

/** Load full UI catalog: Gemini when configured, bundled JSON as curated overrides. */
export async function ensureLocale(lang) {
  if (lang === "en") return EN_STRINGS;
  if (memory[lang]) return memory[lang];

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
    if (cached) {
      memory[lang] = JSON.parse(cached);
      return memory[lang];
    }
  } catch {
    // ignore corrupt cache
  }

  const loader = loaderForLanguage(lang);
  let bundled = {};
  if (loader) {
    const mod = await loader();
    bundled = mod.default ?? mod;
  }

  const { translations, fallback } = await translateUiStrings(EN_STRINGS, lang, languageName(lang));
  const merged = fallback
    ? mergeLocaleStrings(EN_STRINGS, bundled)
    : mergeLocaleStrings(EN_STRINGS, translations, bundled);

  memory[lang] = merged;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(merged));
  } catch {
    // quota exceeded
  }
  return merged;
}

export function clearLocaleMemory(lang) {
  if (lang) {
    delete memory[lang];
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${lang}`);
    } catch {
      // ignore
    }
    return;
  }
  for (const key of Object.keys(memory)) {
    if (key !== "en") delete memory[key];
  }
}
