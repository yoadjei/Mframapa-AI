export const AQI_COLORS = {
  good: '#10B981',
  moderate: '#FBBF24',
  sensitive: '#F97316',
  unhealthy: '#EF4444',
  hazardous: '#A855F7',
} as const;

export type AQICategory = keyof typeof AQI_COLORS;

export function getAQIColor(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, '_') as AQICategory;
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

const darkColors = {
  background: '#0f172a',
  card: '#1e293b',
  text: '#ffffff',
  subtext: '#94a3b8',
  accent: '#10B981',
  border: '#334155',
  tabBar: '#0f172a',
  inputBackground: '#1e293b',
  danger: '#EF4444',
  warning: '#FBBF24',
};

const lightColors = {
  background: '#ffffff',
  card: '#f1f5f9',
  text: '#0f172a',
  subtext: '#64748b',
  accent: '#10B981',
  border: '#e2e8f0',
  tabBar: '#ffffff',
  inputBackground: '#f8fafc',
  danger: '#EF4444',
  warning: '#FBBF24',
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
  sm: 6,
  md: 12,
  lg: 20,
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
} as const;

export function getColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}

export type AppColors = typeof darkColors;
