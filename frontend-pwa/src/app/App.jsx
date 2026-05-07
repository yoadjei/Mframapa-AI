import { useEffect, useMemo } from "react";
import { useAppState } from "../state/appState.jsx";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { useInstallPrompt } from "../hooks/useInstallPrompt.js";
import { NetworkBanner } from "../components/feedback/NetworkBanner.jsx";
import { MobileShell } from "../components/layout/MobileShell.jsx";
import { OnboardingScreen } from "../features/onboarding/OnboardingScreen.jsx";
import { AuthScreen } from "../features/auth/AuthScreen.jsx";
import { HomeScreen } from "../features/home/HomeScreen.jsx";
import { CoreFeatureScreen } from "../features/core/CoreFeatureScreen.jsx";
import { ActivityScreen } from "../features/activity/ActivityScreen.jsx";
import { SearchScreen } from "../features/search/SearchScreen.jsx";
import { ProfileScreen } from "../features/profile/ProfileScreen.jsx";
import { SettingsScreen } from "../features/settings/SettingsScreen.jsx";
import { NotificationsScreen } from "../features/notifications/NotificationsScreen.jsx";
import { preloadCityPack } from "../services/cityPackService.js";

const SCREEN_COMPONENTS = {
  home: HomeScreen,
  core: CoreFeatureScreen,
  activity: ActivityScreen,
  search: SearchScreen,
  notifications: NotificationsScreen,
  profile: ProfileScreen,
  settings: SettingsScreen,
};

export function App() {
  const {
    state: { onboardingComplete, session, ui },
  } = useAppState();
  const isOnline = useOnlineStatus();
  const { canInstall, promptInstall } = useInstallPrompt();
  const ActiveScreen = useMemo(
    () => SCREEN_COMPONENTS[ui.activeScreen] ?? HomeScreen,
    [ui.activeScreen]
  );

  useEffect(() => {
    if (!session.authenticated || !isOnline) return;
    preloadCityPack().catch(() => undefined);
  }, [session.authenticated, isOnline]);

  if (!onboardingComplete) {
    return (
      <>
        <NetworkBanner isOnline={isOnline} />
        <OnboardingScreen canInstall={canInstall} onInstall={promptInstall} />
      </>
    );
  }

  if (!session.authenticated) {
    return (
      <>
        <NetworkBanner isOnline={isOnline} />
        <AuthScreen isOnline={isOnline} />
      </>
    );
  }

  return (
    <>
      <NetworkBanner isOnline={isOnline} />
      <MobileShell canInstall={canInstall} onInstall={promptInstall}>
        <ActiveScreen isOnline={isOnline} />
      </MobileShell>
    </>
  );
}
