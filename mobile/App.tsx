import React, { useEffect } from 'react';
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

export default function App() {
  const { isDark } = useTheme();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const offlineCities = useStore((s) => s.offlineCities);
  const setOfflineCities = useStore((s) => s.setOfflineCities);

  useEffect(() => {
    if (offlineCities.length < 500) {
      const cities = getAfricanCities();
      setOfflineCities(cities);
      saveCities(cities).catch(() => undefined);
    }
  }, []);

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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  nav: { flex: 1, backgroundColor: 'transparent' },
});
