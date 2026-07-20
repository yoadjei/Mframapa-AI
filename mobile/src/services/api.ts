import axios, { AxiosError } from 'axios';
import { PredictionResult } from '../store/useStore';
import { API_BASE_URL, languageName } from '../utils/constants';
import { getCurrentSession } from './supabase';

const BASE_URL = API_BASE_URL;

if (__DEV__) {
  console.log('[Mframapa] API base URL:', BASE_URL);
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// the signed-in user's supabase token is the api credential — rate limits and
// paid features are resolved from it server-side. no key is shipped in the app.
client.interceptors.request.use(async (config) => {
  const session = await getCurrentSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ── 429 Rate-limit state ───────────────────────────────────────────────────────
type RateLimitListener = (retryAfterMs: number) => void;
const _rateLimitListeners: Set<RateLimitListener> = new Set();

/** Subscribe to rate-limit events. Returns an unsubscribe fn. */
export function onRateLimit(listener: RateLimitListener): () => void {
  _rateLimitListeners.add(listener);
  return () => _rateLimitListeners.delete(listener);
}

client.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 429) {
      const retryAfterHeader =
        (err.response.headers as Record<string, string>)['retry-after'] ?? '60';
      const retryAfterMs = parseFloat(retryAfterHeader) * 1000;
      _rateLimitListeners.forEach((fn) => fn(retryAfterMs));
    }
    return Promise.reject(err);
  },
);

function mapPrediction(
  data: Record<string, unknown>,
  name: string,
  lat: number,
  lon: number,
  insight?: string
): PredictionResult {
  const uncertainty = data.uncertainty as Record<string, number> | undefined;
  const weather = data.weather as Record<string, number> | undefined;
  const model = data.model as Record<string, string> | undefined;
  const rawFactors = data.factors as Record<string, number> | string[] | undefined;
  const factors = Array.isArray(rawFactors)
    ? rawFactors
    : rawFactors
      ? Object.keys(rawFactors)
      : undefined;

  return {
    pm25: data.pm25 as number,
    aqi_category: data.aqi_category as string,
    uncertainty: {
      pm25_lower: uncertainty?.pm25_lower ?? (data.pm25 as number) * 0.85,
      pm25_upper: uncertainty?.pm25_upper ?? (data.pm25 as number) * 1.15,
    },
    weather: {
      temp: weather?.temp ?? 0,
      humidity: weather?.humidity ?? 0,
      wind: weather?.wind ?? 0,
    },
    location: { name, lat, lon },
    factors,
    model: model?.region_id
      ? `${model.region_id} / ${model.segment ?? 'all'}`
      : undefined,
    insight,
  };
}

export async function getPrediction(
  lat: number,
  lon: number,
  name: string,
  language = 'en'
): Promise<PredictionResult> {
  const { data } = await client.get('/api/v1/predict', {
    params: { lat, lon, name },
  });

  const targetLanguageName = languageName(language);

  let insight: string | undefined;
  try {
    insight = await generateInsight({
      pm25: data.pm25,
      aqi_category: data.aqi_category,
      weather: data.weather,
      language,
      language_name: targetLanguageName,
    });
  } catch {
    insight = undefined;
  }

  return mapPrediction(data, name, lat, lon, insight);
}

export type ForecastDay = {
  date: string;
  day_offset: number;
  pm25: number;
  aqi_category: string;
  uncertainty?: { pm25_lower?: number; pm25_upper?: number };
  inputs: 'full' | 'reduced';
};

export type HistoryDay = {
  date: string;
  days_ago: number;
  pm25: number;
  aqi_category: string;
  uncertainty?: { pm25_lower?: number; pm25_upper?: number };
};

export type MapSummaryCity = {
  name: string;
  lat: number;
  lon: number;
  pm25: number;
  aqi_category: string;
};

// one cached request powering the continental map — a per-city fan-out would
// burn the whole anonymous rate-limit budget on a single screen.
export async function getMapSummary(): Promise<MapSummaryCity[]> {
  const { data } = await client.get('/api/v1/map-summary');
  return data?.cities ?? [];
}

// multi-day outlook. the horizon is capped server-side to the days our weather
// and air-quality inputs actually cover, so this never invents numbers.
export async function getForecast(
  lat: number,
  lon: number,
  name = 'Unknown',
  days = 4
): Promise<ForecastDay[]> {
  const { data } = await client.get('/api/v1/forecast', { params: { lat, lon, name, days } });
  return data?.days ?? [];
}

// recent past, oldest day first. days the archives cannot reconstruct come back
// omitted rather than filled in.
export async function getHistory(
  lat: number,
  lon: number,
  name = 'Unknown',
  days = 14
): Promise<HistoryDay[]> {
  const { data } = await client.get('/api/v1/history', { params: { lat, lon, name, days } });
  return data?.days ?? [];
}

export async function generateInsight(body: {
  pm25: number;
  aqi_category: string;
  weather?: Record<string, unknown>;
  language?: string;
  language_name?: string;
}): Promise<string> {
  const { data } = await client.post('/api/v1/generate-insight', body);
  return data.insight as string;
}

export async function translateUiStrings(
  strings: Record<string, string>,
  targetLanguage: string,
  targetLanguageName?: string
): Promise<{ translations: Record<string, string>; fallback: boolean }> {
  const { data } = await client.post<{
    translations: Record<string, string>;
    fallback?: boolean;
  }>('/api/v1/translate', {
    strings,
    target_language: targetLanguage,
    target_language_name: targetLanguageName ?? '',
  }, { timeout: 90000 });
  return {
    translations: data.translations,
    fallback: data.fallback ?? false,
  };
}

export async function resolveLocation(
  city: string
): Promise<{ lat: number; lon: number; name: string; is_africa: boolean }> {
  const { data } = await client.get('/api/v1/resolve-location', {
    params: { city },
  });
  return data;
}

export async function checkHealth(): Promise<{ status: string }> {
  const { data } = await client.get('/api/v1/health');
  return data;
}

export async function registerPushToken(
  token: string,
  platform: 'android' | 'ios' | 'web',
  lat?: number,
  lon?: number,
): Promise<void> {
  await client.post('/api/v1/register-push-token', { token, platform, lat, lon });
}

export interface AnalyticsEvent {
  device_id: string;
  event: string;
  platform?: 'web' | 'android' | 'ios';
  country?: string;
}

export async function postEvents(events: AnalyticsEvent[]): Promise<void> {
  await client.post('/api/v1/events', { events });
}

export async function syncTranslations(
  lang: string,
  langName?: string,
): Promise<{ translations: Record<string, string>; fallback: boolean }> {
  const { data } = await client.get<{
    translations: Record<string, string>;
    fallback: boolean;
  }>('/api/v1/translations/sync', {
    params: { lang, lang_name: langName ?? '' },
    timeout: 90000,
  });
  return { translations: data.translations, fallback: data.fallback };
}

export async function suggestTranslation(body: {
  key: string;
  original: string;
  suggested: string;
  language: string;
  language_name?: string;
}): Promise<void> {
  await client.post('/api/v1/translations/suggest', body);
}
