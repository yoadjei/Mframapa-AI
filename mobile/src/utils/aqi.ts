export interface AQILevel {
  category: string;
  color: string;
  emoji: string;
  min: number;
  max: number;
}

export const AQI_LEVELS: AQILevel[] = [
  { category: 'Good', color: '#10B981', emoji: '😊', min: 0, max: 12 },
  { category: 'Moderate', color: '#FBBF24', emoji: '😐', min: 12.1, max: 35.4 },
  { category: 'Unhealthy for Sensitive Groups', color: '#F97316', emoji: '😷', min: 35.5, max: 55.4 },
  { category: 'Unhealthy', color: '#EF4444', emoji: '🤢', min: 55.5, max: 150.4 },
  { category: 'Very Unhealthy', color: '#A855F7', emoji: '☠️', min: 150.5, max: 250.4 },
  { category: 'Hazardous', color: '#7F1D1D', emoji: '💀', min: 250.5, max: Infinity },
];

export function getAQILevelFromPM25(pm25: number): AQILevel {
  return AQI_LEVELS.find((l) => pm25 >= l.min && pm25 <= l.max) ?? AQI_LEVELS[0];
}

export function getAQIColorFromCategory(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('hazardous')) return '#7F1D1D';
  if (lower.includes('very unhealthy') || lower.includes('very_unhealthy')) return '#A855F7';
  if (lower.includes('unhealthy') && !lower.includes('sensitive')) return '#EF4444';
  if (lower.includes('sensitive')) return '#F97316';
  if (lower.includes('moderate')) return '#FBBF24';
  return '#10B981';
}

export function pm25ToAQI(pm25: number): number {
  const breakpoints = [
    { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
  ];
  const bp = breakpoints.find((b) => pm25 >= b.cLow && pm25 <= b.cHigh);
  if (!bp) return pm25 > 500 ? 500 : 0;
  return Math.round(
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
  );
}

export function getHealthAdvice(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('hazardous')) return 'Everyone should avoid all outdoor activities.';
  if (lower.includes('very unhealthy') || lower.includes('very_unhealthy'))
    return 'Health alert: everyone may experience serious health effects.';
  if (lower.includes('unhealthy') && !lower.includes('sensitive'))
    return 'Everyone may experience health effects. Sensitive groups face serious risk.';
  if (lower.includes('sensitive'))
    return 'Sensitive groups should limit prolonged outdoor exertion.';
  if (lower.includes('moderate'))
    return 'Unusually sensitive people should consider reducing prolonged exertion.';
  return 'Air quality is satisfactory. Enjoy outdoor activities.';
}
