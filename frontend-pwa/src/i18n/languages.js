/** Supported UI languages (matches frontend-pwa/src/locales/*.json). */
/** languages written right to left. arabic is the only one we ship today. */
export const RTL_LANGUAGES = new Set(["ar"]);

export const SUPPORTED_LANGUAGES = [
  { code: "ar", name: "Arabic", flag: "🇪🇬" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "tn", name: "Tswana", flag: "🇧🇼" },
  { code: "rn", name: "Kirundi", flag: "🇧🇮" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "ti", name: "Tigrinya", flag: "🇪🇷" },
  { code: "ss", name: "Swati", flag: "🇸🇿" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  { code: "tw", name: "Twi", flag: "🇬🇭" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "st", name: "Sotho", flag: "🇱🇸" },
  { code: "mg", name: "Malagasy", flag: "🇲🇬" },
  { code: "ny", name: "Chichewa", flag: "🇲🇼" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "wo", name: "Wolof", flag: "🇸🇳" },
  { code: "so", name: "Somali", flag: "🇸🇴" },
  { code: "zu", name: "Zulu", flag: "🇿🇦" },
  { code: "xh", name: "Xhosa", flag: "🇿🇦" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "sn", name: "Shona", flag: "🇿🇼" },
  { code: "nd", name: "Ndebele", flag: "🇿🇼" },
  { code: "ga", name: "Ga", flag: "🇬🇭" },
];

export function languageName(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

/** the device's language, when we support it, else english.
 *
 * someone whose phone is set to Swahili should not have to find a language
 * picker before the app speaks to them. only used for the first run; once a
 * choice is stored it wins.
 */
export function detectDeviceLanguage() {
  const codes = typeof navigator !== "undefined"
    ? [navigator.language, ...(navigator.languages ?? [])].filter(Boolean)
    : [];
  const supported = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));
  for (const tag of codes) {
    const base = String(tag).toLowerCase().split("-")[0];
    if (supported.has(base)) return base;
  }
  return "en";
}
