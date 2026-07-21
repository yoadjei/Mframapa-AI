import React, { Suspense, useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppState } from "../state/appState.jsx";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { useInstallPrompt } from "../hooks/useInstallPrompt.js";
import { CloudRainBackground } from "../components/background/CloudRainBackground.jsx";
import { NetworkBanner } from "../components/feedback/NetworkBanner.jsx";
import { MobileShell } from "../components/layout/MobileShell.jsx";
import { OnboardingScreen } from "../features/onboarding/OnboardingScreen.jsx";
import { AuthScreen } from "../features/auth/AuthScreen.jsx";
import { HomeScreen } from "../features/home/HomeScreen.jsx";
import { PreviewGallery } from "../features/preview/PreviewGallery.jsx";
import { preloadCityPack } from "../services/cityPackService.js";
import { trackAppOpen } from "../services/analytics.js";
import { restoreSession, onAuthChange } from "../services/authService.js";

// ── Tab screens (loaded eagerly — they are the main experience) ─────────────
// All screen files use named exports; .then() wraps them as the default export
// that React.lazy() requires.
const CoreFeatureScreen = React.lazy(() =>
  import("../features/core/CoreFeatureScreen.jsx")
    .then((m) => ({ default: m.CoreFeatureScreen }))
    .catch(fallback("Map"))
);
const ActivityScreen = React.lazy(() =>
  import("../features/activity/ActivityScreen.jsx")
    .then((m) => ({ default: m.ActivityScreen }))
    .catch(fallback("Activity"))
);
const SearchScreen = React.lazy(() =>
  import("../features/search/SearchScreen.jsx")
    .then((m) => ({ default: m.SearchScreen }))
    .catch(fallback("Search"))
);
const ProfileScreen = React.lazy(() =>
  import("../features/profile/ProfileScreen.jsx")
    .then((m) => ({ default: m.ProfileScreen }))
    .catch(fallback("Profile"))
);
const SettingsScreen = React.lazy(() =>
  import("../features/settings/SettingsScreen.jsx")
    .then((m) => ({ default: m.SettingsScreen }))
    .catch(fallback("Settings"))
);
const NotificationsScreen = React.lazy(() =>
  import("../features/notifications/NotificationsScreen.jsx")
    .then((m) => ({ default: m.NotificationsScreen }))
    .catch(fallback("Alerts"))
);

