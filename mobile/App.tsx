import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useStore } from './src/store/useStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { CloudRainBackground } from './src/components/CloudRainBackground';
import { AppBackgroundColors } from './src/theme/background';
import { useTheme } from './src/hooks/useTheme';
import { getAfricanCities } from './src/services/cities';
import { saveCities } from './src/services/offline';
import {
  getPermissionStatus,
  getAndRegisterPushToken,
  addNotificationListener,
  addNotificationResponseListener,
  pushPayloadToInbox,
} from './src/services/notifications';
import {
  NotificationPermissionSheet,
  hasSeenPushPrompt,
} from './src/components/NotificationPermissionSheet';
import { syncLocaleInBackground } from './src/services/translation';
import { trackAppOpen } from './src/services/analytics';
import { initSentry } from './src/services/sentry';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';

initSentry();   // crash reporting before anything renders

export default function App() {
  const { isDark } = useTheme();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const offlineCities = useStore((s) => s.offlineCities);
  const setOfflineCities = useStore((s) => s.setOfflineCities);
  const lastPrediction = useStore((s) => s.lastPrediction);
  const language = useStore((s) => s.language);
  const alertsEnabled = useStore((s) => s.alertsEnabled);
  const addNotification = useStore((s) => s.addNotification);
  const [pushPromptOpen, setPushPromptOpen] = useState(false);

  useEffect(() => {
    trackAppOpen();   // installs / WAU / retention
    if (offlineCities.length < 500) {
      const cities = getAfricanCities();
      setOfflineCities(cities);
      saveCities(cities).catch(() => undefined);
    }
  }, []);

  // Mirror OS push (episode alerts + Did you know) into the in-app Alerts inbox.
  useEffect(() => {
    function ingest(content: { title?: string | null; body?: string | null; data?: Record<string, unknown> | null }) {
      addNotification(pushPayloadToInbox(content));
    }
    const received = addNotificationListener((notification) => {
      ingest(notification?.request?.content ?? {});
    });
    const response = addNotificationResponseListener((res) => {
      ingest(res?.notification?.request?.content ?? {});
    });
    return () => {
      received.remove();
      response.remove();
    };
  }, [addNotification]);

  // Register push token only when OS permission is already granted.
  // Do not cold-prompt on mount — NotificationSettingsSheet owns the prompt.
  const alertLat = lastPrediction?.location.lat;
  const alertLon = lastPrediction?.location.lon;
  useEffect(() => {
    if (!alertsEnabled) return;
    if (alertLat == null || alertLon == null) return;
    async function initPush() {
      const status = await getPermissionStatus();
      if (status === 'granted') await getAndRegisterPushToken(alertLat, alertLon);
    }
    initPush().catch(() => undefined);
  }, [alertLat, alertLon, alertsEnabled]);

  // Background OTA translation sync — refreshes the server-side locale bundle
  // whenever the app language changes so strings stay current without blocking the UI.
  useEffect(() => {
    syncLocaleInBackground(language).catch(() => undefined);
  }, [language]);

  // Soft push explainer after the user reaches the main app (never cold OS prompt).
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      if (await hasSeenPushPrompt()) return;
      const status = await getPermissionStatus();
      if (status === 'undetermined') setPushPromptOpen(true);
    }, 2800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAuthenticated]);

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: 'transparent',
          card: '#171E28',
          text: '#FFFFFF',
          border: '#2A3441',
          primary: '#00C896',
          notification: '#00C896',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: 'transparent',
          card: '#FFFFFF',
          text: '#0F1419',
          border: '#D4DAE3',
          primary: '#00C896',
          notification: '#00C896',
        },
      };

  const shellBg = isDark ? AppBackgroundColors.dark : AppBackgroundColors.light;

  return (
    <AppErrorBoundary>
    <SafeAreaProvider>
      <View style={[styles.shell, { backgroundColor: shellBg }]}>
        <CloudRainBackground />
        <View style={styles.nav}>
          <NavigationContainer
            key={isAuthenticated ? 'main' : 'onboarding'}
            theme={navTheme}
          >
            <AppNavigator />
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </NavigationContainer>
        </View>
        <NotificationPermissionSheet
          visible={pushPromptOpen}
          onClose={() => setPushPromptOpen(false)}
        />
      </View>
    </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  nav: { flex: 1, backgroundColor: 'transparent' },
});
