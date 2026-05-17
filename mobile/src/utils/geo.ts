import { City } from '../store/useStore';

/** Rough bounding box for continental Africa + nearby islands. */
export function isInAfrica(lat: number, lon: number): boolean {
  return lat >= -35.5 && lat <= 37.5 && lon >= -18.5 && lon <= 52.5;
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
