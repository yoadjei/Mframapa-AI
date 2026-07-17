export function formatPM25(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)} µg/m³`;
}

export function formatTemperature(celsius: number | null | undefined): string {
  if (celsius == null) return '--';
  return `${celsius.toFixed(1)}°C`;
}

export function formatHumidity(rh: number | null | undefined): string {
  if (rh == null) return '--';
  return `${Math.round(rh)}%`;
}

export function formatWindSpeed(ms: number | null | undefined): string {
  if (ms == null) return '--';
  return `${ms.toFixed(1)} m/s`;
}

export function formatCoords(lat: number, lon: number, decimals = 4): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}°${ns}, ${Math.abs(lon).toFixed(decimals)}°${ew}`;
}

export function formatRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Unknown';
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
