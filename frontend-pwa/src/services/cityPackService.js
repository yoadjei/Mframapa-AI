import { africanCities } from "../data/africanCities.js";

const CITY_PACK_URL = "/city-packs/top-cities.v4.json";
const CITY_PACK_STORAGE_KEY = "mframapa:v2:city-pack:v4";

function dedupeCities(cities) {
  const seen = new Set();
  return cities.filter((city) => {
    const key = `${city.name}|${city.country}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackCities() {
  return dedupeCities(africanCities);
}

/** Pick Aug–Dec usual for the current calendar month (fallback August). */
export function resolveUsual(city, month = new Date().getMonth() + 1) {
  const u = city?.usual;
  if (!u) return null;
  const key = String(month);
  const fromMonths = u.months?.[key] || u.months?.["8"];
  if (fromMonths) {
    return {
      pm25: fromMonths.pm25,
      aqi_category: fromMonths.aqi_category,
      temp: fromMonths.temp,
      humidity: fromMonths.humidity,
      kind: u.kind,
    };
  }
  if (u.aqi_category) {
    return {
      pm25: u.pm25,
      aqi_category: u.aqi_category,
      temp: u.temp,
      humidity: u.humidity,
      kind: u.kind,
    };
  }
  return null;
}

/** One-line usual climate preview for search rows (offline, no API). */
export function formatUsualPreview(city) {
  const u = resolveUsual(city);
  if (!u?.aqi_category) return null;
  const parts = [u.aqi_category];
  if (u.humidity != null) parts.push(`${Math.round(u.humidity)}% humidity`);
  if (u.temp != null) parts.push(`${Math.round(u.temp)}°C`);
  return parts.join(" · ");
}

export function readCachedCityPack() {
  try {
    const raw = localStorage.getItem(CITY_PACK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.cities)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getCachedCities() {
  const cached = readCachedCityPack();
  return cached?.cities ?? fallbackCities();
}

export function cacheCityPack(pack) {
  try {
    localStorage.setItem(CITY_PACK_STORAGE_KEY, JSON.stringify(pack));
  } catch {
    // Ignore write failures in constrained browsers.
  }
}

export async function preloadCityPack() {
  const response = await fetch(CITY_PACK_URL, { cache: "no-cache" });
  if (!response.ok) throw new Error("City pack unavailable");
  const payload = await response.json();
  const cities = dedupeCities(payload?.cities ?? []);
  const pack = {
    version: payload?.version ?? "v4",
    generatedAt: payload?.generatedAt ?? new Date().toISOString(),
    count: cities.length,
    cities: cities.length ? cities : fallbackCities(),
  };
  cacheCityPack(pack);
  return pack;
}

export async function loadCityPack({ preferFresh = false } = {}) {
  if (!preferFresh) {
    const cached = readCachedCityPack();
    if (cached?.cities?.length) return cached;
  }

  try {
    return await preloadCityPack();
  } catch {
    const cached = readCachedCityPack();
    if (cached?.cities?.length) return cached;
    return {
      version: "fallback",
      generatedAt: new Date().toISOString(),
      count: fallbackCities().length,
      cities: fallbackCities(),
    };
  }
}
