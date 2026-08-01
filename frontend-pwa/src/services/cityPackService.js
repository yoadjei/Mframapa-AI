import { africanCities } from "../data/africanCities.js";

const CITY_PACK_URL = "/city-packs/top-cities.v5.json";
const PACK_VERSION = "v5";

/** In-memory only — full packs exceed localStorage quotas (~5MB). */
let memoryPack = null;

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
  return memoryPack;
}

export function getCachedCities() {
  return memoryPack?.cities ?? fallbackCities();
}

export function cacheCityPack(pack) {
  memoryPack = pack;
}

async function fetchPackFromNetwork() {
  // Prefer HTTP/SW cache so the large JSON isn't re-downloaded every session.
  const response = await fetch(CITY_PACK_URL, { cache: "force-cache" });
  if (!response.ok) throw new Error("City pack unavailable");
  const payload = await response.json();
  const cities = dedupeCities(payload?.cities ?? []);
  const pack = {
    version: payload?.version ?? PACK_VERSION,
    generatedAt: payload?.generatedAt ?? new Date().toISOString(),
    count: cities.length,
    cities: cities.length ? cities : fallbackCities(),
  };
  cacheCityPack(pack);
  return pack;
}

export async function preloadCityPack() {
  return fetchPackFromNetwork();
}

export async function loadCityPack({ preferFresh = false } = {}) {
  if (!preferFresh && memoryPack?.cities?.length) return memoryPack;

  try {
    return await fetchPackFromNetwork();
  } catch {
    if (memoryPack?.cities?.length) return memoryPack;
    const cities = fallbackCities();
    return {
      version: "fallback",
      generatedAt: new Date().toISOString(),
      count: cities.length,
      cities,
    };
  }
}
