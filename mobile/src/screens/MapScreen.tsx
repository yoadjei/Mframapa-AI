import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore, PredictionResult, City } from '../store/useStore';
import { getColors, getAQIColor, spacing, borderRadius, fontSize } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { AfricaMapView } from '../components/AfricaMapView';
import { nearestCity } from '../utils/geo';
import { fetchPredictionAtCoords } from '../services/prediction';
import { useTranslation } from '../hooks/useTranslation';

export function MapScreen() {
  const { isDark } = useTheme();
  const offlineCities = useStore((s) => s.offlineCities);
  const lastPrediction = useStore((s) => s.lastPrediction);
  const predictionHistory = useStore((s) => s.predictionHistory);
  const language = useStore((s) => s.language);
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const selectedFromPrediction = lastPrediction
    ? ({
        name: lastPrediction.location.name,
        country: '',
        lat: lastPrediction.location.lat,
        lon: lastPrediction.location.lon,
        urban: true,
      } as City)
    : null;

  async function handleMapPress({ lat, lon }: { lat: number; lon: number }) {
    setError(null);
    const candidate = nearestCity(lat, lon, offlineCities);
    if (!candidate) {
      setError(t('error.prediction'));
      return;
    }
    setSelectedCity(candidate);
    setFlyTo({ lat: candidate.lat, lon: candidate.lon, zoom: 11.5 });
    setLoading(true);
    try {
      await fetchPredictionAtCoords(
        candidate.lat,
        candidate.lon,
        candidate.name,
        language,
        offlineCities
      );
      navigation.navigate('Home');
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ height: insets.top }} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('map.title')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={[styles.roundBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="search-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.mapCard, { borderColor: colors.border }]}>
        <AfricaMapView
          cities={offlineCities}
          isDark={isDark}
          selectedCity={selectedCity ?? selectedFromPrediction}
          flyTo={flyTo}
          onMapPress={handleMapPress}
        />
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {t('map.loading')}
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={[
            styles.searchOverlay,
            { backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)', borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.subtext} />
          <Text style={[styles.searchOverlayText, { color: colors.subtext }]}>
            {t('search.placeholder')}
          </Text>
        </TouchableOpacity>
        {error ? (
          <View
            style={[
              styles.errorOverlay,
              { backgroundColor: isDark ? 'rgba(15,23,42,0.94)' : 'rgba(255,255,255,0.96)', borderColor: colors.danger },
            ]}
          >
            <Text style={[styles.sheetError, { color: colors.danger, marginTop: 0 }]}>{error}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
        {predictionHistory.length > 0 ? t('map.recent') : t('map.no_recent')}
      </Text>

      {predictionHistory.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="location-outline" size={28} color={colors.subtext} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('map.empty_tap')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={predictionHistory}
          keyExtractor={(item, index) => `${item.location.lat}-${item.location.lon}-${index}`}
          renderItem={({ item }) => (
            <LocationRow
              prediction={item}
              isDark={isDark}
              onPress={() => {
                const city: City = {
                  name: item.location.name,
                  country: '',
                  lat: item.location.lat,
                  lon: item.location.lon,
                  urban: true,
                };
                setSelectedCity(city);
                setFlyTo({ lat: city.lat, lon: city.lon, zoom: 11.5 });
              }}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 200 }}
        />
      )}
    </View>
  );
}

function LocationRow({
  prediction,
  isDark,
  onPress,
}: {
  prediction: PredictionResult;
  isDark: boolean;
  onPress: () => void;
}) {
  const colors = getColors(isDark);
  const aqiColor = getAQIColor(prediction.aqi_category);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.locationRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.locationIcon, { backgroundColor: colors.accentDim }]}>
        <Ionicons name="location-outline" size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.locationName, { color: colors.text }]} numberOfLines={1}>
          {prediction.location.name}
        </Text>
        <Text style={[styles.locationSub, { color: colors.subtext }]}>
          {toDisplayLabel(prediction.aqi_category)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.locationPM, { color: aqiColor }]}>{Math.round(prediction.pm25)}</Text>
        <Text style={[styles.locationTime, { color: colors.subtext }]}>PM2.5</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mapCard: {
    marginHorizontal: spacing.md,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    height: 420,
    marginBottom: spacing.md,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  searchOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 10,
  },
  searchOverlayText: {
    fontSize: fontSize.md,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    zIndex: 10,
  },
  sheetError: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  locationName: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  locationSub: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  locationPM: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    lineHeight: 30,
  },
  locationTime: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
