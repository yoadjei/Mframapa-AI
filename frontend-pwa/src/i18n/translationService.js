import { EN_STRINGS } from "../locales/enBundle.js";
import { translateUiStrings } from "../services/api.js";
import { languageName } from "./languages.js";

const CACHE_PREFIX = "mframapa:pwa:locale:v2:";
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

/** Gemini translates the full catalog; bundled JSON overrides where present. */
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
  const merged = fallback ? { ...EN_STRINGS, ...bundled } : { ...translations, ...bundled };

  memory[lang] = merged;
  if (!fallback) {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(merged));
    } catch {
      // quota exceeded
    }
  }
  return merged;
}
