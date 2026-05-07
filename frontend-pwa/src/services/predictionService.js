import { africanCities } from "../data/africanCities.js";
import { getPrediction } from "./api.js";
import { getCachedCities } from "./cityPackService.js";

export function findCity(query) {
  if (!query) return null;
  const text = query.trim().toLowerCase();
  const cities = getCachedCities();
  return (
    cities.find((city) => city.name.toLowerCase() === text) ||
    cities.find((city) => city.name.toLowerCase().includes(text)) ||
    africanCities.find((city) => city.name.toLowerCase() === text) ||
    africanCities.find((city) => city.name.toLowerCase().includes(text)) ||
    null
  );
}

export async function fetchCityPrediction(cityName) {
  const city = findCity(cityName);
  if (!city) throw new Error("City not found in supported African cities");

  const response = await getPrediction(city.lat, city.lon, city.name);
  return {
    city,
    pm25: response.pm25,
    category: response.aqi_category,
    degraded: Boolean(response?.sources?.degraded || response?.degraded),
    timestamp: response.timestamp || new Date().toISOString(),
    weather: response.weather ?? null,
    sourceSummary: response.sources_used ?? [],
  };
}
