import { City } from '../store/useStore';
import { isAfricanLocation, isInAfricaGeography } from './africanCountries';
import { reverseGeocodeCountryCode } from '../services/mapboxGeocoding';

/** Max distance (degrees) to snap a tap to a catalogued African city (~140 km). */
export const MAX_CITY_SNAP_DEG = 1.25;

/** Geographic pre-check: mainland Africa + African island regions. */
export function isInAfrica(lat: number, lon: number): boolean {
  return isInAfricaGeography(lat, lon);
}

export function squaredDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return dLat * dLat + dLon * dLon;
}

export function nearestCity(lat: number, lon: number, cities: City[]): City | null {
  if (!cities.length) return null;
  let best = cities[0];
  let min = Infinity;
  for (const city of cities) {
    const dist = squaredDistance(lat, lon, city.lat, city.lon);
    if (dist < min) {
      min = dist;
      best = city;
    }
  }
  return best;
}

export function nearestCityWithin(
  lat: number,
  lon: number,
  cities: City[],
  maxDistDeg: number = MAX_CITY_SNAP_DEG
): City | null {
  const nearest = nearestCity(lat, lon, cities);
  if (!nearest) return null;
  const maxSq = maxDistDeg * maxDistDeg;
  if (squaredDistance(lat, lon, nearest.lat, nearest.lon) > maxSq) return null;
  return nearest;
}

/**
 * True when the coordinate lies in an African nation.
 * Uses Mapbox country code when available; otherwise nearest African city in catalog.
 */
export async function isLocationInAfricanNation(
  lat: number,
  lon: number,
  cities: City[] = []
): Promise<boolean> {
  if (!isInAfricaGeography(lat, lon)) return false;

  const countryCode = await reverseGeocodeCountryCode(lat, lon);
  if (countryCode) {
    return isAfricanLocation(lat, lon, countryCode);
  }

  // Offline / geocode miss: only allow near a known African city in our dataset.
  return nearestCityWithin(lat, lon, cities, MAX_CITY_SNAP_DEG) !== null;
}
