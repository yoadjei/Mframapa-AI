import Constants from 'expo-constants';

/** Resolved in app.config.js (rewrites localhost → LAN IP for physical devices). */
export function resolveApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return extra.apiUrl;
  return (
    (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'https://mframapa.ai'
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

/** Supported translation languages backed by Gemini + bundled mobile locale files. */
export const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'Arabic', flag: '🇪🇬' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tn', name: 'Tswana', flag: '🇧🇼' },
  { code: 'rn', name: 'Kirundi', flag: '🇧🇮' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'ti', name: 'Tigrinya', flag: '🇪🇷' },
  { code: 'ss', name: 'Swati', flag: '🇸🇿' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'st', name: 'Sotho', flag: '🇱🇸' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'ny', name: 'Chichewa', flag: '🇲🇼' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'wo', name: 'Wolof', flag: '🇸🇳' },
  { code: 'so', name: 'Somali', flag: '🇸🇴' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
  { code: 'nd', name: 'Ndebele', flag: '🇿🇼' },
  { code: 'ga', name: 'Ga', flag: '🇬🇭' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export function languageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.name ?? code;
}
