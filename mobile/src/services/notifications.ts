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
