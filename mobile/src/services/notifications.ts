import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('aqi-alerts', {
      name: 'AQI Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAQIAlert(
  title: string,
  body: string,
  triggerSeconds = 0
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: { type: 'aqi-alert' } },
    trigger: triggerSeconds > 0 ? { seconds: triggerSeconds } : null,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function removeNotificationListener(
  subscription: Notifications.Subscription
): void {
  subscription.remove();
}
