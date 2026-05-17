import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useStore, City } from '../store/useStore';
import { fetchPredictionForCity, fetchPredictionAtCoords } from '../services/prediction';
import { searchCities } from '../services/cities';
import { fetchAfricanPlaceSuggestions, PlaceSuggestion } from '../services/mapboxGeocoding';
import { OfflineBanner } from '../components/OfflineBanner';
import { getColors, getAQIColor, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';
import { isInAfrica } from '../utils/geo';

const MIN_MAPBOX_QUERY = 3;

interface SearchScreenProps {
  onNavigateHome?: () => void;
}

export function SearchScreen({ onNavigateHome }: SearchScreenProps) {
  const { isDark } = useTheme();
  const offlineCities = useStore((s) => s.offlineCities);
  const predictionHistory = useStore((s) => s.predictionHistory);
  const clearHistory = useStore((s) => s.clearHistory);
  const language = useStore((s) => s.language);
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCity, setLoadingCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapboxSuggestions, setMapboxSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const localResults = useMemo(
    () => (query.trim().length < MIN_MAPBOX_QUERY ? searchCities(query, offlineCities, 50) : []),
    [query, offlineCities]
  );

  const useMapbox = query.trim().length >= MIN_MAPBOX_QUERY;

  useEffect(() => {
    if (!useMapbox) {
      setMapboxSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    setLoadingSuggestions(true);

    const timeoutId = setTimeout(async () => {
      try {
        const suggestions = await fetchAfricanPlaceSuggestions(query);
        if (!cancelled) setMapboxSuggestions(suggestions);
      } catch {
        if (!cancelled) setMapboxSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, useMapbox]);

  const runPrediction = useCallback(
    async (city: City) => {
      setError(null);
      setLoadingCity(city.name);
      setLoading(true);
      try {
        await fetchPredictionForCity(city, language);
        onNavigateHome?.();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        if (message.toLowerCase().includes('network') || message === 'ERR_NETWORK') {
          setError(t('error.network'));
        } else {
          setError(t('error.prediction'));
        }
      } finally {
        setLoading(false);
        setLoadingCity(null);
      }
    },
    [language, onNavigateHome, t]
  );

  async function handleSelectCity(city: City) {
    await runPrediction(city);
  }

  function handleSelectSuggestion(suggestion: PlaceSuggestion) {
    const shortName = suggestion.placeName.split(',')[0]?.trim() ?? suggestion.placeName;
    const city: City = {
      name: shortName,
      country: suggestion.country ?? '',
      lat: suggestion.lat,
      lon: suggestion.lon,
      urban: true,
    };
    setQuery(suggestion.placeName);
    runPrediction(city);
  }

  async function handleLocate() {
    setError(null);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('error.location'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      if (!isInAfrica(latitude, longitude)) {
        setError(t('error.outside_africa'));
        return;
      }

      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const name =
        geo?.city ??
        geo?.district ??
        geo?.region ??
        `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

      await fetchPredictionAtCoords(latitude, longitude, name, language, offlineCities);
      onNavigateHome?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'OUTSIDE_AFRICA') {
        setError(t('error.outside_africa'));
      } else if (message.toLowerCase().includes('network') || message === 'ERR_NETWORK') {
        setError(t('error.network'));
      } else {
        setError(t('error.prediction'));
      }
    } finally {
      setLoading(false);
    }
  }



  const showMapboxList = useMapbox;
  const resultCount = showMapboxList ? mapboxSuggestions.length : localResults.length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ height: insets.top }} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('search.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {t('home.subtitle')}
        </Text>
      </View>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.accent + '66',
            shadowOpacity: isDark ? 0 : 0.08,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.accent} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.subtext}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          onSubmitEditing={() => {
            if (mapboxSuggestions[0]) handleSelectSuggestion(mapboxSuggestions[0]);
            else if (localResults[0]) handleSelectCity(localResults[0]);
          }}
        />
        {loading || loadingSuggestions ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <TouchableOpacity
            onPress={handleLocate}
            hitSlop={8}
            style={[styles.locateBtn, { backgroundColor: colors.accentDim }]}
            accessibilityLabel={t('search.locate')}
          >
            <Ionicons name="navigate-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>



      {query.trim().length > 0 && query.trim().length < MIN_MAPBOX_QUERY ? (
        <Text style={[styles.hint, { color: colors.subtext }]}>
          Type at least {MIN_MAPBOX_QUERY} characters for place search
        </Text>
      ) : null}

      <OfflineBanner />

      {error ? (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.danger + '12', borderColor: colors.danger + '33' },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      {!query.trim() && predictionHistory.length > 0 ? (
        <>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionLabel, { color: colors.subtext, marginBottom: 0 }]}>
              {t('search.recent')}
            </Text>
            <TouchableOpacity onPress={clearHistory} style={{ paddingHorizontal: spacing.md }} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>
          <View style={styles.recentList}>
            {predictionHistory.slice(0, 3).map((p, index) => {
              const aqiColor = getAQIColor(p.aqi_category);
              const city: City = {
                name: p.location.name,
                country: '',
                lat: p.location.lat,
                lon: p.location.lon,
                urban: true,
              };
              return (
                <TouchableOpacity
                  key={`${p.location.lat}-${p.location.lon}-${index}`}
                  onPress={() => handleSelectCity(city)}
                  style={[styles.recentRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.statusDot, { backgroundColor: aqiColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentName, { color: colors.text }]}>{p.location.name}</Text>
                    <Text style={[styles.recentSub, { color: colors.subtext }]}>
                      {toDisplayLabel(p.aqi_category)}
                    </Text>
                  </View>
                  <Text style={[styles.recentValue, { color: colors.text }]}>
                    {Math.round(p.pm25)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
        {query.trim()
          ? loadingSuggestions
            ? t('search.searching')
            : `${resultCount} result${resultCount !== 1 ? 's' : ''}`
          : `${offlineCities.length} cities in database`}
      </Text>

      {showMapboxList ? (
        mapboxSuggestions.length === 0 && !loadingSuggestions ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={36} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {t('search.no_results')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={mapboxSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SuggestionRow
                suggestion={item}
                isDark={isDark}
                isLoading={loadingCity === item.placeName.split(',')[0]}
                onPress={() => handleSelectSuggestion(item)}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )
      ) : query.trim().length >= MIN_MAPBOX_QUERY ? null : localResults.length === 0 && query.trim() ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={36} color={colors.subtext} />
          <Text style={[styles.emptyText, { color: colors.subtext }]}>{t('search.no_results')}</Text>
        </View>
      ) : localResults.length > 0 ? (
        <FlatList
          data={localResults}
          keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
          renderItem={({ item }) => (
            <CityRow
              city={item}
              isDark={isDark}
              isLoading={loadingCity === item.name}
              onPress={() => handleSelectCity(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </View>
  );
}

function SuggestionRow({
  suggestion,
  isDark,
  isLoading,
  onPress,
}: {
  suggestion: PlaceSuggestion;
  isDark: boolean;
  isLoading: boolean;
  onPress: () => void;
}) {
  const colors = getColors(isDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={[
        styles.cityRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: isLoading ? 0.72 : 1,
        },
      ]}
    >
      <Ionicons name="location-outline" size={18} color={colors.subtext} style={{ marginRight: spacing.sm }} />
      <Text style={[styles.suggestionName, { color: colors.text }]} numberOfLines={2}>
        {suggestion.placeName}
      </Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
      )}
    </TouchableOpacity>
  );
}

function CityRow({
  city,
  isDark,
  isLoading,
  onPress,
}: {
  city: City;
  isDark: boolean;
  isLoading: boolean;
  onPress: () => void;
}) {
  const colors = getColors(isDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={[
        styles.cityRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: isLoading ? 0.72 : 1,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.cityName, { color: colors.text }]} numberOfLines={1}>
          {city.name}
        </Text>
        <Text style={[styles.cityCountry, { color: colors.subtext }]} numberOfLines={1}>
          {city.country || 'Africa'}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <View style={[styles.dotIndicator, { backgroundColor: colors.accent }]} />
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function toDisplayLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  locateBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },

  errorBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  recentList: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recentName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  recentSub: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  recentValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.sm,
  },
  suggestionName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  cityName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  cityCountry: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
