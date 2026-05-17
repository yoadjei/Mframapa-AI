import AsyncStorage from '@react-native-async-storage/async-storage';
import { City } from '../store/useStore';
import { CACHE_TTL_MS, LAST_SYNC_KEY } from '../utils/constants';

const KEY_CITIES = 'offline:cities';
const KEY_LAST_SYNC = `offline:${LAST_SYNC_KEY}`;
const OFFLINE_PREFIX = 'offline:';

export async function saveCities(cities: City[]): Promise<void> {
  await AsyncStorage.setItem(KEY_CITIES, JSON.stringify(cities));
  await AsyncStorage.setItem(KEY_LAST_SYNC, Date.now().toString());
}

export async function loadCities(): Promise<City[]> {
  const raw = await AsyncStorage.getItem(KEY_CITIES);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as City[];
  } catch {
    return [];
  }
}

export async function isCacheStale(): Promise<boolean> {
  const ts = await AsyncStorage.getItem(KEY_LAST_SYNC);
  if (!ts) return true;
  return Date.now() - parseInt(ts, 10) > CACHE_TTL_MS;
}

export async function getLastSyncTime(): Promise<Date | null> {
  const ts = await AsyncStorage.getItem(KEY_LAST_SYNC);
  return ts ? new Date(parseInt(ts, 10)) : null;
}

export async function clearOfflineData(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  await Promise.all(
    allKeys.filter((k) => k.startsWith(OFFLINE_PREFIX)).map((k) => AsyncStorage.removeItem(k))
  );
}

export async function savePredictionForCity(
  cityKey: string,
  prediction: Record<string, unknown>
): Promise<void> {
  await AsyncStorage.setItem(
    `${OFFLINE_PREFIX}pred:${cityKey}`,
    JSON.stringify({ ...prediction, cachedAt: Date.now() })
  );
}

export async function loadPredictionForCity(
  cityKey: string
): Promise<(Record<string, unknown> & { cachedAt: number }) | null> {
  const raw = await AsyncStorage.getItem(`${OFFLINE_PREFIX}pred:${cityKey}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
