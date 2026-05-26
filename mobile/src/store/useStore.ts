import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { markSignOutThisSession } from '../session/authSession';

export interface PredictionResult {
  pm25: number;
  aqi_category: string;
  uncertainty: { pm25_lower: number; pm25_upper: number };
  weather: { temp: number; humidity: number; wind: number };
  location: { name: string; lat: number; lon: number };
  factors?: string[];
  model?: string;
  insight?: string;
  timestamp?: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  lastPm25?: number;
  lastAqiCategory?: string;
  lastChecked?: string;
}

export interface City {
  name: string;
  country: string;
  lat: number;
  lon: number;
  urban: boolean;
}

export interface Notification {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'summary' | 'update' | 'tip';
  titleKey?: string;
  titleParams?: Record<string, string>;
  subtitleKey?: string;
  subtitleParams?: Record<string, string>;
  timestampKey?: string;
  timestampParams?: Record<string, string>;
}

export interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  icon: 'clock' | 'person' | 'lock' | 'location';
  actionKey?: string;
  actionParams?: Record<string, string>;
  timestampKey?: string;
  timestampParams?: Record<string, string>;
}

export interface UserProfile {
  fullName: string;
  email: string;
  organization: string;
  tier: 'free' | 'pro' | 'enterprise';
  initials: string;
  avatarSeed: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Language
  language: string;
  setLanguage: (lang: string) => void;

  // Auth
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  signOut: () => void;

  // Profile
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;

  // AQI predictions
  lastPrediction: PredictionResult | null;
  setPrediction: (p: PredictionResult) => void;
  predictionHistory: PredictionResult[];
  clearHistory: () => void;

  // Saved locations
  savedLocations: SavedLocation[];
  addSavedLocation: (loc: SavedLocation) => void;
  removeSavedLocation: (id: string) => void;
  updateSavedLocation: (id: string, update: Partial<SavedLocation>) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: () => number;

  // Activity feed
  activityFeed: ActivityItem[];
  addActivity: (item: ActivityItem) => void;

  // Offline cities
  offlineCities: City[];
  setOfflineCities: (cities: City[]) => void;

  // Settings
  alertsEnabled: boolean;
  setAlertsEnabled: (v: boolean) => void;
  liteMode: boolean;
  setLiteMode: (v: boolean) => void;
  dataAnalytics: boolean;
  setDataAnalytics: (v: boolean) => void;
  locationSharing: 'off' | 'balanced' | 'precise';
  setLocationSharing: (v: 'off' | 'balanced' | 'precise') => void;
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'AQI Alert: Accra',
    subtitle: 'PM2.5 has risen to unhealthy levels',
    timestamp: '2 hours ago',
    read: false,
    type: 'alert',
    titleKey: 'alerts.sample.aqi_alert',
    titleParams: { city: 'Accra' },
    subtitleKey: 'alerts.sample.pm25_risen',
    timestampKey: 'time.hours_ago',
    timestampParams: { count: '2' },
  },
  {
    id: '2',
    title: 'Daily AQI Summary',
    subtitle: 'Terna',
    timestamp: '4 hours ago',
    read: false,
    type: 'summary',
    titleKey: 'alerts.sample.daily_summary',
    timestampKey: 'time.hours_ago',
    timestampParams: { count: '4' },
  },
  {
    id: '3',
    title: 'Air Quality Update',
    subtitle: 'Kumasi',
    timestamp: '1 day ago',
    read: true,
    type: 'update',
    titleKey: 'alerts.sample.air_quality_update',
    timestampKey: 'time.day_ago',
    timestampParams: { count: '1' },
  },
  {
    id: '4',
    title: 'Mframapa Tips',
    subtitle: 'Kumasi',
    timestamp: '2 days ago',
    read: true,
    type: 'tip',
    titleKey: 'alerts.sample.tips',
    timestampKey: 'time.days_ago',
    timestampParams: { count: '2' },
  },
];

const DEFAULT_ACTIVITY_FEED: ActivityItem[] = [
  {
    id: '1',
    action: 'Checked Accra: 42 μg/m³',
    timestamp: '12:39 AM',
    icon: 'clock',
    actionKey: 'activity.checked_city',
    actionParams: { city: 'Accra', value: '42' },
  },
  {
    id: '2',
    action: 'Profile updated',
    timestamp: '12:39 AM',
    icon: 'person',
    actionKey: 'activity.profile_updated',
  },
  {
    id: '3',
    action: 'Signed in',
    timestamp: '12:39 AM',
    icon: 'lock',
    actionKey: 'activity.signed_in',
  },
  {
    id: '4',
    action: 'Checked Accra: 42 μg/m³',
    timestamp: '12:39 AM',
    icon: 'clock',
    actionKey: 'activity.checked_city',
    actionParams: { city: 'Accra', value: '42' },
  },
  {
    id: '5',
    action: 'Signed in',
    timestamp: '12:39 AM',
    icon: 'lock',
    actionKey: 'activity.signed_in',
  },
];

