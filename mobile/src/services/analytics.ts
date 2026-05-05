/**
 * Aggregate-only analytics — no raw GPS retention per EXECUTION_PLAN_4MONTHS.md §3.5.
 * Events are bucketed before transmission; individual coordinates are never logged.
 */

import { bucketCoordinates } from './location';

interface AggregateEvent {
  event: string;
  region?: string;
  aqi_bucket?: string;
  timestamp_hour: number;
}

const _queue: AggregateEvent[] = [];
let _enabled = false;

export function enableAnalytics(): void {
  _enabled = true;
}

export function disableAnalytics(): void {
  _enabled = false;
}

function aqiBucket(pm25: number): string {
  if (pm25 <= 12) return 'good';
  if (pm25 <= 35) return 'moderate';
  if (pm25 <= 55) return 'sensitive';
  if (pm25 <= 150) return 'unhealthy';
  return 'hazardous';
}

export function trackSearch(lat: number, lon: number): void {
  if (!_enabled) return;
  _queue.push({
    event: 'search',
    region: bucketCoordinates(lat, lon, 0),
    timestamp_hour: new Date().getHours(),
  });
}

export function trackPredictionView(pm25: number): void {
  if (!_enabled) return;
  _queue.push({
    event: 'prediction_view',
    aqi_bucket: aqiBucket(pm25),
    timestamp_hour: new Date().getHours(),
  });
}

export function trackOfflineView(): void {
  if (!_enabled) return;
  _queue.push({ event: 'offline_view', timestamp_hour: new Date().getHours() });
}

export function flushQueue(): AggregateEvent[] {
  const events = [..._queue];
  _queue.length = 0;
  return events;
}
