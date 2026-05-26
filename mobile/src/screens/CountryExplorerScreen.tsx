import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { getColors } from '../theme';
import { AQIBadge } from '../components/ui/AQIBadge';
import { getAQIColor } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';

const CITIES = [
  { name: 'Accra',      pm25: 42, category: 'moderate' },
  { name: 'Kumasi',     pm25: 28, category: 'good' },
  { name: 'Tamale',     pm25: 65, category: 'unhealthy for sensitive groups' },
  { name: 'Cape Coast', pm25: 19, category: 'good' },
];

export function CountryExplorerScreen() {
  const insets    = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.countryRow}>
          <Text style={styles.flag}>🇬🇭</Text>
          <Text style={[styles.countryName, { color: colors.text }]}>Ghana</Text>
          <AQIBadge category="moderate" size="md" />
        </View>

        {CITIES.map((city) => (
          <TouchableOpacity
            key={city.name}
            activeOpacity={0.75}
            style={[styles.cityRow, { backgroundColor: colors.card }]}
          >
            <View style={[styles.dot, { backgroundColor: getAQIColor(city.category) }]} />
            <Text style={[styles.cityName, { color: colors.text }]}>{city.name}</Text>
            <View style={styles.cityRight}>
              <View style={[styles.dot, { backgroundColor: getAQIColor(city.category) }]} />
              <Text style={[styles.pm25Val, { color: getAQIColor(city.category) }]}>
                {city.pm25}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.subtext} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>{t('country.stats_title')}</Text>
          <View style={styles.statsGrid}>
            {[
              { label: t('country.stats.cities'), val: '427' },
              { label: t('country.stats.population'), val: '32.9M' },
              { label: t('country.stats.area'), val: '2,083 mi' },
              { label: t('country.stats.forest_cover'), val: '34%' },
            ].map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.val}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  header:      {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iconBtn:     { padding: 10 },
  content:     { paddingHorizontal: 16, paddingTop: 4, gap: 10 },

  countryRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  flag:        { fontSize: 34 },
  countryName: { fontSize: 30, fontWeight: '800', flex: 1 },

  cityRow:     {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  dot:         { width: 10, height: 10, borderRadius: 5 },
  cityName:    { flex: 1, fontSize: 16, fontWeight: '600' },
  cityRight:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pm25Val:     { fontSize: 16, fontWeight: '700' },

  statsCard:   { borderRadius: 16, padding: 16, gap: 14, marginTop: 4 },
  statsTitle:  { fontSize: 17, fontWeight: '700' },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  statItem:    { width: '45%', gap: 2 },
  statLabel:   { fontSize: 12 },
  statValue:   { fontSize: 20, fontWeight: '700' },
});
