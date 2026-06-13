import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { PredictionWaveChart } from '../components/charts/PredictionWaveChart';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';

const RANGE_KEYS = ['24h', '48h', '7d'] as const;
// Confidence bands widen with horizon; values are rough multipliers applied
// to the model's reported uncertainty.
const RANGE_MULTIPLIERS: Record<(typeof RANGE_KEYS)[number], number> = {
  '24h': 1.0,
  '48h': 1.25,
  '7d':  1.6,
};

export function PredictionDashboardScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const lastPrediction = useStore((s) => s.lastPrediction);
  const [range, setRange] = useState<(typeof RANGE_KEYS)[number]>('24h');

  const rangeLabels = [
    t('screen.prediction.range_24h'),
    t('screen.prediction.range_48h'),
    t('screen.prediction.range_7d')];

  // Derive high/low for the chosen horizon from the model's confidence band.
  // For longer horizons we widen the band; for the current reading we use it
  // verbatim.
  const pred = (() => {
    if (!lastPrediction) return null;
    const mid = lastPrediction.pm25;
    const halfBand = (lastPrediction.uncertainty.pm25_upper - lastPrediction.uncertainty.pm25_lower) / 2;
    const m = RANGE_MULTIPLIERS[range];
    return {
      high: Math.max(0, +(mid + halfBand * m).toFixed(0)),
      low:  Math.max(0, +(mid - halfBand * m).toFixed(0)),
    };
  })();

  return (
    <View style={[styles.root]}>
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
        {!lastPrediction || !pred ? (
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {t('screen.prediction_dashboard.no_data_yet')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={[styles.emptyCta, { backgroundColor: Colors.brandGreen + '22' }]}
            >
              <Text style={[styles.emptyCtaText, { color: Colors.brandGreen }]}>
                {t('screen.prediction_dashboard.check_a_city')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.subtext} />
              <Text style={[styles.locationText, { color: colors.text }]}>
                {lastPrediction.location.name}
              </Text>
            </View>

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
          </>
        )}
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
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  emptyCta: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  emptyCtaText: { fontSize: 14, fontWeight: '600' },
});
