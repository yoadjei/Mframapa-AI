import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { requestPermissions, cancelAllNotifications, addNotificationListener } from '../services/notifications';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: Date;
  read: boolean;
}

export function AlertsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [enabled, setEnabled] = useState(false);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const sub = addNotificationListener((n) => {
      setAlerts((prev) => [
        {
          id: n.request.identifier,
          title: n.request.content.title ?? t('alerts.default_title'),
          body: n.request.content.body ?? '',
          date: new Date(),
          read: false,
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

  function markAllRead() {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ height: insets.top }} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('alerts.title')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="settings-outline" size={18} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <View style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.toggleInfo}>
          <Text style={[styles.toggleTitle, { color: colors.text }]}>{t('alerts.toggle_title')}</Text>
          <Text style={[styles.toggleSub, { color: colors.subtext }]}>
            {t('alerts.toggle_sub')}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.accent + '88' }}
          thumbColor={enabled ? colors.accent : colors.subtext}
        />
      </View>

      {unreadCount > 0 ? (
        <TouchableOpacity onPress={markAllRead} style={styles.markAllRow}>
          <Text style={[styles.markAllText, { color: colors.accent }]}>
            {t('alerts.mark_all')} ({unreadCount})
          </Text>
        </TouchableOpacity>
      ) : null}

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accentDim }]}>
            <Ionicons name="notifications-outline" size={28} color={colors.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('alerts.empty_title')}</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            {enabled ? t('alerts.empty_on') : t('alerts.empty_off')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 140 }}
          renderItem={({ item, index }) => (
            <AlertRow item={item} isDark={isDark} highlight={index < 2 && !item.read} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function AlertRow({
  item,
  isDark,
  highlight,
}: {
  item: NotificationItem;
  isDark: boolean;
  highlight: boolean;
}) {
  const colors = getColors(isDark);

  return (
    <View
      style={[
        styles.alertRow,
        {
          backgroundColor: highlight ? colors.successTint : colors.card,
          borderColor: highlight ? colors.accent + '33' : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.alertIcon,
          { backgroundColor: highlight ? colors.accent + '22' : colors.surface },
        ]}
      >
        <Ionicons
          name={highlight ? 'notifications' : 'information-circle-outline'}
          size={18}
          color={highlight ? colors.accent : colors.subtext}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.alertBody, { color: colors.text }]}>{item.body}</Text>
        <Text style={[styles.alertTime, { color: colors.subtext }]}>
          {item.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toggleCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  toggleSub: {
    fontSize: fontSize.sm,
    marginTop: 4,
    lineHeight: 19,
  },
  markAllRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  markAllText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  alertBody: {
    fontSize: fontSize.md,
    lineHeight: 21,
    marginTop: 2,
  },
  alertTime: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
});
