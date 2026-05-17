import { useColorScheme } from 'react-native';
import { ThemeMode, useStore } from '../store/useStore';

export function useTheme() {
  const themeMode = useStore((state) => state.themeMode);
  const setThemeMode = useStore((state) => state.setThemeMode);
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme ?? 'light';
  const isDark = themeMode === 'system' ? resolvedScheme === 'dark' : themeMode === 'dark';

  return {
    isDark,
    themeMode,
    setThemeMode,
    systemTheme: resolvedScheme as Exclude<ThemeMode, 'system'>,
  };
}
