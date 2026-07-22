export { Colors, getAQIColor, aqiSymbol, aqiBand } from './colors';
export { Typography } from './typography';

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
  full: 9999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

import { Colors } from './colors';

const darkColors = {
  background:      'transparent',
  card:            Colors.bgCard,
  surface:         Colors.bgSecondary,
  cardAlt:         Colors.bgCardAlt,
  text:            Colors.textPrimary,
  subtext:         Colors.textSecondary,
  muted:           Colors.textMuted,
  accent:          Colors.brandGreen,
  accentDim:       '#123127',
  border:          '#25303C',
  tabBar:          Colors.bgSecondary,
  inputBackground: Colors.bgCardAlt,
  danger:          Colors.danger,
  warning:         Colors.warning,
  success:         Colors.success,
  enterprise:      Colors.enterprise,
  overlay:         'rgba(11,15,20,0.8)',
};

const lightColors = {
  background:      'transparent',
  card:            Colors.lightCard,
  surface:         '#E2E8F0',
  cardAlt:         '#F1F5F9',
  text:            Colors.lightTextPrimary,
  subtext:         Colors.lightTextSecondary,
  muted:           '#7B8A99',
  accent:          Colors.brandGreen,
  accentDim:       '#D6F5EC',
  border:          Colors.lightBorder,
  tabBar:          Colors.lightCard,
  inputBackground: '#FFFFFF',
  danger:          Colors.danger,
  warning:         Colors.warning,
  success:         Colors.success,
  enterprise:      Colors.enterprise,
  overlay:         'rgba(15,20,25,0.2)',
};

export { AppBackgroundColors } from './background';

export function getColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}

export type AppColors = typeof darkColors;

// Legacy re-exports for backward compatibility
export const AQI_COLORS = {
  good:     Colors.aqiGood,
  moderate: Colors.aqiModerate,
  sensitive: Colors.aqiHigh,
  unhealthy: Colors.aqiUnhealthy,
  hazardous: Colors.aqiVeryUnhealthy,
} as const;

export const HERO_GRADIENT: readonly [string, string, string] = [
  '#1B2A38',
  '#121A24',
  '#0B0F14',
];

export const spacing = Spacing;
export const borderRadius = Radius;
export const fontSize = {
  xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36, hero: 56,
} as const;
