import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { PrimaryButton } from '../components/ui/PrimaryButton';

const ITEM_KEYS = [
  { labelKey: 'screen.anomaly.item1_label', infoKey: 'screen.anomaly.item1_info', color: Colors.aqiGood },
  { labelKey: 'screen.anomaly.item2_label', infoKey: 'screen.anomaly.item2_info', color: Colors.aqiModerate },
  { labelKey: 'screen.anomaly.item3_label', infoKey: 'screen.anomaly.item3_info', color: Colors.aqiUnhealthy },
  { labelKey: 'screen.anomaly.item4_label', infoKey: 'screen.anomaly.item4_info', color: Colors.aqiGood }] as const;

type EpisodeAlert = {
  title?: string;
  description?: string;
  detectedAgo?: string;
};

export function AnomalyAlertScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  const alert = (route.params?.alert as EpisodeAlert | undefined) ?? null;

  return (
    <View style={[styles.root]}>
      {alert ? <View style={styles.glowOrb} /> : null}

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.anomaly.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      {!alert ? (
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            {t('screen.anomaly.empty')}
          </Text>
          <PrimaryButton label={t('common.back')} onPress={() => navigation.goBack()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.alertBanner, { borderColor: Colors.aqiHigh + '60' }]}>
            <View style={styles.alertTop}>
              <Ionicons name="warning-outline" size={22} color={Colors.aqiHigh} />
              <Text style={[styles.alertTitle, { color: colors.text }]}>
                {alert.title ?? t('screen.anomaly.spike_title')}
              </Text>
            </View>
            <Text style={[styles.alertDesc, { color: colors.subtext }]}>
              {alert.description ?? t('screen.anomaly.spike_desc')}
            </Text>
            {alert.detectedAgo ? (
              <Text style={[styles.alertTime, { color: colors.muted }]}>{alert.detectedAgo}</Text>
            ) : null}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('screen.anomaly.severity')}</Text>
          {ITEM_KEYS.map((item, i) => (
            <View key={i} style={styles.severityRow}>
              <View style={[styles.severityDot, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.severityLabel, { color: colors.text }]}>{t(item.labelKey)}</Text>
                <Text style={[styles.severityInfo, { color: colors.subtext }]}>{t(item.infoKey)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowOrb: {
    position: 'absolute',
    top: 0,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.aqiHigh,
    opacity: 0.12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700' },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyText: { fontSize: 15, textAlign: 'center' },
  content: { paddingHorizontal: 16, gap: 14 },
  alertBanner: {
    backgroundColor: Colors.aqiHigh + '15',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  alertDesc: { fontSize: 14, lineHeight: 20 },
  alertTime: { fontSize: 12 },
  sectionLabel: { fontSize: 16, fontWeight: '700' },
  severityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  severityLabel: { fontSize: 15, fontWeight: '600' },
  severityInfo: { fontSize: 12, marginTop: 2 },
});
