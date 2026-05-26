import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { PredictionWaveChart } from '../components/charts/PredictionWaveChart';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

const RANGE_KEYS = ['24h', '48h', '7d'] as const;

export function PredictionDashboardScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [range, setRange] = useState<(typeof RANGE_KEYS)[number]>('24h');

  const rangeLabels = [
    t('screen.prediction.range_24h'),
    t('screen.prediction.range_48h'),
    t('screen.prediction.range_7d'),
  ];

  const predictions: Record<string, { high: number; low: number }> = {
    '24h': { high: 45, low: 18 },
    '48h': { high: 52, low: 22 },
    '7d': { high: 68, low: 15 },
  };
  const pred = predictions[range];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('screen.prediction_dashboard.title').toUpperCase()}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toggleRow}>
          <SegmentedControl
            options={rangeLabels}
            selected={rangeLabels[RANGE_KEYS.indexOf(range)]}
            onSelect={(label) => {
              const idx = rangeLabels.indexOf(label);
              if (idx >= 0) setRange(RANGE_KEYS[idx]);
            }}
            isDark={isDark}
          />
        </View>

        <View style={styles.chartWrap}>
          <PredictionWaveChart height={200} />
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              {t('screen.prediction_dashboard.predicted_high')}
            </Text>
            <View style={styles.statValue}>
              <Text style={[styles.statNum, { color: colors.text }]}>{pred.high}</Text>
              <Text style={[styles.statUnit, { color: colors.subtext }]}> {t('unit.ug_m3')}</Text>
            </View>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              {t('screen.prediction_dashboard.predicted_low')}
            </Text>
            <View style={styles.statValue}>
              <Text style={[styles.statNum, { color: colors.text }]}>{pred.low}</Text>
              <Text style={[styles.statUnit, { color: colors.subtext }]}> {t('unit.ug_m3')}</Text>
            </View>
          </View>
        </View>
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
  content: { paddingHorizontal: 16, gap: 24 },
  toggleRow: { alignItems: 'center' },
  chartWrap: { alignItems: 'center' },
  statRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  statLabel: { fontSize: 12 },
  statValue: { flexDirection: 'row', alignItems: 'baseline' },
  statNum: { fontSize: 28, fontWeight: '800' },
  statUnit: { fontSize: 13 },
});
