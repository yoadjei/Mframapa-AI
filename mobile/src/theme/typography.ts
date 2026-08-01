import { Colors } from './colors';

export const Typography = {
  heroTitle:   { fontSize: 32, fontWeight: '800' as const, lineHeight: 40 },
  screenTitle: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },

  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },

  aqiNumber: { fontSize: 56, fontWeight: '800' as const },
  aqiUnit:   { fontSize: 14, fontWeight: '500' as const, color: Colors.textSecondary },

  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },

  labelSm: { fontSize: 13, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.6 },

  tabLabel: { fontSize: 12, fontWeight: '500' as const },
} as const;
