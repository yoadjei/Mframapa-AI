import { useColorScheme } from 'react-native';
import { ThemeMode, useStore } from '../store/useStore';

export function resolveIsDark(themeMode: ThemeMode, colorScheme: 'light' | 'dark' | null | undefined): boolean {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return colorScheme === 'dark';
}

export function useTheme() {
  const themeMode = useStore((state) => state.themeMode);
  const setThemeMode = useStore((state) => state.setThemeMode);
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme ?? 'light';
  const isDark = resolveIsDark(themeMode, colorScheme);

  return {
    isDark,
    themeMode,
    setThemeMode,
    systemTheme: resolvedScheme as Exclude<ThemeMode, 'system'>,
  };
}
