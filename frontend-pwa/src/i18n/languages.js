/** Supported UI languages (matches frontend-pwa/src/locales/*.json). */
/** languages written right to left. arabic is the only one we ship today. */
export const RTL_LANGUAGES = new Set(["ar"]);

/**
 * Ordered alphabetically by country, then by language name within a country.
 * `name` is the English label (Asante Twi, not Fante). UI pickers prefer
 * `t("lang.<code>")` so each locale can show its own name for the language.
 * Country is the primary association for the flag (not a claim of exclusivity).
 */
export const SUPPORTED_LANGUAGES = [
  { code: "tn", name: "Setswana", country: "Botswana", countryKey: "country.botswana", flag: "🇧🇼" },
  { code: "rn", name: "Kirundi", country: "Burundi", countryKey: "country.burundi", flag: "🇧🇮" },
  { code: "ar", name: "Arabic", country: "Egypt", countryKey: "country.egypt", flag: "🇪🇬" },
  { code: "ti", name: "Tigrinya", country: "Eritrea", countryKey: "country.eritrea", flag: "🇪🇷" },
  { code: "ss", name: "siSwati", country: "Eswatini", countryKey: "country.eswatini", flag: "🇸🇿" },
  { code: "am", name: "Amharic", country: "Ethiopia", countryKey: "country.ethiopia", flag: "🇪🇹" },
  { code: "fr", name: "French", country: "France", countryKey: "country.france", flag: "🇫🇷" },
  { code: "ga", name: "Ga", country: "Ghana", countryKey: "country.ghana", flag: "🇬🇭" },
  { code: "tw", name: "Asante Twi", country: "Ghana", countryKey: "country.ghana", flag: "🇬🇭" },
  { code: "sw", name: "Swahili", country: "Kenya", countryKey: "country.kenya", flag: "🇰🇪" },
  { code: "st", name: "Sesotho", country: "Lesotho", countryKey: "country.lesotho", flag: "🇱🇸" },
  { code: "mg", name: "Malagasy", country: "Madagascar", countryKey: "country.madagascar", flag: "🇲🇬" },
  { code: "ny", name: "Chichewa", country: "Malawi", countryKey: "country.malawi", flag: "🇲🇼" },
  { code: "ha", name: "Hausa", country: "Nigeria", countryKey: "country.nigeria", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", country: "Nigeria", countryKey: "country.nigeria", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", country: "Nigeria", countryKey: "country.nigeria", flag: "🇳🇬" },
  { code: "pt", name: "Portuguese", country: "Portugal", countryKey: "country.portugal", flag: "🇵🇹" },
  { code: "rw", name: "Kinyarwanda", country: "Rwanda", countryKey: "country.rwanda", flag: "🇷🇼" },
  { code: "wo", name: "Wolof", country: "Senegal", countryKey: "country.senegal", flag: "🇸🇳" },
  { code: "so", name: "Somali", country: "Somalia", countryKey: "country.somalia", flag: "🇸🇴" },
  { code: "af", name: "Afrikaans", country: "South Africa", countryKey: "country.south_africa", flag: "🇿🇦" },
  { code: "xh", name: "Xhosa", country: "South Africa", countryKey: "country.south_africa", flag: "🇿🇦" },
  { code: "zu", name: "Zulu", country: "South Africa", countryKey: "country.south_africa", flag: "🇿🇦" },
  { code: "es", name: "Spanish", country: "Spain", countryKey: "country.spain", flag: "🇪🇸" },
  { code: "en", name: "English", country: "United Kingdom", countryKey: "country.united_kingdom", flag: "🇬🇧" },
  { code: "nd", name: "Northern Ndebele", country: "Zimbabwe", countryKey: "country.zimbabwe", flag: "🇿🇼" },
  { code: "sn", name: "Shona", country: "Zimbabwe", countryKey: "country.zimbabwe", flag: "🇿🇼" },
];

/** Group languages under country headings for pickers. */
export function languagesByCountry(languages = SUPPORTED_LANGUAGES) {
  const sections = [];
  for (const lang of languages) {
    const last = sections[sections.length - 1];
    if (last && last.country === lang.country) {
      last.languages.push(lang);
    } else {
      sections.push({
        country: lang.country,
        countryKey: lang.countryKey,
        languages: [lang],
      });
    }
  }
  return sections;
}

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
