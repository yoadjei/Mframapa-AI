import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

export function SettingsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const themeMode       = useStore((s) => s.themeMode);
  const setThemeMode    = useStore((s) => s.setThemeMode);
  const alertsEnabled   = useStore((s) => s.alertsEnabled);
  const setAlertsEnabled = useStore((s) => s.setAlertsEnabled);
  const liteMode        = useStore((s) => s.liteMode);
  const setLiteMode     = useStore((s) => s.setLiteMode);
  const dataAnalytics   = useStore((s) => s.dataAnalytics);
  const setDataAnalytics = useStore((s) => s.setDataAnalytics);
  const locationSharing  = useStore((s) => s.locationSharing);
  const setLocationSharing = useStore((s) => s.setLocationSharing);

  function locationSharingLabel(value: 'off' | 'balanced' | 'precise') {
    return t(`settings.location_${value}`);
  }

  const THEME_MODES = ['light', 'dark', 'system'] as const;
  const themeLabels = [t('settings.light'), t('settings.dark'), t('settings.system')];
  const themeIndex = THEME_MODES.indexOf(themeMode as typeof THEME_MODES[number]);

  const sectionLabel = (label: string) => (
    <Text style={[styles.sectionLabel, { color: isDark ? Colors.textSecondary : Colors.lightTextSecondary }]}>
      {label}
    </Text>
  );

  const toggleRow = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
    sublabel?: string,
  ) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSublabel, { color: colors.subtext }]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: Colors.brandGreen }}
        thumbColor={Platform.OS === 'android' ? (value ? Colors.brandGreen : '#fff') : '#fff'}
        ios_backgroundColor={colors.border}
      />
    </View>
  );

  return (
    <View style={[styles.root]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {Platform.OS === 'android' ? (
          <View style={styles.androidHeader}>
            <Text style={[styles.androidTitle, { color: colors.text }]}>{t('settings.title').toUpperCase()}</Text>
          </View>
        ) : null}

        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>

        {/* Appearance */}
        {sectionLabel(t('settings.appearance'))}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.theme')}</Text>
            <SegmentedControl
              options={themeLabels}
              selectedIndex={themeIndex === -1 ? 2 : themeIndex}
              onSelectIndex={(i) => setThemeMode(THEME_MODES[i])}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Notifications */}
        {sectionLabel(t('settings.notifications'))}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {toggleRow(t('settings.enable_alerts'), alertsEnabled, setAlertsEnabled)}
        </View>

        {/* Privacy */}
        {sectionLabel(t('settings.privacy_section'))}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.location_sharing')}</Text>
            <TouchableOpacity
              onPress={() => {
                const opts: ('off' | 'balanced' | 'precise')[] = ['off', 'balanced', 'precise'];
                const next = opts[(opts.indexOf(locationSharing) + 1) % opts.length];
                setLocationSharing(next);
              }}
              style={styles.dropdownBtn}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {locationSharingLabel(locationSharing)}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.subtext} />
            </TouchableOpacity>
          </View>
          {toggleRow(t('settings.data_analytics'), dataAnalytics, setDataAnalytics)}
        </View>

        {/* Performance */}
        {sectionLabel(t('settings.performance'))}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {toggleRow(t('settings.lite'), liteMode, setLiteMode, Platform.OS === 'android' ? t('settings.lite_unavailable') : undefined)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16 },
  androidHeader: { marginBottom: 8 },
  androidTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSublabel: { fontSize: 12, marginTop: 2 },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownText: { fontSize: 14 },
});
