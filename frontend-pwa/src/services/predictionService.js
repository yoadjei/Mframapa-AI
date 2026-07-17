import { africanCities } from "../data/africanCities.js";
import { languageName } from "../i18n/languages.js";
import { getPrediction, generateInsight } from "./api.js";
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

export async function fetchCityPrediction(cityName, language = "en") {
  const city = findCity(cityName);
  if (!city) throw new Error("error.city_not_found");

  const response = await getPrediction(city.lat, city.lon, city.name);

  let insight;
  try {
    insight = await generateInsight({
      pm25: response.pm25,
      aqi_category: response.aqi_category,
      weather: response.weather ?? {},
      language,
      language_name: languageName(language),
    });
  } catch {
    insight = undefined;
  }

  return {
    city,
    pm25: response.pm25,
    category: response.aqi_category,
    degraded: Boolean(response?.sources?.degraded || response?.degraded),
    timestamp: response.timestamp || new Date().toISOString(),
    weather: response.weather ?? null,
    sourceSummary: response.sources_used ?? [],
    factors: response.factors ?? null,
    uncertainty: response.uncertainty ?? null,
    model: response.model ?? null,
    insight,
  };
}
