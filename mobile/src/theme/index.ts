export const AQI_COLORS = {
  good: '#10B981',
  moderate: '#FBBF24',
  sensitive: '#F97316',
  unhealthy: '#EF4444',
  hazardous: '#A855F7',
} as const;

export type AQICategory = keyof typeof AQI_COLORS;

export function getAQIColor(category: string): string {
  const map: Record<string, string> = {
    good: AQI_COLORS.good,
    moderate: AQI_COLORS.moderate,
    'unhealthy for sensitive groups': AQI_COLORS.sensitive,
    sensitive: AQI_COLORS.sensitive,
    unhealthy: AQI_COLORS.unhealthy,
    'very unhealthy': AQI_COLORS.hazardous,
    hazardous: AQI_COLORS.hazardous,
  };
  return map[category.toLowerCase()] ?? AQI_COLORS.moderate;
}

export const HERO_GRADIENT: readonly [string, string, string] = [
  '#23C28A',
  '#168966',
  '#12354E',
];

const darkColors = {
  background: '#0B1018',
  card: '#161D28',
  surface: '#202938',
  text: '#F7FAFC',
  subtext: '#94A3B8',
  accent: '#23C28A',
  accentDim: '#143F34',
  border: '#253243',
  tabBar: '#0F151F',
  inputBackground: '#171E29',
  danger: '#EF4444',
  warning: '#F4C34D',
  accentStrong: '#169A6D',
  surfaceAlt: '#111827',
  successTint: '#123A30',
  overlay: 'rgba(11, 16, 24, 0.7)',
};

const lightColors = {
  background: '#F4FAF7',
  card: '#FFFFFF',
  surface: '#ECF5F1',
  text: '#111827',
  subtext: '#6B7280',
  accent: '#1BAA78',
  accentDim: '#DBF5EA',
  border: '#D8E6DF',
  tabBar: '#FFFFFF',
  inputBackground: '#FFFFFF',
  danger: '#EF4444',
  warning: '#F4C34D',
  accentStrong: '#0F8C63',
  surfaceAlt: '#F8FCFA',
  successTint: '#E7F8F0',
  overlay: 'rgba(17, 24, 39, 0.12)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  hero: 62,
} as const;

export function getColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}

export type AppColors = typeof darkColors;
