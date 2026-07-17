import { City } from '../store/useStore';
import citiesBundle from '../data/african_cities.json';

type RawCity = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  urban?: boolean;
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
  }));
  return cached;
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
