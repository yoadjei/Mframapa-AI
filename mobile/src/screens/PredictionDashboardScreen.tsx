import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { LineChart } from '../components/charts/LineChart';
import { getColors, Colors, getAQIColor } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { getForecast, ForecastDay } from '../services/api';

/** the api caps the horizon to the days our inputs genuinely cover. */
const FORECAST_DAYS = 4;

export function PredictionDashboardScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const lastPrediction = useStore((s) => s.lastPrediction);
  // real multi-day outlook. nothing here is synthesised: the day tabs are the
  // days the api could actually cover, and a day it could not is simply absent.
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [dayIndex, setDayIndex] = useState(0);

  const lat = lastPrediction?.location.lat;
  const lon = lastPrediction?.location.lon;
  const locationName = lastPrediction?.location.name;

  useEffect(() => {
    if (lat == null || lon == null) { setForecast([]); return; }
    let cancelled = false;
    getForecast(lat, lon, locationName ?? 'Unknown', FORECAST_DAYS)
      .then((days) => { if (!cancelled) { setForecast(days); setDayIndex(0); } })
      .catch(() => { if (!cancelled) setForecast([]); });
    return () => { cancelled = true; };
  }, [lat, lon, locationName]);

  const rangeLabels = forecast.map((d, i) =>
    i === 0
      ? t('common.today')
      : new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })
  );

  const selectedIndex = Math.min(dayIndex, Math.max(0, forecast.length - 1));
  const selected = forecast[selectedIndex];
  const series = forecast.map((d) => Math.round(d.pm25));
  const chartColor = getAQIColor(
    selected?.aqi_category ?? lastPrediction?.aqi_category ?? 'moderate',
    isDark,
  );
  const reducedConfidence = selected?.inputs === 'reduced';

  // the band is the model's own interval for the selected day, used verbatim.
  const pred = (() => {
    const source = selected ?? lastPrediction;
    if (!source) return null;
    const u = source.uncertainty ?? {};
    return {
      high: Math.max(0, Math.round(u.pm25_upper ?? source.pm25)),
      low:  Math.max(0, Math.round(u.pm25_lower ?? source.pm25)),
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

            {rangeLabels.length > 1 ? (
              <View style={styles.toggleRow}>
                <SegmentedControl
                  options={rangeLabels}
                  selected={rangeLabels[selectedIndex]}
                  onSelect={(label) => {
                    const idx = rangeLabels.indexOf(label);
                    if (idx >= 0) setDayIndex(idx);
                  }}
                  isDark={isDark}
                />
              </View>
            ) : null}

            {reducedConfidence ? (
              <Text style={[styles.note, { color: colors.subtext }]}>
                {t('screen.prediction_dashboard.reduced_confidence')}.
              </Text>
            ) : null}

            {series.length > 1 ? (
              <View style={styles.chartWrap}>
                <LineChart
                  data={series}
                  labels={rangeLabels}
                  height={200}
                  isDark={isDark}
                  color={chartColor}
                />
              </View>
            ) : null}

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
  note: { fontSize: 12, lineHeight: 17 },
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
