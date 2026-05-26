import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore, Notification } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

export function AlertsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const notifications         = useStore((s) => s.notifications);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const markNotificationRead  = useStore((s) => s.markNotificationRead);
  const { t } = useTranslation();

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
          unread && { backgroundColor: Colors.brandGreen + '12', borderLeftColor: Colors.brandGreen, borderLeftWidth: 3 },
        ]}
      >
        <View style={[
          styles.iconWrap,
          { backgroundColor: unread ? Colors.brandGreen + '22' : colors.surface },
        ]}>
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
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === 'android' ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.heading, { color: colors.text }]}>{t('alerts.title')}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={markAllNotificationsRead}>
            <Text style={styles.markAll}>{t('alerts.mark_all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.border }]} />}
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
  heading: { fontSize: 28, fontWeight: '800', flex: 1 },
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
