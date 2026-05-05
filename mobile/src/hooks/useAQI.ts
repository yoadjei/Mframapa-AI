import { useState, useCallback } from 'react';
import { getPrediction } from '../services/api';
import { useStore, PredictionResult } from '../store/useStore';

interface UseAQIReturn {
  loading: boolean;
  error: string | null;
  fetch: (lat: number, lon: number, name: string) => Promise<PredictionResult | null>;
  clearError: () => void;
}

export function useAQI(): UseAQIReturn {
  const setPrediction = useStore((s) => s.setPrediction);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (lat: number, lon: number, name: string): Promise<PredictionResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPrediction(lat, lon, name);
        setPrediction(result);
        return result;
      } catch (err: any) {
        const msg =
          err?.message?.toLowerCase().includes('network') || err?.code === 'ERR_NETWORK'
            ? 'Network error — check your connection.'
            : 'Could not fetch air quality data.';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setPrediction]
  );

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, fetch, clearError };
}
