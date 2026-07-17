import { City, PredictionResult, useStore } from '../store/useStore';
import { getPrediction, generateInsight } from './api';
import { isLocationInAfricanNation, nearestCityWithin, MAX_CITY_SNAP_DEG } from '../utils/geo';
import { loadPredictionForCity, savePredictionForCity } from './offline';

function cityKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)}:${lon.toFixed(2)}`;
}

export async function fetchPredictionForCity(
  city: City,
  language: string
): Promise<PredictionResult> {
  const result = await getPrediction(city.lat, city.lon, city.name, language);
  await savePredictionForCity(
    cityKey(city.lat, city.lon),
    result as unknown as Record<string, unknown>
  );
  useStore.getState().setPrediction(result);
  return result;
}

export async function fetchPredictionAtCoords(
  lat: number,
  lon: number,
  name: string,
  language: string,
  cities: City[]
): Promise<PredictionResult> {
  const allowed = await isLocationInAfricanNation(lat, lon, cities);
  if (!allowed) {
    throw new Error('OUTSIDE_AFRICA');
  }

  let cityName = name;
  const match = nearestCityWithin(lat, lon, cities, MAX_CITY_SNAP_DEG);
  if (match) {
    cityName = match.name;
    lat = match.lat;
    lon = match.lon;
  }

  try {
    return await fetchPredictionForCity(
      { name: cityName, country: match?.country ?? '', lat, lon, urban: match?.urban ?? true },
      language
    );
  } catch (err: unknown) {
    const cached = await loadPredictionForCity(cityKey(lat, lon));
    if (cached && typeof cached === 'object' && 'pm25' in cached) {
      const prediction = cached as unknown as PredictionResult;
      useStore.getState().setPrediction(prediction);
      return prediction;
    }
    throw err;
  }
}
