/** Supported UI languages (matches frontend-pwa/src/locales/*.json). */
export const SUPPORTED_LANGUAGES = [
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "am", name: "አማርኛ", flag: "🇪🇹" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ee", name: "Eʋegbe", flag: "🇬🇭" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ga", name: "Ga", flag: "🇬🇭" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
  { code: "mg", name: "Malagasy", flag: "🇲🇬" },
  { code: "nd", name: "isiNdebele", flag: "🇿🇼" },
  { code: "ny", name: "Chichewa", flag: "🇲🇼" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "rn", name: "Kirundi", flag: "🇧🇮" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "sn", name: "ChiShona", flag: "🇿🇼" },
  { code: "so", name: "Soomaali", flag: "🇸🇴" },
  { code: "ss", name: "siSwati", flag: "🇸🇿" },
  { code: "st", name: "Sesotho", flag: "🇱🇸" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "ti", name: "ትግርኛ", flag: "🇪🇷" },
  { code: "tn", name: "Setswana", flag: "🇧🇼" },
  { code: "tw", name: "Twi", flag: "🇬🇭" },
  { code: "wo", name: "Wolof", flag: "🇸🇳" },
  { code: "xh", name: "isiXhosa", flag: "🇿🇦" },
  { code: "yo", name: "Yorùbá", flag: "🇳🇬" },
  { code: "zu", name: "isiZulu", flag: "🇿🇦" },
];

export function languageName(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}
