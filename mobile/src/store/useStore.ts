import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

export interface PredictionResult {
  pm25: number;
  aqi_category: string;
  uncertainty: {
    pm25_lower: number;
    pm25_upper: number;
  };
  weather: {
    temp: number;
    humidity: number;
    wind: number;
  };
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  factors?: string[];
  model?: string;
}

export interface City {
  name: string;
  country: string;
  lat: number;
  lon: number;
  urban: boolean;
}

const mmkv = new MMKV({ id: 'mframapa-store' });

const mmkvStorage: StateStorage = {
  getItem: (key: string) => {
    const value = mmkv.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string) => {
    mmkv.set(key, value);
  },
  removeItem: (key: string) => {
    mmkv.delete(key);
  },
};

interface AppState {
  isDark: boolean;
  toggleTheme: () => void;

  language: string;
  setLanguage: (lang: string) => void;

  lastPrediction: PredictionResult | null;
  setPrediction: (p: PredictionResult) => void;

  predictionHistory: PredictionResult[];

  offlineCities: City[];
  setOfflineCities: (cities: City[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isDark: true,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),

      language: 'en',
      setLanguage: (lang: string) => set({ language: lang }),

      lastPrediction: null,
      setPrediction: (p: PredictionResult) =>
        set((state) => ({
          lastPrediction: p,
          predictionHistory: [
            p,
            ...state.predictionHistory.filter(
              (h) =>
                !(
                  Math.abs(h.location.lat - p.location.lat) < 0.01 &&
                  Math.abs(h.location.lon - p.location.lon) < 0.01
                )
            ),
          ].slice(0, 20),
        })),

      predictionHistory: [],

      offlineCities: [],
      setOfflineCities: (cities: City[]) => set({ offlineCities: cities }),
    }),
    {
      name: 'mframapa-persist',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        isDark: state.isDark,
        language: state.language,
        lastPrediction: state.lastPrediction,
        predictionHistory: state.predictionHistory,
        offlineCities: state.offlineCities,
      }),
    }
  )
);
