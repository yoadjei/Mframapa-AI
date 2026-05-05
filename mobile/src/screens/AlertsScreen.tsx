import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { requestPermissions, cancelAllNotifications } from '../services/notifications';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useStore } from '../store/useStore';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: Date;
}

export function AlertsScreen() {
  const isDark = useStore((s) => s.isDark);
  const colors = getColors(isDark);

  const [enabled, setEnabled] = useState(false);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setEnabled(status === 'granted');
    });

    const sub = Notifications.addNotificationReceivedListener((n) => {
      setAlerts((prev) => [
        {
          id: n.request.identifier,
          title: n.request.content.title ?? 'AQI Alert',
          body: n.request.content.body ?? '',
          date: new Date(),
        },
        ...prev,
      ]);
    });

    return () => sub.remove();
  }, []);

  async function handleToggle(value: boolean) {
    if (value) {
      const granted = await requestPermissions();
      setEnabled(granted);
    } else {
      await cancelAllNotifications();
      setEnabled(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: spacing.xl,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{ color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' }}
        >
          Alerts
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.md,
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            padding: spacing.md,
          }}
        >
          <View>
            <Text style={{ color: colors.text, fontSize: fontSize.md, fontWeight: '600' }}>
              AQI Notifications
            </Text>
            <Text style={{ color: colors.subtext, fontSize: fontSize.sm }}>
              Get alerted when air quality changes
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.border, true: colors.accent + '88' }}
            thumbColor={enabled ? colors.accent : colors.subtext}
          />
        </View>
      </View>

      {alerts.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔔</Text>
          <Text
            style={{
              color: colors.subtext,
              fontSize: fontSize.md,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            {enabled
              ? 'No alerts yet. You'll be notified when air quality changes significantly.'
              : 'Enable notifications above to receive AQI alerts.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: fontSize.md, fontWeight: '700' }}>
                {item.title}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: fontSize.sm, marginTop: 4 }}>
                {item.body}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: fontSize.xs, marginTop: spacing.xs }}>
                {item.date.toLocaleTimeString()}
              </Text>
            </View>
          )}
        />
      )}

      {alerts.length > 0 && (
        <TouchableOpacity
          onPress={() => setAlerts([])}
          style={{ padding: spacing.md, alignItems: 'center' }}
        >
          <Text style={{ color: colors.danger, fontSize: fontSize.sm }}>Clear all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
