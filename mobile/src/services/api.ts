import axios from 'axios';
import { PredictionResult } from '../store/useStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://mframapa.ai';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'mframapa-internal-dev-key',
  },
});

export async function getPrediction(
  lat: number,
  lon: number,
  name: string
): Promise<PredictionResult> {
  const { data } = await client.get('/api/v1/predict', {
    params: { lat, lon, name },
  });

  return {
    pm25: data.pm25,
    aqi_category: data.aqi_category,
    uncertainty: {
      pm25_lower: data.uncertainty?.pm25_lower ?? data.pm25 * 0.85,
      pm25_upper: data.uncertainty?.pm25_upper ?? data.pm25 * 1.15,
    },
    weather: {
      temp: data.weather?.temp ?? 0,
      humidity: data.weather?.humidity ?? 0,
      wind: data.weather?.wind ?? 0,
    },
    location: { name, lat, lon },
    factors: data.factors,
    model: data.model,
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
