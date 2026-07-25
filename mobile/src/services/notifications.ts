import { registerPushToken } from './api';
import type { Notification as InboxNotification, NotifCategory } from '../store/useStore';

let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // expo-notifications unavailable in this environment (e.g. Expo Go SDK 53+)
}

/** Current OS permission without prompting. */
export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    if (!Notifications) return 'denied';
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'denied';
  }
}

export async function requestPermissions(): Promise<boolean> {
  try {
    if (!Notifications) return false;
    const { Platform } = require('react-native');
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('aqi-alerts', {
        name: 'Air quality alerts',
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync('daily-tips', {
        name: 'Did you know',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get the Expo push token and register it with the Mframapa backend.
 * Call this after push permissions are granted. Silently no-ops on failure.
 */
export async function getAndRegisterPushToken(
  lat?: number,
  lon?: number,
): Promise<string | null> {
  try {
    if (!Notifications) return null;
    const { Platform } = require('react-native');
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    const platform: 'android' | 'ios' | 'web' =
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android';
    await registerPushToken(token, platform, lat, lon);
    return token;
  } catch {
    return null;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications?.cancelAllScheduledNotificationsAsync();
  } catch {
    // no-op
  }
}

export function addNotificationListener(
  handler: (notification: any) => void,
): { remove: () => void } {
  try {
    if (!Notifications) return { remove: () => {} };
    return Notifications.addNotificationReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
}

export function addNotificationResponseListener(
  handler: (response: any) => void,
): { remove: () => void } {
  try {
    if (!Notifications) return { remove: () => {} };
    return Notifications.addNotificationResponseReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
}

/** Map an Expo / backend push payload into the in-app Alerts inbox shape. */
export function pushPayloadToInbox(content: {
  title?: string | null;
  body?: string | null;
  data?: Record<string, unknown> | null;
}): InboxNotification {
  const data = content.data ?? {};
  const rawType = String(data.type ?? (data.city ? 'alert' : 'tip'));
  const type: NotifCategory =
    rawType === 'daily_fact' || rawType === 'tip'
      ? 'tip'
      : rawType === 'summary'
        ? 'summary'
        : rawType === 'update'
          ? 'update'
          : 'alert';

  const title =
    content.title?.trim() ||
    (type === 'tip' ? 'Did you know' : 'Mframapa');
  const subtitle = content.body?.trim() || '';
  const id =
    typeof data.id === 'string'
      ? data.id
      : `push-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    title,
    subtitle,
    timestamp: new Date().toISOString(),
    read: false,
    type,
  };
}
