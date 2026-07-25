import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore, Notification } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { NotificationSettingsSheet } from '../components/NotificationSettingsSheet';

export function AlertsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const notifications         = useStore((s) => s.notifications);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const markNotificationRead  = useStore((s) => s.markNotificationRead);
  const { t } = useTranslation();

  // Live unread count — derived from `notifications` so any read/mark action
  // re-renders the header badge in the same frame.
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleMarkAll() {
    if (unreadCount === 0) {
      Alert.alert(t('notif_prefs.nothing_unread'));
      return;
    }
    markAllNotificationsRead();
    Alert.alert(t('alerts.marked_as_read', { count: String(unreadCount) }));
  }

  const iconName = (type: Notification['type']): React.ComponentProps<typeof Ionicons>['name'] => {
    if (type === 'alert')   return 'notifications';
    if (type === 'summary') return 'notifications-outline';
    if (type === 'tip')     return 'notifications-outline';
    return 'notifications-outline';
  };

  function notificationText(item: Notification) {
    return {
      title: item.titleKey ? t(item.titleKey, item.titleParams) : item.title,
      subtitle: item.subtitleKey ? t(item.subtitleKey, item.subtitleParams) : item.subtitle,
      timestamp: item.timestampKey ? t(item.timestampKey, item.timestampParams) : item.timestamp,
    };
  }

  function renderItem({ item }: { item: Notification }) {
    const unread = !item.read;
    const text = notificationText(item);
    return (
      <TouchableOpacity
        onPress={() => markNotificationRead(item.id)}
        style={[
          styles.row,
          { borderColor: colors.border },
          unread && { backgroundColor: Colors.brandGreen + '12', borderLeftColor: Colors.brandGreen, borderLeftWidth: 3 }]}
      >
        <View style={[
          styles.iconWrap,
          { backgroundColor: unread ? Colors.brandGreen + '22' : colors.surface }]}>
          <Ionicons
            name={iconName(item.type)}
            size={18}
            color={unread ? Colors.brandGreen : colors.subtext}
          />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.text }, unread && styles.titleUnread]}>
            {text.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>{text.subtitle}</Text>
          <Text style={[styles.time, { color: colors.muted }]}>{text.timestamp}</Text>
        </View>
        <Ionicons name="notifications-outline" size={16} color={colors.subtext} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, {paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === 'android' ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.headingWrap}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('alerts.title')}</Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleMarkAll} disabled={unreadCount === 0}>
            <Text style={[styles.markAll, unreadCount === 0 && { opacity: 0.4 }]}>
              {unreadCount === 0
                ? t('notif_prefs.nothing_unread')
                : t('alerts.mark_all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSettingsOpen(true)}
            accessibilityLabel={t('alerts.open_settings')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        // extraData forces row re-render when read flags change even if the
        // item IDs don't.
        extraData={unreadCount}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.border }]} />}
      />

      <NotificationSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onMarkAllRead={handleMarkAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  heading: { fontSize: 28, fontWeight: '800' },
  headingWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  unreadPill: {
    backgroundColor: Colors.brandGreen,
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markAll: { fontSize: 13, fontWeight: '600', color: Colors.brandGreen },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '500' },
  titleUnread: { fontWeight: '700' },
  subtitle: { fontSize: 13 },
  time: { fontSize: 12, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});
