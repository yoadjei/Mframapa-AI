import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useStore } from './src/store/useStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/theme';
import { useTheme } from './src/hooks/useTheme';
import { getAfricanCities } from './src/services/cities';
import { saveCities } from './src/services/offline';

export default function App() {
  const { isDark } = useTheme();
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
          background: Colors.bgPrimary,
          card: Colors.bgCard,
          text: Colors.textPrimary,
          border: '#1E3328',
          primary: Colors.brandGreen,
          notification: Colors.brandGreen,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: Colors.lightBg,
          card: Colors.lightCard,
          text: Colors.lightTextPrimary,
          border: Colors.lightBorder,
          primary: Colors.brandGreen,
          notification: Colors.brandGreen,
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
