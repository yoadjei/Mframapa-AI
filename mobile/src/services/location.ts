import * as Location from 'expo-location';

export interface GeoLocation {
  lat: number;
  lon: number;
  name: string;
  accuracy?: number;
}

export async function getCurrentLocation(): Promise<GeoLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  let name = `${loc.coords.latitude.toFixed(2)}, ${loc.coords.longitude.toFixed(2)}`;
  try {
    const [geo] = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    name = geo?.city ?? geo?.district ?? geo?.region ?? name;
  } catch {
    // geocoding is best-effort
  }

  return {
    lat: loc.coords.latitude,
    lon: loc.coords.longitude,
    name,
    accuracy: loc.coords.accuracy ?? undefined,
  };
}

export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

export function bucketCoordinates(lat: number, lon: number, precision = 2): string {
  return `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
}
