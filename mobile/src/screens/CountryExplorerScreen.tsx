import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { getColors, Colors } from '../theme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore, City } from '../store/useStore';
import { fetchPredictionAtCoords } from '../services/prediction';

export function CountryExplorerScreen() {
  const insets    = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const offlineCities = useStore((s) => s.offlineCities);
  const language      = useStore((s) => s.language);
  const setPrediction = useStore((s) => s.setPrediction);

  // Unique sorted list of countries actually represented in offlineCities.
  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const c of offlineCities) if (c.country) set.add(c.country);
    return Array.from(set).sort();
  }, [offlineCities]);

  const [selectedCountry, setSelectedCountry] = useState<string>(countries[0] ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingCity, setLoadingCity] = useState<string | null>(null);

  // Default to the first country once offlineCities hydrate.
  if (!selectedCountry && countries.length > 0) {
    setSelectedCountry(countries[0]);
  }

  const cities = useMemo(
    () => offlineCities.filter((c) => c.country === selectedCountry),
    [offlineCities, selectedCountry],
  );

  // Quick descriptive stats from the cached city set.
  const stats = useMemo(() => {
    const urban = cities.filter((c) => c.urban).length;
    return {
      cities: cities.length.toString(),
      urban: urban.toString(),
      rural: (cities.length - urban).toString(),
    };
  }, [cities]);

  async function openCity(city: City) {
    if (loadingCity) return;
    setLoadingCity(city.name);
    try {
      const prediction = await fetchPredictionAtCoords(
        city.lat, city.lon, city.name, language, offlineCities,
      );
      setPrediction(prediction);
      navigation.navigate('CityDetail', { prediction });
    } catch {
      Alert.alert(t('error.prediction'));
    } finally {
      setLoadingCity(null);
    }
  }

  return (
    <View style={[styles.root, {paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setPickerOpen(true)} style={styles.iconBtn}>
          <Ionicons name="swap-horizontal" size={22} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
          style={styles.countryRow}
        >
          <Text style={[styles.countryName, { color: colors.text }]} numberOfLines={1}>
            {selectedCountry || t('screen.country.tap_to_choose')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.subtext} />
        </TouchableOpacity>

        {cities.length === 0 ? (
          <View style={[styles.emptyBlock, { borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={36} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {t('screen.country.no_cities')}
            </Text>
          </View>
        ) : (
          cities.slice(0, 30).map((city) => (
            <TouchableOpacity
              key={`${city.name}-${city.lat}`}
              onPress={() => openCity(city)}
              disabled={loadingCity === city.name}
              activeOpacity={0.75}
              style={[
                styles.cityRow,
                { backgroundColor: colors.card },
                loadingCity === city.name && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name={city.urban ? 'business-outline' : 'leaf-outline'}
                size={16}
                color={Colors.brandGreen}
              />
              <Text style={[styles.cityName, { color: colors.text }]}>{city.name}</Text>
              <View style={styles.cityRight}>
                <Text style={[styles.cityCoord, { color: colors.subtext }]}>
                  {city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.subtext} />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>{t('country.stats_title')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>{t('country.stats.cities')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.cities}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>{t('screen.country.urban_cities')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.urban}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>{t('screen.country.rural_cities')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.rural}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPickerOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {t('screen.country.choose_country')}
          </Text>
          <FlatList
            data={countries}
            keyExtractor={(c) => c}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCountry(item);
                  setPickerOpen(false);
                }}
                style={[styles.countryItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.countryItemText, { color: colors.text }]}>{item}</Text>
                {item === selectedCountry ? (
                  <Ionicons name="checkmark" size={20} color={Colors.brandGreen} />
                ) : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
  countryName: { fontSize: 28, fontWeight: '800', flex: 1 },

  cityRow:     {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cityName:    { flex: 1, fontSize: 16, fontWeight: '600' },
  cityRight:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cityCoord:   { fontSize: 12 },

  statsCard:   { borderRadius: 16, padding: 16, gap: 14, marginTop: 4 },
  statsTitle:  { fontSize: 17, fontWeight: '700' },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  statItem:    { width: '28%', gap: 2 },
  statLabel:   { fontSize: 12 },
  statValue:   { fontSize: 20, fontWeight: '700' },

  emptyBlock:  {
    borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
    padding: 24, alignItems: 'center', gap: 8, marginVertical: 8,
  },
  emptyText:   { fontSize: 14, textAlign: 'center' },

  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:       {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 8, maxHeight: '70%',
  },
  handle:      { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  countryItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryItemText: { fontSize: 16 },
});
