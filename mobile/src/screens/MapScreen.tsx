import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { isLocationInAfricanNation, nearestCityWithin, MAX_CITY_SNAP_DEG } from '../utils/geo';
import { getColors, Colors } from '../theme';
import { getAQIColor } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import { AfricaMapView, MapMarker } from '../components/AfricaMapView';
import { useTranslation } from '../hooks/useTranslation';
import { useStore, PredictionResult } from '../store/useStore';
import { fetchPredictionAtCoords } from '../services/prediction';
import { reverseGeocodePlace } from '../services/mapboxGeocoding';

export function MapScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const offlineCities = useStore((s) => s.offlineCities);
  const liteMode = useStore((s) => s.liteMode);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const fetchGen = useRef(0);
  const [flyTo, setFlyTo] = useState<{
    lat: number;
    lon: number;
    zoom?: number;
    pitch?: number;
    showUserMarker?: boolean;
    key?: number;
  } | null>(null);

  const selectedPin: MapMarker | null = useMemo(() => {
    if (!prediction) return null;
    return {
      name: prediction.location.name,
      lat: prediction.location.lat,
      lon: prediction.location.lon,
      color: getAQIColor(prediction.aqi_category),
    };
  }, [prediction]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const pool = q
      ? offlineCities.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.country.toLowerCase().includes(q)
        )
      : offlineCities;
    const limit = liteMode ? 80 : 250;
    return pool.slice(0, limit).map((city) => ({
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      color: getAQIColor('good'),
    }));
  }, [offlineCities, search, liteMode]);

  function showError(message: string) {
    Alert.alert(message);
  }

  async function resolvePlaceName(
    lat: number,
    lon: number,
    markerName?: string
  ): Promise<string> {
    if (markerName?.trim()) return markerName.trim();
    const geocoded = await reverseGeocodePlace(lat, lon);
    if (geocoded) return geocoded;
    const near = nearestCityWithin(lat, lon, offlineCities, MAX_CITY_SNAP_DEG);
    if (near) return near.name;
    return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  }

  async function loadPredictionAt(
    lat: number,
    lon: number,
    markerName?: string,
    isWater?: boolean
  ) {
    if (isWater) {
      setPrediction(null);
      showError(t('error.water_only'));
      return;
    }
    const gen = ++fetchGen.current;
    setLoading(true);

    try {
      const inAfrica = await isLocationInAfricanNation(lat, lon, offlineCities);
      if (!inAfrica) {
        setPrediction(null);
        showError(t('error.outside_africa'));
        return;
      }

      const placeName = await resolvePlaceName(lat, lon, markerName);
      const result = await fetchPredictionAtCoords(
        lat,
        lon,
        placeName,
        language,
        offlineCities
      );
      if (gen !== fetchGen.current) return;
      setPrediction(result);
      setFlyTo({
        lat: result.location.lat,
        lon: result.location.lon,
        zoom: 10,
        pitch: 40,
        key: Date.now(),
      });
      navigation.navigate('CityDetail', { prediction: result });
    } catch (err: unknown) {
      if (gen !== fetchGen.current) return;
      setPrediction(null);
      const code = err instanceof Error ? err.message : '';
      if (code === 'OUTSIDE_AFRICA') {
        showError(t('error.outside_africa'));
      } else {
        showError(t('error.prediction'));
      }
    } finally {
      if (gen === fetchGen.current) setLoading(false);
    }
  }

  function handleMapPress({
    lat,
    lon,
    name,
    isWater,
  }: {
    lat: number;
    lon: number;
    name?: string;
    isWater?: boolean;
  }) {
    void loadPredictionAt(lat, lon, name, isWater);
  }

  async function handleLocate() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const { latitude, longitude } = loc.coords;
    setFlyTo({
      lat: latitude,
      lon: longitude,
      zoom: 15,
      pitch: 55,
      showUserMarker: true,
      key: Date.now(),
    });
    await loadPredictionAt(latitude, longitude);
  }

  return (
    <View style={[styles.root, { backgroundColor: isDark ? Colors.bgPrimary : '#E8F5E9' }]}>
      <AfricaMapView
        cities={offlineCities}
        markers={mapMarkers}
        isDark={isDark}
        liteMode={liteMode}
        selectedCity={selectedPin}
        flyTo={flyTo}
        onMapPress={handleMapPress}
      />

      <View style={[styles.searchWrap, { top: insets.top + 12 }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? Colors.bgCard : '#fff' }]}>
          <Ionicons name="search-outline" size={16} color={colors.subtext} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('search.city_placeholder')}
            placeholderTextColor={colors.subtext}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLocate}
        style={[styles.locBtn, { backgroundColor: colors.card, bottom: insets.bottom + 24 }]}
        accessibilityLabel={t('search.locate')}
      >
        <Ionicons name="locate-outline" size={20} color={colors.text} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.brandGreen} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { position: 'absolute', left: 16, right: 16, zIndex: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15 },
  locBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
