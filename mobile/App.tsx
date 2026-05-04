import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useStore } from './src/store/useStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AFRICAN_CITIES } from './src/data/africanCities';
import { getColors } from './src/theme';

export default function App() {
  const isDark = useStore((s) => s.isDark);
  const offlineCities = useStore((s) => s.offlineCities);
  const setOfflineCities = useStore((s) => s.setOfflineCities);
  const colors = getColors(isDark);

  // Seed offline cities if not yet loaded
  useEffect(() => {
    if (offlineCities.length === 0) {
      setOfflineCities(AFRICAN_CITIES);
    }
  }, []);

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
          notification: colors.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
          notification: colors.accent,
        },
      };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
