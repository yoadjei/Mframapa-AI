/**
 * First-party analytics — anonymous and aggregate-only (per EXECUTION_PLAN §3.5).
 *
 * The device id is a random uuid generated on this device and kept in
 * AsyncStorage; it is never a hardware id and is never tied to identity. We send
 * coarse events (and at most a country code) so the team can measure installs,
 * WAU and retention without ever logging coordinates. Sends are best-effort and
 * never throw into the UI.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { postEvents } from './api';

const DEVICE_KEY = 'mframapa:analytics:device-id';

let _deviceId: string | null = null;

function newId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  return g.crypto?.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function deviceId(): Promise<string> {
  if (_deviceId) return _deviceId;
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = newId();
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  _deviceId = id;
  return id;
}

const platform: 'web' | 'android' | 'ios' =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android';

export async function track(event: string, opts: { country?: string } = {}): Promise<void> {
  try {
    const device_id = await deviceId();
    await postEvents([{ device_id, event, platform, country: opts.country }]);
  } catch {
    // analytics must never disrupt the app
  }
}

/** Call once on app start — drives installs, WAU and retention. */
export function trackAppOpen(): void {
  void track('app_open');
}

export function trackAlertOpened(): void {
  void track('alert_opened');
}