// ── Stack screens (sub-pages opened via navigate()) ─────────────────────────
const CityDetailScreen = React.lazy(() =>
  import("../features/cityDetail/CityDetailScreen.jsx")
    .then((m) => ({ default: m.CityDetailScreen }))
    .catch(fallback("City Detail"))
);
const HealthRiskScreen = React.lazy(() =>
  import("../features/healthRisk/HealthRiskScreen.jsx")
    .then((m) => ({ default: m.HealthRiskScreen }))
    .catch(fallback("Health Risk"))
);
const LanguageSelectorScreen = React.lazy(() =>
  import("../features/language/LanguageSelectorScreen.jsx")
    .then((m) => ({ default: m.LanguageSelectorScreen }))
    .catch(fallback("Language"))
);
const SavedLocationsScreen = React.lazy(() =>
  import("../features/savedLocations/SavedLocationsScreen.jsx")
    .then((m) => ({ default: m.SavedLocationsScreen }))
    .catch(fallback("Saved Locations"))
);
const LandingMarketingScreen = React.lazy(() =>
  import("../features/landing/LandingMarketingScreen.jsx")
    .then((m) => ({ default: m.LandingMarketingScreen }))
    .catch(fallback("About"))
);
const AIInsightsScreen = React.lazy(() =>
  import("../features/aiInsights/AIInsightsScreen.jsx")
    .then((m) => ({ default: m.AIInsightsScreen }))
    .catch(fallback("AI Insights"))
);
const PredictionDashboardScreen = React.lazy(() =>
  import("../features/predictionDashboard/PredictionDashboardScreen.jsx")
    .then((m) => ({ default: m.PredictionDashboardScreen }))
    .catch(fallback("Prediction Dashboard"))
);
const CountryExplorerScreen = React.lazy(() =>
  import("../features/countryExplorer/CountryExplorerScreen.jsx")
    .then((m) => ({ default: m.CountryExplorerScreen }))
    .catch(fallback("Country Explorer"))
);
const CompareCitiesScreen = React.lazy(() =>
  import("../features/compareCities/CompareCitiesScreen.jsx")
    .then((m) => ({ default: m.CompareCitiesScreen }))
    .catch(fallback("Compare Cities"))
);
const TrustTransparencyScreen = React.lazy(() =>
  import("../features/trust/TrustTransparencyScreen.jsx")
    .then((m) => ({ default: m.TrustTransparencyScreen }))
    .catch(fallback("Trust & Transparency"))
);
const ExportCentreScreen = React.lazy(() =>
  import("../features/export/ExportCentreScreen.jsx")
    .then((m) => ({ default: m.ExportCentreScreen }))
    .catch(fallback("Export Centre"))
);
const FeedbackFormScreen = React.lazy(() =>
  import("../features/feedback/FeedbackFormScreen.jsx")
    .then((m) => ({ default: m.FeedbackFormScreen }))
    .catch(fallback("Feedback"))
);
const AboutLegalScreen = React.lazy(() =>
  import("../features/about/AboutLegalScreen.jsx")
    .then((m) => ({ default: m.AboutLegalScreen }))
    .catch(fallback("About & Legal"))
);
const AnomalyAlertScreen = React.lazy(() =>
  import("../features/anomaly/AnomalyAlertScreen.jsx")
    .then((m) => ({ default: m.AnomalyAlertScreen }))
    .catch(fallback("Anomaly Alert"))
);
const DeleteAccountScreen = React.lazy(() =>
  import("../features/deleteAccount/DeleteAccountScreen.jsx")
    .then((m) => ({ default: m.DeleteAccountScreen }))
    .catch(fallback("Delete Account"))
);
const ErrorScreen = React.lazy(() =>
  import("../features/system/ErrorScreen.jsx")
    .then((m) => ({ default: m.ErrorScreen }))
    .catch(fallback("Error"))
);
const OfflineCityPickerScreen = React.lazy(() =>
  import("../features/system/OfflineCityPickerScreen.jsx")
    .then((m) => ({ default: m.OfflineCityPickerScreen }))
    .catch(fallback("Offline Cities"))
);

// ── Screen name → component maps ─────────────────────────────────────────────
const TAB_SCREENS = {
  home: HomeScreen,
  core: CoreFeatureScreen,
  activity: ActivityScreen,
  search: SearchScreen,
  notifications: NotificationsScreen,
  profile: ProfileScreen,
  settings: SettingsScreen,
};

const STACK_SCREENS = {
  auth:                AuthScreen,   // optional sign-in, opened from Profile
  cityDetail:          CityDetailScreen,
  healthRisk:          HealthRiskScreen,
  languageSelector:    LanguageSelectorScreen,
  savedLocations:      SavedLocationsScreen,
  landing:             LandingMarketingScreen,
  aiInsights:          AIInsightsScreen,
  predictionDashboard: PredictionDashboardScreen,
  countryExplorer:     CountryExplorerScreen,
  compareCities:       CompareCitiesScreen,
  trust:               TrustTransparencyScreen,
  trustTransparency:   TrustTransparencyScreen,
  exportCentre:        ExportCentreScreen,
  feedback:            FeedbackFormScreen,
  feedbackForm:        FeedbackFormScreen,
  about:               AboutLegalScreen,
  aboutLegal:          AboutLegalScreen,
  anomalyAlert:        AnomalyAlertScreen,
  deleteAccount:       DeleteAccountScreen,
  error:               ErrorScreen,
  offlineCityPicker:   OfflineCityPickerScreen,
  // These tab screens are also reachable as stack screens (from "+" and Profile menus)
  // so the global back button appears on them.
  activity:      ActivityScreen,
  settings:      SettingsScreen,
  notifications: NotificationsScreen,
  search:        SearchScreen,
};

