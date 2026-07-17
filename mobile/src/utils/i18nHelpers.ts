/** Map API AQI category strings to locale keys. */
export function aqiCategoryKey(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('hazardous')) return 'aqi.hazardous';
  if (lower.includes('very unhealthy') || lower.includes('very_unhealthy')) return 'aqi.very_unhealthy';
  if (lower.includes('unhealthy') && !lower.includes('sensitive')) return 'aqi.unhealthy';
  if (lower.includes('sensitive')) return 'aqi.sensitive';
  if (lower.includes('moderate')) return 'aqi.moderate';
  if (lower === 'high') return 'aqi.high';
  return 'aqi.good';
}

export function healthAdviceKey(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('hazardous')) return 'advice.hazardous';
  if (lower.includes('very unhealthy') || lower.includes('very_unhealthy')) return 'advice.very_unhealthy';
  if (lower.includes('unhealthy') && !lower.includes('sensitive')) return 'advice.unhealthy';
  if (lower.includes('sensitive')) return 'advice.sensitive';
  if (lower.includes('moderate')) return 'advice.moderate';
  return 'advice.good';
}
