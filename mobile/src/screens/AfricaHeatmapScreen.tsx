import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Defs, LinearGradient as SvgLinear, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { getColors } from '../theme';
import { AfricaMapView, MapMarker } from '../components/AfricaMapView';
import { AFRICAN_CITIES } from '../data/africanCities';
import { useTranslation } from '../hooks/useTranslation';

const { width: W } = Dimensions.get('window');
const MAP_W = W - 32;
const legendW = MAP_W - 24;

type FilterType = 'All' | 'Good' | 'Unhealthy';

function heatWeight(lat: number, lon: number): number {
  if (lat > 22) return 0.92;
  if (lat > 8 && lon > 28) return 0.78;
  if (lat > 5 && lat < 18 && lon > -18 && lon < 25) return 0.55;
  if (lat < -5) return 0.38;
  return 0.48;
}

function categoryFromWeight(w: number): 'good' | 'unhealthy' {
  return w >= 0.7 ? 'unhealthy' : 'good';
}

export function AfricaHeatmapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('All');

  const filterKeys: Record<FilterType, string> = {
    All: 'screen.heatmap.filter_all',
    Good: 'screen.heatmap.filter_good',
    Unhealthy: 'screen.heatmap.filter_unhealthy',
  };

  const heatMarkers: MapMarker[] = useMemo(() => {
    const base = AFRICAN_CITIES.slice(0, 280).map((city) => {
      const weight = heatWeight(city.lat, city.lon);
      return { name: city.name, lat: city.lat, lon: city.lon, weight };
    });
    if (filter === 'All') return base;
    return base.filter((m) => {
      const cat = categoryFromWeight(m.weight ?? 0.4);
      return filter === 'Good' ? cat === 'good' : cat === 'unhealthy';
    });
  }, [filter]);

  const legendLabels = [
    'screen.heatmap.legend_cleaner',
    'screen.heatmap.legend_good',
    'screen.heatmap.legend_moderate',
    'screen.heatmap.legend_sahel',
    'screen.heatmap.legend_unhealthy'] as const;

  return (
    <View style={[styles.root, {paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('app.name')}</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {(['All', 'Good', 'Unhealthy'] as FilterType[]).map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.tab, filter === key && { backgroundColor: colors.text }]}
          >
            <Text style={[styles.tabText, { color: filter === key ? colors.background : colors.text }]}>
              {t(filterKeys[key])}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mapWrap}>
        <AfricaMapView variant="heatmap" markers={heatMarkers} isDark={isDark} liteMode onMapPress={() => {}} />
      </View>

      <View style={[styles.legend, { backgroundColor: colors.card, marginBottom: insets.bottom + 12 }]}>
        <Text style={[styles.legendTitle, { color: colors.subtext }]}>{t('screen.heatmap.legend_title')}</Text>
        <Svg width={legendW} height={14}>
          <Defs>
            <SvgLinear id="legBar" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#00C896" />
              <Stop offset="33%" stopColor="#F5C518" />
              <Stop offset="66%" stopColor="#FF8C00" />
              <Stop offset="100%" stopColor="#E53935" />
            </SvgLinear>
          </Defs>
          <Rect x="0" y="0" width={legendW} height="14" fill="url(#legBar)" rx="7" />
        </Svg>
        <View style={styles.legendLabels}>
          {legendLabels.map((key) => (
            <Text key={key} style={[styles.legendLabel, { color: colors.subtext }]}>
              {t(key)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 },
  iconBtn: { padding: 10 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  tab: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  tabText: { fontSize: 14, fontWeight: '600' },
  mapWrap: { flex: 1, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  legend: { borderRadius: 16, padding: 14, gap: 8, marginHorizontal: 16 },
  legendTitle: { fontSize: 12, fontWeight: '600' },
  legendLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  legendLabel: { fontSize: 10 },
});
