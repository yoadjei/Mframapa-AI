import Constants from 'expo-constants';

/** Resolved in app.config.js (rewrites localhost → LAN IP for physical devices). */
export function resolveApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return extra.apiUrl;
  return (
    (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'https://api.mframapa.live'
  );
}

export const API_BASE_URL = resolveApiBaseUrl();

function resolveMapboxToken(): string {
  const extra = Constants.expoConfig?.extra as { mapboxToken?: string } | undefined;
  return (
    extra?.mapboxToken ||
    (process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string | undefined) ||
    ''
  );
}

export const MAPBOX_TOKEN = resolveMapboxToken();

function resolveSupabaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { supabaseUrl?: string } | undefined;
  return (
    extra?.supabaseUrl ||
    (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
    ''
  );
}

function resolveSupabaseAnonKey(): string {
  // Accept both naming styles: the legacy "anon" key (eyJ… JWT) and the
  // newer "publishable" key (sb_publishable_…). Both are client-safe and
  // are passed unchanged into createClient.
  const extra = Constants.expoConfig?.extra as { supabaseAnonKey?: string } | undefined;
  return (
    extra?.supabaseAnonKey ||
    (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
    (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    ''
  );
}

export const SUPABASE_URL = resolveSupabaseUrl();
export const SUPABASE_ANON_KEY = resolveSupabaseAnonKey();

function resolvePaystackPublicKey(): string {
  // pk_test_… for development, pk_live_… for production. Safe to ship in
  // the client bundle (Paystack uses it for Inline checkout only).
  const extra = Constants.expoConfig?.extra as { paystackPublicKey?: string } | undefined;
  return (
    extra?.paystackPublicKey ||
    (process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY as string | undefined) ||
    ''
  );
}

export const PAYSTACK_PUBLIC_KEY = resolvePaystackPublicKey();

export const OFFLINE_CITIES_CACHE_KEY = 'offline_cities_v1';
export const LAST_SYNC_KEY = 'last_sync_timestamp';

export const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const HISTORY_MAX = 20;
export const PREDICTION_DEDUPE_RADIUS = 0.01;

export const MIN_ANDROID_SDK = 21;
export const TARGET_APK_MB = 15;

/**
 * Supported translation languages. Ordered alphabetically by country,
 * then by language name. Asante Twi (not Fante); Ga; Setswana; Sesotho; siSwati.
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'tn', name: 'Setswana', country: 'Botswana', countryKey: 'country.botswana', flag: '🇧🇼' },
  { code: 'rn', name: 'Kirundi', country: 'Burundi', countryKey: 'country.burundi', flag: '🇧🇮' },
  { code: 'ar', name: 'Arabic', country: 'Egypt', countryKey: 'country.egypt', flag: '🇪🇬' },
  { code: 'ti', name: 'Tigrinya', country: 'Eritrea', countryKey: 'country.eritrea', flag: '🇪🇷' },
  { code: 'ss', name: 'siSwati', country: 'Eswatini', countryKey: 'country.eswatini', flag: '🇸🇿' },
  { code: 'am', name: 'Amharic', country: 'Ethiopia', countryKey: 'country.ethiopia', flag: '🇪🇹' },
  { code: 'fr', name: 'French', country: 'France', countryKey: 'country.france', flag: '🇫🇷' },
  { code: 'ga', name: 'Ga', country: 'Ghana', countryKey: 'country.ghana', flag: '🇬🇭' },
  { code: 'tw', name: 'Asante Twi', country: 'Ghana', countryKey: 'country.ghana', flag: '🇬🇭' },
  { code: 'sw', name: 'Swahili', country: 'Kenya', countryKey: 'country.kenya', flag: '🇰🇪' },
  { code: 'st', name: 'Sesotho', country: 'Lesotho', countryKey: 'country.lesotho', flag: '🇱🇸' },
  { code: 'mg', name: 'Malagasy', country: 'Madagascar', countryKey: 'country.madagascar', flag: '🇲🇬' },
  { code: 'ny', name: 'Chichewa', country: 'Malawi', countryKey: 'country.malawi', flag: '🇲🇼' },
  { code: 'ha', name: 'Hausa', country: 'Nigeria', countryKey: 'country.nigeria', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', country: 'Nigeria', countryKey: 'country.nigeria', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', country: 'Nigeria', countryKey: 'country.nigeria', flag: '🇳🇬' },
  { code: 'pt', name: 'Portuguese', country: 'Portugal', countryKey: 'country.portugal', flag: '🇵🇹' },
  { code: 'rw', name: 'Kinyarwanda', country: 'Rwanda', countryKey: 'country.rwanda', flag: '🇷🇼' },
  { code: 'wo', name: 'Wolof', country: 'Senegal', countryKey: 'country.senegal', flag: '🇸🇳' },
  { code: 'so', name: 'Somali', country: 'Somalia', countryKey: 'country.somalia', flag: '🇸🇴' },
  { code: 'af', name: 'Afrikaans', country: 'South Africa', countryKey: 'country.south_africa', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', country: 'South Africa', countryKey: 'country.south_africa', flag: '🇿🇦' },
  { code: 'zu', name: 'Zulu', country: 'South Africa', countryKey: 'country.south_africa', flag: '🇿🇦' },
  { code: 'es', name: 'Spanish', country: 'Spain', countryKey: 'country.spain', flag: '🇪🇸' },
  { code: 'en', name: 'English', country: 'United Kingdom', countryKey: 'country.united_kingdom', flag: '🇬🇧' },
  { code: 'nd', name: 'Northern Ndebele', country: 'Zimbabwe', countryKey: 'country.zimbabwe', flag: '🇿🇼' },
  { code: 'sn', name: 'Shona', country: 'Zimbabwe', countryKey: 'country.zimbabwe', flag: '🇿🇼' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/** Group languages under country headings for pickers. */
export function languagesByCountry(
  languages: readonly (typeof SUPPORTED_LANGUAGES)[number][] = SUPPORTED_LANGUAGES,
) {
  const sections: {
    country: string;
    countryKey: string;
    languages: (typeof SUPPORTED_LANGUAGES)[number][];
  }[] = [];
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

/** the device language when we support it, else english. used on first launch;
 *  a stored choice always wins. someone whose phone is set to Swahili should
 *  not have to find a language picker before the app speaks to them. */
export function detectDeviceLanguage(): string {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
    const base = tag.toLowerCase().split('-')[0];
    return SUPPORTED_LANGUAGES.some((l) => l.code === base) ? base : 'en';
  } catch {
    return 'en';
  }
}

export function languageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.name ?? code;
}
