/**
 * Pre-hydration theme — same role as the PWA index.html boot script.
 * Reads the zustand persist blob once so the first painted frame matches
 * the user's saved light/dark preference (no dark→light flash).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { AppBackgroundColors } from './background';

const PERSIST_KEY = 'mframapa-persist';

export type BootTheme = {
  isDark: boolean;
  backgroundColor: string;
};

function resolveDark(themeMode: string | undefined, systemDark: boolean): boolean {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return systemDark;
}

export async function loadBootTheme(): Promise<BootTheme> {
  const systemDark = Appearance.getColorScheme() === 'dark';
  let themeMode: string | undefined;
  try {
    const raw = await AsyncStorage.getItem(PERSIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { themeMode?: string }; themeMode?: string };
      themeMode = parsed?.state?.themeMode ?? parsed?.themeMode;
    }
  } catch {
    /* keep system */
  }
  const isDark = resolveDark(themeMode, systemDark);
  return {
    isDark,
    backgroundColor: isDark ? AppBackgroundColors.dark : AppBackgroundColors.light,
  };
}
