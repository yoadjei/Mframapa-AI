import { City } from '../store/useStore';
import citiesBundle from '../data/african_cities.json';

type MonthUsual = {
  pm25: number;
  aqi_category: string;
  temp: number;
  humidity: number;
};

type RawUsual = MonthUsual & {
  kind?: string;
  months?: Record<string, MonthUsual>;
};

type RawCity = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  urban?: boolean;
  usual?: RawUsual;
};

let cached: City[] | null = null;

export function getAfricanCities(): City[] {
  if (cached) return cached;
  const raw = (citiesBundle as { cities: RawCity[] }).cities ?? [];
  cached = raw.map((c) => ({
    name: c.name,
    country: c.country,
    lat: c.lat,
    lon: c.lon,
    urban: c.urban ?? true,
    usual: c.usual
      ? {
          pm25: c.usual.pm25,
          aqi_category: c.usual.aqi_category,
          temp: c.usual.temp,
          humidity: c.usual.humidity,
          kind: c.usual.kind,
          months: c.usual.months,
        }
      : undefined,
  }));
  return cached;
}

export function resolveUsual(
  city: {
    usual?: {
      pm25?: number;
      aqi_category?: string;
      temp?: number;
      humidity?: number;
      kind?: string;
      months?: Record<string, MonthUsual>;
    };
  },
  month = new Date().getMonth() + 1,
): MonthUsual & { kind?: string } | null {
  const u = city?.usual;
  if (!u) return null;
  const fromMonths = u.months?.[String(month)] || u.months?.['8'];
  if (fromMonths) {
    return { ...fromMonths, kind: u.kind };
  }
  if (u.aqi_category) {
    return {
      pm25: u.pm25 ?? 0,
      aqi_category: u.aqi_category,
      temp: u.temp ?? 0,
      humidity: u.humidity ?? 0,
      kind: u.kind,
    };
  }
  return null;
}

/** Offline search preview — no network. Uses current month when baked. */
export function formatUsualPreview(city: {
  usual?: {
    aqi_category?: string;
    humidity?: number;
    temp?: number;
    months?: Record<string, MonthUsual>;
  };
}): string | null {
  const u = resolveUsual(city);
  if (!u?.aqi_category) return null;
  const parts = [u.aqi_category];
  if (u.humidity != null) parts.push(`${Math.round(u.humidity)}% humidity`);
  if (u.temp != null) parts.push(`${Math.round(u.temp)}°C`);
  return parts.join(' · ');
}

export function searchCities(query: string, cities: City[], limit = 100): City[] {
  const text = query.trim().toLowerCase();
  if (!text) return cities.slice(0, 50);
  return cities
    .filter(
      (c) =>
        c.name.toLowerCase().includes(text) || c.country.toLowerCase().includes(text)
    )
    .slice(0, limit);
}
