import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore, NotifCategory } from '../store/useStore';
import {
  getPermissionStatus,
  getAndRegisterPushToken,
} from '../services/notifications';
import {
  NotificationPermissionSheet,
  hasSeenPushPrompt,
} from './NotificationPermissionSheet';
import { GlassSheet } from './ui/GlassSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}

const CATEGORIES: { key: NotifCategory; labelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'alert',   labelKey: 'notif_prefs.air_quality_alerts',  icon: 'warning-outline' },
  { key: 'summary', labelKey: 'notif_prefs.daily_summaries',     icon: 'document-text-outline' },
  { key: 'update',  labelKey: 'notif_prefs.air_quality_updates', icon: 'cloud-outline' },
  { key: 'tip',     labelKey: 'notif_prefs.tips_and_guidance',   icon: 'bulb-outline' },
];

export function NotificationSettingsSheet({ visible, onClose, onMarkAllRead }: Props) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();

  const alertsEnabled    = useStore((s) => s.alertsEnabled);
  const setAlertsEnabled = useStore((s) => s.setAlertsEnabled);
  const notifPrefs       = useStore((s) => s.notifPrefs);
  const setNotifPref     = useStore((s) => s.setNotifPref);
  const lastPrediction   = useStore((s) => s.lastPrediction);
  const unreadCount      = useStore(
    (s) => s.notifications.filter((n) => !n.read).length,
  );

  const [permSheetOpen, setPermSheetOpen] = useState(false);
  const [softPromptChecked, setSoftPromptChecked] = useState(false);

  async function maybeOfferPushPrompt() {
    const status = await getPermissionStatus();
    if (status === 'granted') {
      const lat = lastPrediction?.location?.lat;
      const lon = lastPrediction?.location?.lon;
      await getAndRegisterPushToken(lat, lon);
      return;
    }
    if (status === 'denied') return;
    const seen = await hasSeenPushPrompt();
    if (!seen) setPermSheetOpen(true);
  }

  React.useEffect(() => {
    if (!visible || softPromptChecked) return;
    setSoftPromptChecked(true);
    if (!alertsEnabled) return;
    maybeOfferPushPrompt().catch(() => undefined);
  }, [visible, softPromptChecked, alertsEnabled]);

  async function handleMasterToggle(val: boolean) {
    setAlertsEnabled(val);
    if (val) await maybeOfferPushPrompt();
  }

  return (
    <>
      <GlassSheet
        visible={visible && !permSheetOpen}
        onClose={onClose}
        overlayOpacity={0.4}
        sheetStyle={styles.sheetMax}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('notif_prefs.title')}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {t('notif_prefs.all_notifications')}
              </Text>
              <Text style={[styles.rowSub, { color: colors.subtext }]}>
                {t('notif_prefs.all_notifications_explainer')}
              </Text>
            </View>
            <Switch
              value={alertsEnabled}
              onValueChange={handleMasterToggle}
              trackColor={{ false: colors.border, true: Colors.brandGreen }}
              thumbColor={Platform.OS === 'android' ? (alertsEnabled ? Colors.brandGreen : '#fff') : '#fff'}
              ios_backgroundColor={colors.border}
            />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            {t('notif_prefs.categories')}
          </Text>
          {CATEGORIES.map((cat) => {
            const enabled = alertsEnabled && notifPrefs[cat.key] !== false;
            return (
              <View
                key={cat.key}
                style={[styles.row, { borderBottomColor: colors.border, opacity: alertsEnabled ? 1 : 0.5 }]}
              >
                <View style={[styles.catIcon, { backgroundColor: Colors.brandGreen + '22' }]}>
                  <Ionicons name={cat.icon} size={18} color={Colors.brandGreen} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>
                    {t(cat.labelKey)}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  disabled={!alertsEnabled}
                  onValueChange={(v) => setNotifPref(cat.key, v)}
                  trackColor={{ false: colors.border, true: Colors.brandGreen }}
                  thumbColor={Platform.OS === 'android' ? (enabled ? Colors.brandGreen : '#fff') : '#fff'}
                  ios_backgroundColor={colors.border}
                />
              </View>
            );
          })}

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { borderColor: colors.border, opacity: unreadCount > 0 ? 1 : 0.5 },
            ]}
            disabled={unreadCount === 0}
            onPress={() => {
              onMarkAllRead();
              onClose();
            }}
          >
            <Ionicons name="checkmark-done" size={18} color={Colors.brandGreen} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {unreadCount > 0
                ? t('notif_prefs.mark_count_as_read', { count: String(unreadCount) })
                : t('notif_prefs.nothing_unread')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </GlassSheet>

      <NotificationPermissionSheet
        visible={permSheetOpen}
        onClose={() => setPermSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheetMax: { maxHeight: '80%' },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 2 },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontSize: 15, fontWeight: '500' },
});
