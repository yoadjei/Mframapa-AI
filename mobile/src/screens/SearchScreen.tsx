import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { fetchPredictionAtCoords } from '../services/prediction';
import { StatusDot } from '../components/ui/StatusDot';
import {
  fetchAfricanPlaceSuggestions,
  PlaceSuggestion,
} from '../services/mapboxGeocoding';
import { formatUsualPreview } from '../services/cities';
import { useTranslation } from '../hooks/useTranslation';

interface Props {
  onNavigateHome?: () => void;
}

export function SearchScreen({ onNavigateHome: _onNavigateHome }: Props) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const suggestionGen = useRef(0);

  const language          = useStore((s) => s.language);
  const offlineCities     = useStore((s) => s.offlineCities);
  const predictionHistory = useStore((s) => s.predictionHistory);
  const setPrediction     = useStore((s) => s.setPrediction);
  const { t } = useTranslation();

  // ── Debounced suggestions: instant offline + Mapbox enrich ────────────────
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    const q = text.toLowerCase();
    const offline: PlaceSuggestion[] = offlineCities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q),
      )
      .slice(0, 12)
      .map((c) => ({
        id: `offline-${c.name}-${c.lat}-${c.lon}`,
        placeName: `${c.name}, ${c.country}`,
        lat: c.lat,
        lon: c.lon,
        country: c.country,
        usual: c.usual,
      }));
    setSuggestions(offline);

    if (text.length < 3) return;
    const gen = ++suggestionGen.current;
    const timer = setTimeout(async () => {
      try {
        const mapbox = await fetchAfricanPlaceSuggestions(text);
        if (gen !== suggestionGen.current) return;
        const seen = new Set(offline.map((s) => s.placeName.toLowerCase()));
        const merged = [
          ...offline,
          ...mapbox.filter((s) => !seen.has(s.placeName.toLowerCase())),
        ].slice(0, 12);
        setSuggestions(merged);
      } catch {
        /* keep offline results */
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, offlineCities]);

  async function handleSelect(s: PlaceSuggestion) {
    if (loadingId) return;
    setLoadingId(s.id);
    Keyboard.dismiss();
    try {
      const cityName = s.placeName.split(',')[0]?.trim() || s.placeName;
      const prediction = await fetchPredictionAtCoords(
        s.lat, s.lon, cityName, language, offlineCities,
      );
      setPrediction(prediction);
      setQuery('');
      setSuggestions([]);
      navigation.navigate('CityDetail', { prediction });
    } catch {
      Alert.alert(t('error.prediction'));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRecent(prediction: typeof predictionHistory[number]) {
    setPrediction(prediction);
    navigation.navigate('CityDetail', { prediction });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Search Bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: isDark ? Colors.bgCard : '#fff', borderColor: colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={16} color={colors.subtext} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.city_placeholder')}
          placeholderTextColor={colors.subtext}
          style={[styles.searchInput, { color: colors.text }]}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setSuggestions([]);
            }}
          >
            <Ionicons name="close-circle" size={16} color={colors.subtext} />
          </TouchableOpacity>
        ) : null}
      </View>

      {query.trim().length === 0 ? (
        // ── Default state: recent searches (real data) or empty hint ──────
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {predictionHistory.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
                {t('search.recent')}
              </Text>
              {predictionHistory.slice(0, 10).map((p, idx) => (
                <TouchableOpacity
                  key={`${p.location.name}-${p.location.lat}-${idx}`}
                  onPress={() => handleRecent(p)}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.rowText}>
                    <Text style={[styles.rowCity, { color: colors.text }]}>
                      {p.location.name}
                    </Text>
                    <Text style={[styles.rowCountry, { color: colors.subtext }]}>
                      PM2.5 {p.pm25.toFixed(0)} μg/m³
                    </Text>
                  </View>
                  <StatusDot category={p.aqi_category} size={12} />
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={44} color={colors.subtext} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('search.prompt')}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.subtext }]}>
                {t('search.helper')}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        // ── Active query: live suggestion list ─────────────────────────────
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              disabled={loadingId === item.id}
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                loadingId === item.id && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.subtext}
                style={{ marginRight: 12 }}
              />
              <View style={styles.rowText}>
                <Text style={[styles.rowCity, { color: colors.text }]} numberOfLines={1}>
                  {item.placeName.split(',')[0]}
                </Text>
                <Text style={[styles.rowCountry, { color: colors.subtext }]} numberOfLines={1}>
                  {item.placeName}
                </Text>
                {formatUsualPreview(item) ? (
                  <Text style={[styles.rowUsual, { color: colors.muted }]} numberOfLines={1}>
                    {formatUsualPreview(item)}
                  </Text>
                ) : null}
              </View>
              {loadingId === item.id ? (
                <ActivityIndicator size="small" color={Colors.brandGreen} />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.trim().length >= 2 ? (
              <Text style={[styles.noResults, { color: colors.subtext }]}>
                {t('search.no_results')}
              </Text>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  rowUsual: { fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyBody: { fontSize: 14, textAlign: 'center' },
  noResults: { fontSize: 14, textAlign: 'center', paddingTop: 48 },
});
