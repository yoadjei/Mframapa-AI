import { africanCities } from "../data/africanCities.js";

const CITY_PACK_URL = "/city-packs/top-cities.v1.json";
const CITY_PACK_STORAGE_KEY = "mframapa:v2:city-pack:v1";

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
  return dedupeCities(africanCities).slice(0, 500);
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
    version: payload?.version ?? "v1",
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
