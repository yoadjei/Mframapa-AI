export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'https://mframapa.ai';

export const OFFLINE_CITIES_CACHE_KEY = 'offline_cities_v1';
export const LAST_SYNC_KEY = 'last_sync_timestamp';

export const CACHE_TTL_MS = 6 * 60 * 60 * 1000;   // 6 hours
export const HISTORY_MAX = 20;
export const PREDICTION_DEDUPE_RADIUS = 0.01;       // ~1 km

export const MIN_ANDROID_SDK = 21;
export const TARGET_APK_MB = 15;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ha', name: 'Hausa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'العربية' },
  { code: 'tw', name: 'Twi' },
  { code: 'ig', name: 'Igbo' },
  { code: 'so', name: 'Somali' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'sn', name: 'Shona' },
  { code: 'zu', name: 'Zulu' },
  { code: 'pt', name: 'Português' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];
