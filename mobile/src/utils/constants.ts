export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'https://mframapa.ai';

export const MAPBOX_TOKEN =
  (process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string | undefined) ??
  'pk.eyJ1IjoieW9hZGplaSIsImEiOiJjbWprcjI4b3QyNHBpM2Nxem4xM2VwNWF4In0.z6NbrlGRmQdT-vlYk5bjMw';

export const OFFLINE_CITIES_CACHE_KEY = 'offline_cities_v1';
export const LAST_SYNC_KEY = 'last_sync_timestamp';

export const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const HISTORY_MAX = 20;
export const PREDICTION_DEDUPE_RADIUS = 0.01;

export const MIN_ANDROID_SDK = 21;
export const TARGET_APK_MB = 15;

/** Matches V1 webapp locale files in frontend-pwa/src/locales/ */
export const SUPPORTED_LANGUAGES = [
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ee', name: 'Eʋegbe', flag: '🇬🇭' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ga', name: 'Ga', flag: '🇬🇭' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'nd', name: 'isiNdebele', flag: '🇿🇼' },
  { code: 'ny', name: 'Chichewa', flag: '🇲🇼' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'rn', name: 'Kirundi', flag: '🇧🇮' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'sn', name: 'ChiShona', flag: '🇿🇼' },
  { code: 'so', name: 'Soomaali', flag: '🇸🇴' },
  { code: 'ss', name: 'siSwati', flag: '🇸🇿' },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  { code: 'ti', name: 'ትግርኛ', flag: '🇪🇷' },
  { code: 'tn', name: 'Setswana', flag: '🇧🇼' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭' },
  { code: 'wo', name: 'Wolof', flag: '🇸🇳' },
  { code: 'xh', name: 'isiXhosa', flag: '🇿🇦' },
  { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
  { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];
