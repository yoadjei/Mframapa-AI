import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

import { detectDeviceLanguage } from "../i18n/languages.js";

const PERSISTENCE_KEY = "mframapa:v2:pwa-state";
export const SESSION_KEY = "mframapa:v2:session-token";

const initialState = {
  onboardingComplete: false,
  onboardingPhase: "splash", // splash | slides | permissions | auth
  session: {
    authenticated: false,
    token: null,
    user: null,
    tier: "free", // free (every individual) | institutional
  },
  profile: {
    fullName: "",
    email: "",
    organization: "",
    avatar: null,
  },
  preferences: {
    theme: "system",
    // first run follows the device; a stored choice overrides it below
    language: detectDeviceLanguage(),
    notificationsEnabled: true,
    privacyMode: "balanced",
    liteMode: false,
    // 1 is the browser default; larger values scale every rem in the app
    textScale: 1,
    locationSharing: "balanced",
  },
  ui: {
    activeScreen: "home",   // active tab
    screenStack: [],        // [{name, params}] — sub-screen stack on top of active tab
    selectedCity: null,
  },
  homeSummary: {
    // no default city: the app asks the device where it is on first run. a
    // hardcoded city meant someone in kumasi was shown accra's air.
    city: null,
    aqiCategory: "Unknown",
    pm25: null,
    lastUpdated: null,
    degraded: false,
  },
  savedCities: [],
  activity: [],
  notifications: [],
};

const AppStateContext = createContext(null);

function appReducer(state, action) {
  switch (action.type) {
    case "COMPLETE_ONBOARDING":
      return { ...state, onboardingComplete: true, onboardingPhase: "done" };
    case "SET_ONBOARDING_PHASE":
      return { ...state, onboardingPhase: action.payload };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        session: {
          authenticated: true,
          token: action.payload.token ?? null,
          user: action.payload.user,
          tier: action.payload.tier ?? "free",
        },
        profile: {
          ...state.profile,
          firstName: action.payload.user?.firstName ?? state.profile.firstName,
          email: action.payload.user?.email ?? state.profile.email,
        },
        // a home city chosen at sign-up seeds the home screen, but never
        // overrides a city the user has already been looking at on this device.
        homeSummary:
          action.payload.user?.homeCity && state.homeSummary?.city == null
            ? {
                ...state.homeSummary,
                city: action.payload.user.homeCity.name,
                lat: action.payload.user.homeCity.lat,
                lon: action.payload.user.homeCity.lon,
              }
            : state.homeSummary,
      };
    case "RESTORE_SESSION":
      // supabase restored a persisted session on load/refresh — sync app state so
      // the user stays signed in across relaunches instead of bouncing to the start.
      return {
        ...state,
        session: {
          authenticated: true,
          token: action.payload.token ?? null,
          user: action.payload.user,
          tier: action.payload.tier ?? state.session.tier ?? "free",
        },
        profile: {
          ...state.profile,
          firstName: action.payload.user?.firstName ?? state.profile.firstName,
          email: action.payload.user?.email ?? state.profile.email,
        },
        // a home city chosen at sign-up seeds the home screen, but never
        // overrides a city the user has already been looking at on this device.
        homeSummary:
          action.payload.user?.homeCity && state.homeSummary?.city == null
            ? {
                ...state.homeSummary,
                city: action.payload.user.homeCity.name,
                lat: action.payload.user.homeCity.lat,
                lon: action.payload.user.homeCity.lon,
              }
            : state.homeSummary,
      };
    case "LOGOUT":
      return {
        ...state,
        session: { authenticated: false, token: null, user: null, tier: "free" },
        ui: { ...state.ui, activeScreen: "home", screenStack: [] },
      };
    case "UPDATE_TIER":
      return { ...state, session: { ...state.session, tier: action.payload } };

    // ── Tab navigation ──────────────────────────────────────────────
    case "SET_ACTIVE_SCREEN":
      return {
        ...state,
        ui: { ...state.ui, activeScreen: action.payload, screenStack: [] },
      };

    // ── Stack navigation (push sub-screens on top of current tab) ──
    case "NAVIGATE":
      return {
        ...state,
        ui: {
          ...state.ui,
          screenStack: [
            ...state.ui.screenStack,
            { name: action.payload.name, params: action.payload.params ?? {} },
          ],
        },
      };
    case "GO_BACK": {
      const stack = state.ui.screenStack.slice(0, -1);
      return { ...state, ui: { ...state.ui, screenStack: stack } };
    }
    case "RESET_STACK":
      return { ...state, ui: { ...state.ui, screenStack: [] } };

    case "SELECT_CITY":
      return { ...state, ui: { ...state.ui, selectedCity: action.payload } };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case "UPDATE_PREFERENCES":
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    case "SET_HOME_SUMMARY":
      return { ...state, homeSummary: { ...state.homeSummary, ...action.payload } };

    case "SAVE_CITY": {
      const exists = state.savedCities.find((c) => c.name === action.payload.name);
      if (exists) return state;
      return { ...state, savedCities: [action.payload, ...state.savedCities].slice(0, 20) };
    }
    case "REMOVE_CITY":
      return { ...state, savedCities: state.savedCities.filter((c) => c.name !== action.payload) };

    case "ADD_ACTIVITY":
      return { ...state, activity: [action.payload, ...state.activity].slice(0, 50) };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 80) };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case "MARK_ALL_READ":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    default:
      return state;
  }
}

function readPersistedState() {
  try {
    const raw = localStorage.getItem(PERSISTENCE_KEY);
    if (!raw) return initialState;
    const p = JSON.parse(raw);
    return {
      ...initialState,
      onboardingComplete: p.onboardingComplete ?? false,
      profile: { ...initialState.profile, ...p.profile },
      preferences: { ...initialState.preferences, ...p.preferences },
      savedCities: p.savedCities ?? [],
      homeSummary: { ...initialState.homeSummary, ...p.homeSummary },
      activity: p.activity ?? [],
      notifications: p.notifications ?? [],
      ui: {
        ...initialState.ui,
        selectedCity: p.ui?.selectedCity ?? null,
      },
      session: {
        ...initialState.session,
        authenticated: Boolean(sessionStorage.getItem(SESSION_KEY)),
        token: sessionStorage.getItem(SESSION_KEY),
        tier: p.session?.tier ?? "free",
      },
    };
  } catch {
    return initialState;
  }
}

function persistState(state) {
  localStorage.setItem(
    PERSISTENCE_KEY,
    JSON.stringify({
      onboardingComplete: state.onboardingComplete,
      profile: state.profile,
      preferences: state.preferences,
      savedCities: state.savedCities,
      homeSummary: state.homeSummary,
      activity: state.activity,
      notifications: state.notifications,
      session: { tier: state.session.tier },
      ui: { selectedCity: state.ui.selectedCity },
    })
  );
  if (state.session.token) {
    sessionStorage.setItem(SESSION_KEY, state.session.token);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, readPersistedState);

  useEffect(() => { persistState(state); }, [state]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        state.preferences.theme === "dark" ||
        (state.preferences.theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [state.preferences.theme]);

  // ios does not pass the system font size through to web content, so the app
  // has to offer its own control. every size in the interface is in rem, so
  // moving the root size scales all of it together.
  useEffect(() => {
    const scale = state.preferences.textScale ?? 1;
    document.documentElement.style.fontSize = `${Math.round(scale * 100)}%`;
  }, [state.preferences.textScale]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
