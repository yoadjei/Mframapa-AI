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

export function getAQIColor(category: string): string {
  const cat = category.toLowerCase();
  if (cat === 'good') return Colors.aqiGood;
  if (cat === 'moderate') return Colors.aqiModerate;
  if (cat.includes('sensitive') || cat === 'high' || cat.includes('unhealthy for')) return Colors.aqiHigh;
  if (cat === 'unhealthy') return Colors.aqiUnhealthy;
  if (cat.includes('very') || cat.includes('hazardous')) return Colors.aqiVeryUnhealthy;
  return Colors.aqiModerate;
}