function migrateNotification(notification: Notification): Notification {
  const next = { ...notification };

  if (!next.titleKey) {
    const alertMatch = next.title.match(/^AQI Alert: (.+)$/);
    if (alertMatch) {
      next.titleKey = 'alerts.sample.aqi_alert';
      next.titleParams = { city: alertMatch[1] };
    } else if (next.title === 'Daily AQI Summary') {
      next.titleKey = 'alerts.sample.daily_summary';
    } else if (next.title === 'Air Quality Update') {
      next.titleKey = 'alerts.sample.air_quality_update';
    } else if (next.title === 'Mframapa Tips') {
      next.titleKey = 'alerts.sample.tips';
    }
  }

  if (!next.subtitleKey && next.subtitle === 'PM2.5 has risen to unhealthy levels') {
    next.subtitleKey = 'alerts.sample.pm25_risen';
  }

  if (!next.timestampKey) {
    const hoursMatch = next.timestamp.match(/^(\d+) hours ago$/);
    const daysMatch = next.timestamp.match(/^(\d+) days ago$/);
    const dayMatch = next.timestamp.match(/^(\d+) day ago$/);
    if (hoursMatch) {
      next.timestampKey = 'time.hours_ago';
      next.timestampParams = { count: hoursMatch[1] };
    } else if (daysMatch) {
      next.timestampKey = 'time.days_ago';
      next.timestampParams = { count: daysMatch[1] };
    } else if (dayMatch) {
      next.timestampKey = 'time.day_ago';
      next.timestampParams = { count: dayMatch[1] };
    }
  }

  return next;
}

function migrateActivityItem(item: ActivityItem): ActivityItem {
  const next = { ...item };

  if (!next.actionKey) {
    const checkedMatch = next.action.match(/^Checked (.+): ([0-9.]+) μg\/m³$/);
    if (checkedMatch) {
      next.actionKey = 'activity.checked_city';
      next.actionParams = { city: checkedMatch[1], value: checkedMatch[2] };
    } else if (next.action === 'Profile updated') {
      next.actionKey = 'activity.profile_updated';
    } else if (next.action === 'Signed in') {
      next.actionKey = 'activity.signed_in';
    }
  }

  return next;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      themeMode: 'dark',
      setThemeMode: (mode) => set({ themeMode: mode }),

      language: 'en',
      setLanguage: (lang) => {
        void import('../services/translation').then(({ clearLocaleCache }) => clearLocaleCache(lang));
        set({ language: lang });
      },

      isAuthenticated: false,
      setAuthenticated: (v) => set({ isAuthenticated: v }),
      signOut: () => {
        markSignOutThisSession();
        set({ isAuthenticated: false });
      },

      profile: {
        fullName: '',
        email: '',
        organization: '',
        tier: 'free',
        initials: 'YA',
        avatarSeed: '',
      },
      setProfile: (p) =>
        set((state) => {
          const updated = { ...state.profile, ...p };
          if (p.fullName !== undefined) {
            const parts = p.fullName.trim().split(' ');
            updated.initials =
              parts.length >= 2
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : parts[0].slice(0, 2).toUpperCase();
          }
          return { profile: updated };
        }),

      lastPrediction: null,
      setPrediction: (p) =>
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

      savedLocations: [],
      addSavedLocation: (loc) =>
        set((state) => ({
          savedLocations: [
            loc,
            ...state.savedLocations.filter((s) => s.id !== loc.id),
          ].slice(0, 50),
        })),
      removeSavedLocation: (id) =>
        set((state) => ({
          savedLocations: state.savedLocations.filter((s) => s.id !== id),
        })),
      updateSavedLocation: (id, update) =>
        set((state) => ({
          savedLocations: state.savedLocations.map((s) =>
            s.id === id ? { ...s, ...update } : s
          ),
        })),

      notifications: DEFAULT_NOTIFICATIONS,
      addNotification: (n) =>
        set((state) => ({ notifications: [n, ...state.notifications].slice(0, 100) })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      activityFeed: DEFAULT_ACTIVITY_FEED,
      addActivity: (item) =>
        set((state) => ({ activityFeed: [item, ...state.activityFeed].slice(0, 50) })),

      offlineCities: [],
      setOfflineCities: (cities) => set({ offlineCities: cities }),

      alertsEnabled: true,
      setAlertsEnabled: (v) => set({ alertsEnabled: v }),
      liteMode: false,
      setLiteMode: (v) => set({ liteMode: v }),
      dataAnalytics: false,
      setDataAnalytics: (v) => set({ dataAnalytics: v }),
      locationSharing: 'balanced',
      setLocationSharing: (v) => set({ locationSharing: v }),
    }),
    {
      name: 'mframapa-persist',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<AppState> & { isDark?: boolean };
        return {
          ...state,
          themeMode: state.themeMode ?? (state.isDark ? 'dark' : 'system'),
          notifications: state.notifications?.map(migrateNotification) ?? DEFAULT_NOTIFICATIONS,
          activityFeed: state.activityFeed?.map(migrateActivityItem) ?? DEFAULT_ACTIVITY_FEED,
        };
      },
      partialize: (state) => ({
        themeMode: state.themeMode,
        language: state.language,
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
        lastPrediction: state.lastPrediction,
        predictionHistory: state.predictionHistory,
        savedLocations: state.savedLocations,
        notifications: state.notifications,
        activityFeed: state.activityFeed,
        offlineCities: state.offlineCities,
        alertsEnabled: state.alertsEnabled,
        liteMode: state.liteMode,
        dataAnalytics: state.dataAnalytics,
        locationSharing: state.locationSharing,
      }),
    }
  )
);
