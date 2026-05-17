import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  insight?: string;
}

export interface City {
  name: string;
  country: string;
  lat: number;
  lon: number;
  urban: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  language: string;
  setLanguage: (lang: string) => void;

  lastPrediction: PredictionResult | null;
  setPrediction: (p: PredictionResult) => void;

  predictionHistory: PredictionResult[];
  clearHistory: () => void;

  offlineCities: City[];
  setOfflineCities: (cities: City[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (mode: ThemeMode) => set({ themeMode: mode }),

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
      clearHistory: () => set({ predictionHistory: [] }),

      offlineCities: [],
      setOfflineCities: (cities: City[]) => set({ offlineCities: cities }),
    }),
    {
      name: 'mframapa-persist',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<AppState> & {
          isDark?: boolean;
          themeMode?: ThemeMode;
        };

        if ((version ?? 0) < 2 && state.themeMode == null) {
          return {
            ...state,
            themeMode:
              typeof state.isDark === 'boolean'
                ? state.isDark
                  ? 'dark'
                  : 'light'
                : 'system',
          };
        }

        return {
          ...state,
          themeMode: state.themeMode ?? 'system',
        };
      },
      partialize: (state) => ({
        themeMode: state.themeMode,
        language: state.language,
        lastPrediction: state.lastPrediction,
        predictionHistory: state.predictionHistory,
        offlineCities: state.offlineCities,
      }),
    }
  )
);
