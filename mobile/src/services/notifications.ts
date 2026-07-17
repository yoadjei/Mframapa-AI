import { registerPushToken } from './api';

let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // expo-notifications unavailable in this environment (e.g. Expo Go SDK 53+)
}

export async function requestPermissions(): Promise<boolean> {
  try {
    if (!Notifications) return false;
    const { Platform } = require('react-native');
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('aqi-alerts', {
        name: 'AQI Alerts',
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
  handler: (notification: any) => void
): { remove: () => void } {
  try {
    if (!Notifications) return { remove: () => {} };
    return Notifications.addNotificationReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
}
