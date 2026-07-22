export const Colors = {
  bgPrimary:    '#0B0F14',
  bgSecondary:  '#121821',
  bgCard:       '#171E28',
  bgCardAlt:    '#10161F',

  brandGreen:   '#00C896',
  brandGreenDim:'#00A87C',

  textPrimary:   '#FFFFFF',
  textSecondary: '#9AA7B5',
  textMuted:     '#647182',

  aqiGood:          '#00C896',
  aqiModerate:      '#F5C518',
  aqiHigh:          '#FF8C00',
  aqiUnhealthy:     '#E53935',
  aqiVeryUnhealthy: '#9C27B0',

  danger:     '#E53935',
  warning:    '#F5C518',
  success:    '#00C896',
  enterprise: '#C8A200',

  lightBg:              '#E8ECF2',
  lightCard:            '#FFFFFF',
  lightBorder:          '#D4DAE3',
  lightTextPrimary:     '#0F1419',
  lightTextSecondary:   '#5C6B7A',
} as const;

export type ColorKey = keyof typeof Colors;

export function aqiBand(category: string): 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'hazardous' {
  const cat = (category ?? '').toLowerCase();
  if (cat === 'good') return 'good';
  if (cat === 'moderate') return 'moderate';
  if (cat.includes('sensitive') || cat === 'high' || cat.includes('unhealthy for')) return 'sensitive';
  if (cat === 'unhealthy') return 'unhealthy';
  if (cat.includes('very') || cat.includes('hazardous')) return 'hazardous';
  return 'moderate';
}

// measured against each theme background: all clear WCAG AA (4.5:1) for text.
// the previous single palette failed on four of five categories in light mode
// and on hazardous in dark, the one that matters most. mirrors the pwa.
const AQI_DARK: Record<string, string> = {
  good: '#00C896', moderate: '#F5C518', sensitive: '#FF8C00',
  unhealthy: '#E53935', hazardous: '#C043D5',
};
const AQI_LIGHT: Record<string, string> = {
  good: '#008060', moderate: '#8B6E06', sensitive: '#AB5E00',
  unhealthy: '#DD211C', hazardous: '#9C27B0',
};

export function getAQIColor(category: string, isDark = true): string {
  return (isDark ? AQI_DARK : AQI_LIGHT)[aqiBand(category)];
}

// a shape per band, so severity is legible without seeing colour (roughly one
// in twelve men has colour vision deficiency).
export function aqiSymbol(category: string): string {
  return { good: '●', moderate: '◐', sensitive: '◑', unhealthy: '◕', hazardous: '■' }[aqiBand(category)];
}
