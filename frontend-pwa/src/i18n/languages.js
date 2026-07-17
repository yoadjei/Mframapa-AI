/** Supported UI languages (matches frontend-pwa/src/locales/*.json). */
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
