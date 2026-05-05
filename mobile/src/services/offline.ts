import { MMKV } from 'react-native-mmkv';
import { City } from '../store/useStore';
import { CACHE_TTL_MS, LAST_SYNC_KEY } from '../utils/constants';

const storage = new MMKV({ id: 'mframapa-offline' });

export function saveCities(cities: City[]): void {
  storage.set('cities', JSON.stringify(cities));
  storage.set(LAST_SYNC_KEY, Date.now().toString());
}

export function loadCities(): City[] {
  const raw = storage.getString('cities');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as City[];
  } catch {
    return [];
  }
}

export function isCacheStale(): boolean {
  const ts = storage.getString(LAST_SYNC_KEY);
  if (!ts) return true;
  return Date.now() - parseInt(ts, 10) > CACHE_TTL_MS;
}

export function getLastSyncTime(): Date | null {
  const ts = storage.getString(LAST_SYNC_KEY);
  return ts ? new Date(parseInt(ts, 10)) : null;
}

export function clearOfflineData(): void {
  storage.clearAll();
}

export function savePredictionForCity(
  cityKey: string,
  prediction: Record<string, unknown>
): void {
  storage.set(`pred:${cityKey}`, JSON.stringify({ ...prediction, cachedAt: Date.now() }));
}

export function loadPredictionForCity(
  cityKey: string
): (Record<string, unknown> & { cachedAt: number }) | null {
  const raw = storage.getString(`pred:${cityKey}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
