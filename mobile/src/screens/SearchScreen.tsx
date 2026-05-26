import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getColors, Colors } from '../theme';
import { getAQIColor } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { fetchPredictionAtCoords } from '../services/prediction';
import { StatusDot } from '../components/ui/StatusDot';
import { useTranslation } from '../hooks/useTranslation';

const QUICK_CITIES = ['Accra', 'Lagos', 'Nairobi', 'Kumasi', 'Cairo', 'Dakar'];

const SAVED_RESULTS = [
  { name: 'Accra', country: 'Accra', lat: 5.6, lon: -0.2, pm25: 42, category: 'moderate' },
  { name: 'Lagos', country: 'Germany', lat: 6.5, lon: 3.4, pm25: 65, category: 'unhealthy for sensitive groups' },
  { name: 'Nowagan', country: 'South Africa', lat: -26, lon: 28, pm25: 18, category: 'good' },
  { name: 'Nairobi', country: 'Nervagora', lat: -1.3, lon: 36.8, pm25: 28, category: 'good' },
  { name: 'Mframapa', country: 'Brazil', lat: -15.8, lon: -47.9, pm25: 22, category: 'good' },
];

interface Props {
  onNavigateHome?: () => void;
}

export function SearchScreen({ onNavigateHome }: Props) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const language = useStore((s) => s.language);
  const offlineCities = useStore((s) => s.offlineCities);
  const { t } = useTranslation();

  const filtered = query
    ? SAVED_RESULTS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : SAVED_RESULTS;

  async function handleSelect(city: typeof SAVED_RESULTS[0]) {
    await fetchPredictionAtCoords(city.lat, city.lon, city.name, language, offlineCities).catch(() => {});
    navigation.navigate('CityDetail');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: isDark ? Colors.bgCard : '#fff', borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={16} color={colors.subtext} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.city_placeholder')}
          placeholderTextColor={colors.subtext}
          style={[styles.searchInput, { color: colors.text }]}
          autoFocus={false}
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.subtext} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Quick Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {QUICK_CITIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setQuery(c)}
            style={[
              styles.chip,
              {
                backgroundColor: query === c ? Colors.brandGreen : colors.card,
                borderColor: query === c ? Colors.brandGreen : colors.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: query === c ? '#fff' : colors.text }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Saved Results */}
      <Text style={[styles.sectionLabel, { color: colors.subtext }]}>{t('search.saved_results')}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item)}
            style={[styles.row, { borderBottomColor: colors.border }]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.rowCity, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.rowCountry, { color: colors.subtext }]}>{item.country}</Text>
            </View>
            <StatusDot category={item.category} size={12} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chipScroll: { flexGrow: 0 },
  chipRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
  rowCity: { fontSize: 16, fontWeight: '700' },
  rowCountry: { fontSize: 13, marginTop: 2 },
});
