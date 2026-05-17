import axios from 'axios';
import { PredictionResult } from '../store/useStore';
import { SUPPORTED_LANGUAGES } from '../utils/constants';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://mframapa.ai';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'mframapa-internal-dev-key',
  },
});

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

  const languageName =
    SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name ?? language;

  let insight: string | undefined;
  try {
    insight = await generateInsight({
      pm25: data.pm25,
      aqi_category: data.aqi_category,
      weather: data.weather,
      language,
      language_name: languageName,
    });
  } catch {
    insight = undefined;
  }

  return mapPrediction(data, name, lat, lon, insight);
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
  });
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
