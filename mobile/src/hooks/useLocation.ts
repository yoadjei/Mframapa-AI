import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export interface ResolvedLocation {
  lat: number;
  lon: number;
  name: string;
}

interface UseLocationReturn {
  loading: boolean;
  error: string | null;
  locate: () => Promise<ResolvedLocation | null>;
  clearError: () => void;
}

export function useLocation(): UseLocationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async (): Promise<ResolvedLocation | null> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const name =
        geo?.city ??
        geo?.district ??
        geo?.region ??
        `${loc.coords.latitude.toFixed(2)}, ${loc.coords.longitude.toFixed(2)}`;
      return { lat: loc.coords.latitude, lon: loc.coords.longitude, name };
    } catch {
      setError('Could not determine your location.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, locate, clearError: () => setError(null) };
}