// ── Lazy fallback factory ──────────────────────────────────────────────────
function fallback(name) {
  return () => ({
    default: function ComingSoon() {
      return (
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="h-12 w-12 rounded-full" style={{ backgroundColor: "rgba(0,200,150,0.12)" }}>
            <span style={{ fontSize: 28, lineHeight: "48px" }}>🌿</span>
          </div>
          <p className="font-semibold" style={{ color: "#FFFFFF" }}>{name}</p>
          <p className="text-sm" style={{ color: "#9AA7B5" }}>Coming soon</p>
        </div>
      );
    },
  });
}

function ScreenSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-app-green border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const IS_PREVIEW = new URLSearchParams(window.location.search).has("preview");

export function App() {
  const { state: { onboardingComplete, session, ui, preferences }, dispatch } = useAppState();
  const isOnline = useOnlineStatus();
  const { canInstall, promptInstall } = useInstallPrompt();

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark =
    preferences.theme === "dark" ||
    (preferences.theme === "system" && prefersDark);

  // once per load, before auth — drives installs / WAU / retention
  useEffect(() => {
    trackAppOpen();
  }, []);

  // supabase persists the session; restore it on load and follow sign-in/out so a
  // signed-in user is not dropped back to the start screen on every relaunch.
  useEffect(() => {
    let cancelled = false;
    restoreSession()
      .then((restored) => {
        if (!cancelled && restored) dispatch({ type: "RESTORE_SESSION", payload: restored });
      })
      .catch(() => undefined);

    const unsubscribe = onAuthChange((s) => {
      if (s?.access_token) {
        dispatch({
          type: "RESTORE_SESSION",
          payload: {
            token: s.access_token,
            user: {
              id: s.user?.id,
              email: s.user?.email,
              fullName: s.user?.user_metadata?.full_name ?? s.user?.email,
            },
          },
        });
      } else {
        dispatch({ type: "LOGOUT" });
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [dispatch]);

  useEffect(() => {
    if (!session.authenticated || !isOnline) return;
    preloadCityPack().catch(() => undefined);
  }, [session.authenticated, isOnline]);

  // hooks must run on every render before any early return (rules of hooks)
  const ActiveTab = useMemo(
    () => TAB_SCREENS[ui.activeScreen] ?? HomeScreen,
    [ui.activeScreen]
  );

  if (IS_PREVIEW) return <PreviewGallery isOnline={isOnline} />;

  // ── Top of screenStack overrides the tab view (no tab bar) ────────────────
  const stackTop = ui.screenStack[ui.screenStack.length - 1] ?? null;
  const StackScreen = stackTop ? (STACK_SCREENS[stackTop.name] ?? null) : null;

  return (
    <>
      <CloudRainBackground isDark={isDark} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <NetworkBanner isOnline={isOnline} />

        {/* air quality is free for everyone, so there is no sign-in wall: after
            onboarding you land straight in the app. signing in is optional and
            reached from Profile (it unlocks saved places, alerts and sync). */}
        {!onboardingComplete ? (
          <OnboardingScreen canInstall={canInstall} onInstall={promptInstall} />
        ) : StackScreen ? (
          // Full-screen stack route — no tab bar, safe area insets handled by each screen
          <div
            key={stackTop.name}
            className="mf-screen"
            style={{ minHeight: "100dvh", backgroundColor: isDark ? "#0A0D12" : "#F8FAFC" }}
          >
            <ScreenSuspense>
              <StackScreen isOnline={isOnline} params={stackTop.params} isDark={isDark} />
            </ScreenSuspense>

            {/* Single, guaranteed back button for every stack screen.
                Uses onPointerDown (fires before gesture detection on iOS Safari)
                and a solid background so no duplicate button shows through. */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                dispatch({ type: "GO_BACK" });
              }}
              aria-label="Go back"
              style={{
                position: "fixed",
                top: "calc(env(safe-area-inset-top) + 8px)",
                left: 12,
                zIndex: 9999,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 22,
                backgroundColor: isDark ? "#0A0D12" : "#F8FAFC",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <ArrowLeft size={22} color={isDark ? "#FFFFFF" : "#0F1419"} />
            </button>
          </div>
        ) : (
          <MobileShell canInstall={canInstall} onInstall={promptInstall} isDark={isDark}>
            <ScreenSuspense>
              <ActiveTab isOnline={isOnline} isDark={isDark} />
            </ScreenSuspense>
          </MobileShell>
        )}
      </div>
    </>
  );
}
