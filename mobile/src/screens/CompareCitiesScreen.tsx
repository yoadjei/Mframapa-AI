import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from '../components/charts/LineChart';
import { CityPicker } from '../components/CityPicker';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore, City, PredictionResult } from '../store/useStore';
import { fetchPredictionAtCoords } from '../services/prediction';
import { getHistory } from '../services/api';

/** days of real history behind each sparkline */
const TREND_DAYS = 7;

export function CompareCitiesScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const offlineCities = useStore((s) => s.offlineCities);
  const language      = useStore((s) => s.language);
  const [cityA, setCityA] = useState<City | null>(null);
  const [cityB, setCityB] = useState<City | null>(null);
  const [predA, setPredA] = useState<PredictionResult | null>(null);
  const [predB, setPredB] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  // real last-week pm2.5 per city — the sparklines are measured, not drawn
  const [seriesA, setSeriesA] = useState<number[]>([]);
  const [seriesB, setSeriesB] = useState<number[]>([]);

  // Seed with the first two offline cities so the screen has something to
  // show on first open (user can change either via the picker).
  useEffect(() => {
    if (!cityA && offlineCities.length > 0) setCityA(offlineCities[0]);
    if (!cityB && offlineCities.length > 1) setCityB(offlineCities[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineCities.length]);

  // Fetch fresh predictions whenever the two cities are set.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!cityA || !cityB) return;
      setLoading(true);
      try {
        const [a, b] = await Promise.all([
          fetchPredictionAtCoords(cityA.lat, cityA.lon, cityA.name, language, offlineCities),
          fetchPredictionAtCoords(cityB.lat, cityB.lon, cityB.name, language, offlineCities),
        ]);
        if (cancelled) return;
        setPredA(a);
        setPredB(b);
      } catch {
        // Leave previous values in place on transient failure.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [cityA, cityB, language, offlineCities]);

  // trends are secondary to the readings, so they load separately and an empty
  // result just hides the sparkline rather than blocking the comparison.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!cityA || !cityB) return;
      const [a, b] = await Promise.all([
        getHistory(cityA.lat, cityA.lon, cityA.name, TREND_DAYS).catch(() => []),
        getHistory(cityB.lat, cityB.lon, cityB.name, TREND_DAYS).catch(() => []),
      ]);
      if (cancelled) return;
      setSeriesA(a.map((d) => Math.round(d.pm25)));
      setSeriesB(b.map((d) => Math.round(d.pm25)));
    }
    void run();
    return () => { cancelled = true; };
  }, [cityA, cityB]);

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.compare.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <CityPicker
          isDark={isDark}
          placeholder={cityA ? `${cityA.name}, ${cityA.country}` : t('search.city_placeholder')}
          onSelect={(c) => setCityA(c)}
        />
        <CityPicker
          isDark={isDark}
          placeholder={cityB ? `${cityB.name}, ${cityB.country}` : t('search.city_placeholder')}
          onSelect={(c) => setCityB(c)}
        />

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.brandGreen} />
            <Text style={[styles.loadingText, { color: colors.subtext }]}>
              {t('screen.compare.fetching_readings')}
            </Text>
          </View>
        ) : null}

        <View style={styles.legendRow}>
          <Text style={[styles.pm25Label, { color: colors.text }]}>{t('card.pm25')}</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.brandGreen }]} />
              <Text style={[styles.legendText, { color: Colors.brandGreen }]}>
                {cityA?.name ?? '—'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={[styles.legendText, { color: '#2196F3' }]}>
                {cityB?.name ?? '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chartWrap}>
          {seriesA.length > 0 && seriesB.length > 0 ? (
            <LineChart
              data={seriesA}
              secondaryData={seriesB}
              secondaryColor="#2196F3"
              labels={['-6d', '-5', '-4', '-3', '-2', '-1', 'now']}
              isDark={isDark}
              height={180}
            />
          ) : (
            <Text style={[styles.placeholder, { color: colors.subtext }]}>
              {t('screen.compare.pick_two_cities')}
            </Text>
          )}
        </View>

        <View style={[styles.compBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.compSide}>
            <Text style={[styles.compCity, { color: Colors.brandGreen }]}>{cityA?.name ?? '—'}</Text>
            <Text style={[styles.compValue, { color: Colors.brandGreen }]}>
              {predA
                ? t('screen.compare.avg', { value: predA.pm25.toFixed(0) })
                : '—'}
            </Text>
          </View>
          <View style={[styles.vsPill, { backgroundColor: colors.surface }]}>
            <Text style={[styles.vsText, { color: colors.subtext }]}>{t('screen.compare.vs')}</Text>
          </View>
          <View style={styles.compSide}>
            <Text style={[styles.compCity, { color: '#2196F3' }]}>{cityB?.name ?? '—'}</Text>
            <Text style={[styles.compValue, { color: '#2196F3' }]}>
              {predB
                ? t('screen.compare.avg', { value: predB.pm25.toFixed(0) })
                : '—'}
            </Text>
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
  title: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 16, gap: 14 },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerText: { fontSize: 16, fontWeight: '600' },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pm25Label: { fontSize: 15, fontWeight: '700' },
  legendItems: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 13, fontWeight: '600' },
  chartWrap: { alignItems: 'center' },
  compBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  compSide: { gap: 4, alignItems: 'center' },
  compCity: { fontSize: 15, fontWeight: '700' },
  compValue: { fontSize: 13 },
  vsPill: { borderRadius: 999, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  vsText: { fontSize: 13, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' },
  loadingText: { fontSize: 13 },
  placeholder: { fontSize: 14, textAlign: 'center', paddingVertical: 32 },
});
