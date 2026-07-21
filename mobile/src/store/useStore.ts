import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { markSignOutThisSession } from '../session/authSession';
import {
  signInWithPassword,
  signUpWithPassword,
  signOutSupabase,
  getSupabase,
} from '../services/supabase';

const TRIAL_DAYS = 7;

// ── Activity-feed helper ─────────────────────────────────────────────────────
// Each store mutator that the user can recognise as "something they did" pushes
// an entry here so the Activity Feed screen stays current automatically.
function makeActivity(
  actionKey: string,
  icon: ActivityItem['icon'],
  params?: Record<string, string>,
): ActivityItem {
  const now = new Date();
  return {
    id: `${now.getTime()}-${actionKey}-${Math.random().toString(36).slice(2, 8)}`,
    action: '', // localized at render time via actionKey
    timestamp: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    icon,
    actionKey,
    actionParams: params,
  };
}

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

export interface CommunityPost {
  id: string;
  author: string;
  location: string;
  body: string;
  verified: boolean;
  photoUri?: string;
  createdAt: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  organization: string;
  tier: 'free' | 'researcher' | 'institutional';
  initials: string;
  avatarSeed: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type NotifCategory = 'alert' | 'summary' | 'update' | 'tip';
export type NotifPrefs = Record<NotifCategory, boolean>;

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  alert:   true,
  summary: true,
  update:  true,
  tip:     true,
};

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
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Profile
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  updateProfile: (
    p: Partial<UserProfile>,
  ) => Promise<{ ok: boolean; error?: string }>;

  // Subscription / Trial
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  purchaseToken: string | null;
  // Paid Paystack subscription state
  subscriptionPlan: 'researcher_monthly' | 'researcher_annual' | null;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionReference: string | null;
  startFreeTrial: () => void;
  cancelTrial: () => void;
  activateSubscription: (args: {
    plan: 'researcher_monthly' | 'researcher_annual';
    reference: string;
    intervalDays: number;
    amountUsd: number;
  }) => void;
  restorePurchases: () => Promise<{ ok: boolean; restored: 'trial' | 'researcher' | null }>;
  isTrialActive: () => boolean;
  isSubscriptionActive: () => boolean;
  trialDaysRemaining: () => number;
  trialProgress: () => number;

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

  // Community feed (populated when real backend is wired; empty otherwise).

  // Settings
  alertsEnabled: boolean;
  setAlertsEnabled: (v: boolean) => void;
  paymentCurrency: 'USD' | 'GHS' | 'NGN' | 'KES' | 'ZAR';
  setPaymentCurrency: (c: 'USD' | 'GHS' | 'NGN' | 'KES' | 'ZAR') => void;
  notifPrefs: NotifPrefs;
  setNotifPref: (key: NotifCategory, value: boolean) => void;
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

      signIn: async (email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
          return { ok: false, error: 'Email and password are required.' };
        }
        const res = await signInWithPassword(cleanEmail, password);
        if (!res.ok) return res;
        // Success: hydrate profile from the supabase session and flip flag
        const user = res.session?.user;
        const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
        const fullName     = (meta.full_name    as string | undefined) ?? '';
        const organization = (meta.organization as string | undefined) ?? '';
        const avatarSeed   = (meta.avatar_seed  as string | undefined) ?? '';
        // Use setProfile so initials recompute from the hydrated name.
        get().setProfile({
          email: user?.email ?? cleanEmail,
          fullName:     fullName     || get().profile.fullName,
          organization: organization || get().profile.organization,
          avatarSeed:   avatarSeed   || get().profile.avatarSeed,
        });
        set((s) => ({
          isAuthenticated: true,
          activityFeed: [makeActivity('activity.signed_in', 'lock'), ...s.activityFeed].slice(0, 50),
        }));
        return { ok: true };
      },

      signUp: async (fullName, email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanName  = fullName.trim();
        if (!cleanName) return { ok: false, error: 'Full name is required.' };
        if (!cleanEmail) return { ok: false, error: 'Email is required.' };
        if (password.length < 6) {
          return { ok: false, error: 'Password must be at least 6 characters.' };
        }
        const res = await signUpWithPassword(cleanEmail, password, cleanName);
        if (!res.ok) return res;
        // Use setProfile so initials are recomputed.
        get().setProfile({ email: cleanEmail, fullName: cleanName });
        set((s) => ({
          isAuthenticated: true,
          activityFeed: [makeActivity('activity.account_created', 'person'), ...s.activityFeed].slice(0, 50),
        }));
        return { ok: true };
      },

      signOut: async () => {
        await signOutSupabase();
        // Mark that this session has signed out so the next mount of the
        // onboarding stack lands directly on the auth screen instead of the
        // intro slides.
        markSignOutThisSession();
        set((s) => ({
          isAuthenticated: false,
          activityFeed: [makeActivity('activity.signed_out', 'lock'), ...s.activityFeed].slice(0, 50),
        }));
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
            const parts = p.fullName.trim().split(' ').filter(Boolean);
            updated.initials =
              parts.length >= 2
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : (parts[0]?.slice(0, 2) || '').toUpperCase();
          }
          return { profile: updated };
        }),

      updateProfile: async (p) => {
        // Local update first — gives the UI instant feedback even when
        // offline. Supabase sync happens after.
        get().setProfile(p);

        // Log to activity feed when the user actually changed something
        // user-facing (not just a passing avatar select).
        if (p.fullName !== undefined || p.organization !== undefined) {
          set((s) => ({
            activityFeed: [makeActivity('activity.profile_updated', 'person'), ...s.activityFeed].slice(0, 50),
          }));
        }

        const supabase = getSupabase();
        if (!supabase) return { ok: true };

        const metadata: Record<string, unknown> = {};
        if (p.fullName !== undefined)     metadata.full_name    = p.fullName;
        if (p.organization !== undefined) metadata.organization = p.organization;
        if (p.avatarSeed !== undefined)   metadata.avatar_seed  = p.avatarSeed;

        if (Object.keys(metadata).length === 0) return { ok: true };

        // Skip the network call when the user is signed out — local-only edits
        // are still useful (e.g. picking an avatar before signing up).
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return { ok: true };

        const { error } = await supabase.auth.updateUser({ data: metadata });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },

      // ── Subscription / Trial ─────────────────────────────────────────────
      trialStartedAt: null,
      trialEndsAt:    null,
      purchaseToken:  null,

      subscriptionPlan:       null,
      subscriptionStartedAt:  null,
      subscriptionExpiresAt:  null,
      subscriptionReference:  null,

      activateSubscription: ({ plan, reference, intervalDays, amountUsd }) => {
        const now = new Date();
        const expires = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        set((s) => ({
          subscriptionPlan:      plan,
          subscriptionStartedAt: now.toISOString(),
          subscriptionExpiresAt: expires.toISOString(),
          subscriptionReference: reference,
          purchaseToken:         reference,  // simple alias for restore-from-store
          profile:               { ...s.profile, tier: 'researcher' },
          // Activating a paid plan ends any running trial.
          trialStartedAt: null,
          trialEndsAt:    null,
          activityFeed: [
            makeActivity('activity.subscribed', 'lock', {
              plan: plan === 'researcher_annual' ? 'Researcher Annual' : 'Researcher Monthly',
              amount: amountUsd.toFixed(2),
            }),
            ...s.activityFeed,
          ].slice(0, 50),
        }));
      },

      isSubscriptionActive: () => {
        const exp = get().subscriptionExpiresAt;
        return !!exp && new Date(exp) > new Date();
      },

      startFreeTrial: () => {
        const now = new Date();
        const ends = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        set((s) => ({
          trialStartedAt: now.toISOString(),
          trialEndsAt:    ends.toISOString(),
          profile:        { ...s.profile, tier: 'researcher' },
          activityFeed:   [
            makeActivity('activity.trial_started', 'clock'),
            ...s.activityFeed,
          ].slice(0, 50),
        }));
      },

      restorePurchases: async () => {
        // Local-store restore. When the Paystack backend is wired, this is
        // where you'd hit `GET /payments/subscriptions/me` and reconcile the
        // local state with the server.
        const s = get();
        if (s.subscriptionExpiresAt && new Date(s.subscriptionExpiresAt) > new Date()) {
          set((cur) => ({ profile: { ...cur.profile, tier: 'researcher' } }));
          return { ok: true, restored: 'researcher' };
        }
        if (s.purchaseToken) {
          set((cur) => ({ profile: { ...cur.profile, tier: 'researcher' } }));
          return { ok: true, restored: 'researcher' };
        }
        if (s.trialEndsAt && new Date(s.trialEndsAt) > new Date()) {
          set((cur) => ({ profile: { ...cur.profile, tier: 'researcher' } }));
          return { ok: true, restored: 'trial' };
        }
        return { ok: true, restored: null };
      },

      isTrialActive: () => {
        const ends = get().trialEndsAt;
        return !!ends && new Date(ends) > new Date();
      },

      trialDaysRemaining: () => {
        const ends = get().trialEndsAt;
        if (!ends) return 0;
        const ms = new Date(ends).getTime() - Date.now();
        return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
      },

      // Linear progress from 0 (just started) to 1 (expired) of the trial
      // window. Used by the SubscriptionScreen progress bar.
      trialProgress: () => {
        const s = get();
        if (!s.trialStartedAt || !s.trialEndsAt) return 0;
        const start = new Date(s.trialStartedAt).getTime();
        const end   = new Date(s.trialEndsAt).getTime();
        const now   = Date.now();
        if (now <= start) return 0;
        if (now >= end)   return 1;
        return (now - start) / (end - start);
      },

      cancelTrial: () => {
        set((s) => ({
          trialStartedAt: null,
          trialEndsAt:    null,
          profile:        { ...s.profile, tier: 'free' },
          activityFeed: [
            makeActivity('activity.trial_cancelled', 'lock'),
            ...s.activityFeed,
          ].slice(0, 50),
        }));
      },

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
          activityFeed: [
            makeActivity('activity.checked_city', 'clock', {
              city: p.location.name,
              value: p.pm25.toFixed(0),
            }),
            ...state.activityFeed,
          ].slice(0, 50),
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
          activityFeed: [
            makeActivity('activity.saved_city', 'location', { city: loc.name }),
            ...state.activityFeed,
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
        set((state) => {
          // Respect the master switch and per-category prefs — disabled
          // categories never enter the inbox in the first place.
          if (!state.alertsEnabled) return state;
          if (state.notifPrefs[n.type] === false) return state;
          return { notifications: [n, ...state.notifications].slice(0, 100) };
        }),
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
      paymentCurrency: 'GHS',
      setPaymentCurrency: (c) => set({ paymentCurrency: c }),
      notifPrefs: DEFAULT_NOTIF_PREFS,
      setNotifPref: (key, value) =>
        set((s) => ({ notifPrefs: { ...s.notifPrefs, [key]: value } })),
      liteMode: false,
      setLiteMode: (v) => set({ liteMode: v }),
      dataAnalytics: false,
      setDataAnalytics: (v) => set({ dataAnalytics: v }),
      locationSharing: 'balanced',
      setLocationSharing: (v) => set({ locationSharing: v }),
    }),
    {
      name: 'mframapa-persist',
      version: 5,
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
        notifPrefs: state.notifPrefs,
        paymentCurrency: state.paymentCurrency,
        liteMode: state.liteMode,
        dataAnalytics: state.dataAnalytics,
        locationSharing: state.locationSharing,
        trialStartedAt: state.trialStartedAt,
        trialEndsAt: state.trialEndsAt,
        purchaseToken: state.purchaseToken,
        subscriptionPlan: state.subscriptionPlan,
        subscriptionStartedAt: state.subscriptionStartedAt,
        subscriptionExpiresAt: state.subscriptionExpiresAt,
        subscriptionReference: state.subscriptionReference,
      }),
    }
  )
);
