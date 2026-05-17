import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const PERSISTENCE_KEY = "mframapa:v2:pwa-state";
export const SESSION_KEY = "mframapa:v2:session-token";

const initialState = {
  onboardingComplete: false,
  session: {
    authenticated: false,
    token: null,
    user: null,
  },
  profile: {
    fullName: "",
    email: "",
    organization: "",
  },
  preferences: {
    theme: "system",
    language: "en",
    notificationsEnabled: true,
    privacyMode: "balanced",
    liteMode: false,
  },
  ui: {
    activeScreen: "home",
    selectedCity: null,
  },
  homeSummary: {
    city: "Accra",
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
      return { ...state, onboardingComplete: true };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        session: {
          authenticated: true,
          token: action.payload.token ?? null,
          user: action.payload.user,
        },
        profile: {
          ...state.profile,
          fullName: action.payload.user.fullName ?? state.profile.fullName,
          email: action.payload.user.email ?? state.profile.email,
        },
      };
    case "LOGOUT":
      return {
        ...state,
        session: { authenticated: false, token: null, user: null },
        ui: { activeScreen: "home" },
      };
    case "SET_ACTIVE_SCREEN":
      return { ...state, ui: { ...state.ui, activeScreen: action.payload } };
    case "SELECT_CITY":
      return { ...state, ui: { ...state.ui, selectedCity: action.payload } };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case "UPDATE_PREFERENCES":
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    case "SET_HOME_SUMMARY":
      return { ...state, homeSummary: { ...state.homeSummary, ...action.payload } };
    case "SAVE_CITY": {
      const exists = state.savedCities.find((city) => city.name === action.payload.name);
      if (exists) return state;
      return { ...state, savedCities: [action.payload, ...state.savedCities].slice(0, 20) };
    }
    case "ADD_ACTIVITY":
      return {
        ...state,
        activity: [action.payload, ...state.activity].slice(0, 50),
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 80),
      };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((item) =>
          item.id === action.payload ? { ...item, read: true } : item
        ),
      };
    default:
      return state;
  }
}

function readPersistedState() {
  try {
    const rawState = localStorage.getItem(PERSISTENCE_KEY);
    if (!rawState) return initialState;
    const parsed = JSON.parse(rawState);
    return {
      ...initialState,
      onboardingComplete: parsed.onboardingComplete ?? initialState.onboardingComplete,
      profile: { ...initialState.profile, ...parsed.profile },
      preferences: { ...initialState.preferences, ...parsed.preferences },
      savedCities: parsed.savedCities ?? initialState.savedCities,
      homeSummary: { ...initialState.homeSummary, ...parsed.homeSummary },
      activity: parsed.activity ?? initialState.activity,
      notifications: parsed.notifications ?? initialState.notifications,
      ui: {
        ...initialState.ui,
        selectedCity: parsed.ui?.selectedCity ?? initialState.ui.selectedCity,
      },
      session: {
        ...initialState.session,
        authenticated: Boolean(sessionStorage.getItem(SESSION_KEY)),
        token: sessionStorage.getItem(SESSION_KEY),
      },
    };
  } catch {
    return initialState;
  }
}

function persistState(state) {
  const serializable = {
    onboardingComplete: state.onboardingComplete,
    profile: state.profile,
    preferences: state.preferences,
    savedCities: state.savedCities,
    homeSummary: state.homeSummary,
    activity: state.activity,
    notifications: state.notifications,
    ui: {
      selectedCity: state.ui.selectedCity,
    },
  };
  localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(serializable));

  if (state.session.token) {
    sessionStorage.setItem(SESSION_KEY, state.session.token);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, readPersistedState);

  useEffect(() => {
    persistState(state);
  }, [state]);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const wantsDark =
      state.preferences.theme === "dark" ||
      (state.preferences.theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", wantsDark);
  }, [state.preferences.theme]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
