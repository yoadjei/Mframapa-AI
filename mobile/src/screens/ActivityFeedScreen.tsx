import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore, ActivityItem } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

export function ActivityFeedScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const activityFeed = useStore((s) => s.activityFeed);
  const { t } = useTranslation();

  const iconMap: Record<ActivityItem['icon'], React.ComponentProps<typeof Ionicons>['name']> = {
    clock:    'time-outline',
    person:   'person-outline',
    lock:     'lock-closed-outline',
    location: 'location-outline',
  };

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('activity.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {activityFeed.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={40} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {t('activity.no_activity_yet')}
            </Text>
          </View>
        ) : null}
        {activityFeed.map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            {/* Timeline line */}
            <View style={styles.timelineCol}>
              <View style={[styles.iconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name={iconMap[item.icon]} size={16} color={Colors.brandGreen} />
              </View>
              {index < activityFeed.length - 1 ? (
                <View style={[styles.line, { borderColor: colors.border }]} />
              ) : null}
            </View>
            {/* Content */}
            <View style={styles.itemContent}>
              <Text style={[styles.itemAction, { color: colors.text }]}>
                {item.actionKey ? t(item.actionKey, item.actionParams) : item.action}
              </Text>
              <Text style={[styles.itemTime, { color: colors.subtext }]}>
                {item.timestampKey ? t(item.timestampKey, item.timestampParams) : item.timestamp}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  itemRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  timelineCol: { alignItems: 'center', width: 40 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, width: 1, borderLeftWidth: 1, borderStyle: 'dashed', minHeight: 32, marginTop: 4 },
  itemContent: { flex: 1, paddingTop: 10, paddingBottom: 24 },
  itemAction: { fontSize: 15, fontWeight: '600' },
  itemTime: { fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
