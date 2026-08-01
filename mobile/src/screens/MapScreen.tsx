import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { isLocationInAfricanNation, nearestCityWithin, MAX_CITY_SNAP_DEG } from '../utils/geo';
import { getColors, Colors } from '../theme';
import { getAQIColor } from '../theme/colors';
import { getMapSummary, MapSummaryCity } from '../services/api';
import { formatUsualPreview } from '../services/cities';

import { useTheme } from '../hooks/useTheme';
import { AfricaMapView, AfricaMapViewHandle, MapMarker } from '../components/AfricaMapView';
import { useTranslation } from '../hooks/useTranslation';
import { useStore, PredictionResult } from '../store/useStore';
import { fetchPredictionAtCoords } from '../services/prediction';
import {
  reverseGeocodePlace,
  fetchAfricanPlaceSuggestions,
  PlaceSuggestion,
} from '../services/mapboxGeocoding';

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
  const mapRef = useRef<AfricaMapViewHandle>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const hasFlownToUserRef = useRef(false);
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
      color: getAQIColor(prediction.aqi_category, isDark),
    };
  }, [prediction, isDark]);

  // Marker pool is independent of `search` — filtering it per-keystroke is what
  // caused the flicker. Search now drives the suggestion dropdown only.
  const [summary, setSummary] = useState<MapSummaryCity[]>([]);
  useEffect(() => {
    let active = true;
    getMapSummary().then((rows) => { if (active) setSummary(rows); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const mapMarkers: MapMarker[] = useMemo(() => {
    // Map dots stay on the warm summary (~200). Search uses the full offline list.
    return summary.map((r) => ({
      name: r.name,
      lat: r.lat,
      lon: r.lon,
      color: getAQIColor(r.aqi_category, isDark),
    }));
  }, [summary, isDark]);

  // ── Search suggestions (offline-instant + debounced Mapbox enrich) ────────
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const suggestionGen = useRef(0);

  useEffect(() => {
    const text = search.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    // Instant offline matches — no network, no debounce.
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

    // Mapbox enrichment requires ≥3 chars (per service) and is debounced
    // so we don't hit the API on every keystroke.
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
        ].slice(0, 8);
        setSuggestions(merged);
      } catch {
        /* keep offline results */
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, offlineCities]);

  function selectSuggestion(s: PlaceSuggestion) {
    Keyboard.dismiss();
    setSearchFocused(false);
    setSearch('');
    setSuggestions([]);
    const cityName = s.placeName.split(',')[0]?.trim() || s.placeName;
    setFlyTo({
      lat: s.lat,
      lon: s.lon,
      zoom: 10,
      pitch: 40,
      key: Date.now(),
    });
    void loadPredictionAt(s.lat, s.lon, cityName);
  }

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

  useEffect(() => () => {
    locationWatchRef.current?.remove();
    locationWatchRef.current = null;
  }, []);

  async function handleLocate() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      showError(t('error.location'));
      return;
    }

    locationWatchRef.current?.remove();
    hasFlownToUserRef.current = false;

    locationWatchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 3,
        timeInterval: 2000,
      },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        const shouldFly = !hasFlownToUserRef.current;
        if (shouldFly) {
          hasFlownToUserRef.current = true;
          setFlyTo({
            lat: latitude,
            lon: longitude,
            zoom: 15,
            pitch: 55,
            showUserMarker: true,
            key: Date.now(),
          });
        } else {
          mapRef.current?.updateUserLocation(latitude, longitude);
        }
      },
    );
  }

  const chromeBg = isDark ? Colors.bgCard : '#fff';

  return (
    <View style={styles.root}>
      <AfricaMapView
        ref={mapRef}
        cities={offlineCities}
        markers={mapMarkers}
        isDark={isDark}
        liteMode={liteMode}
        selectedCity={selectedPin}
        flyTo={flyTo}
        onMapPress={handleMapPress}
      />

      <View style={[styles.topChrome, { top: insets.top + 12 }]}>
        <View style={[styles.searchBar, { backgroundColor: chromeBg }]}>
          <Ionicons name="search-outline" size={16} color={colors.subtext} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            // 150ms delay lets a tap on a suggestion fire before the
            // dropdown unmounts on blur.
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder={t('search.city_placeholder')}
            placeholderTextColor={colors.subtext}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="words"
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setSuggestions([]);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t('search.clear')}
            >
              <Ionicons name="close-circle" size={18} color={colors.subtext} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => void handleLocate()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={t('search.locate')}
          >
            <Ionicons name="location-sharp" size={20} color={Colors.brandGreen} />
          </TouchableOpacity>
        </View>

        {searchFocused && suggestions.length > 0 ? (
          <View style={[styles.suggestionsCard, { backgroundColor: chromeBg }]}>
            {suggestions.map((s, idx) => {
              const isLast = idx === suggestions.length - 1;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => selectSuggestion(s)}
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    !isLast && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: 'rgba(128,128,128,0.18)',
                    },
                    pressed && { backgroundColor: 'rgba(128,128,128,0.08)' },
                  ]}
                >
                  <Ionicons name="location-outline" size={16} color={colors.subtext} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[styles.suggestionText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {s.placeName}
                    </Text>
                    {formatUsualPreview(s) ? (
                      <Text
                        style={[styles.suggestionUsual, { color: colors.muted }]}
                        numberOfLines={1}
                      >
                        {formatUsualPreview(s)}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.zoomStack}>
          <TouchableOpacity
            onPress={() => mapRef.current?.zoomIn()}
            style={[styles.zoomBtn, styles.zoomBtnTop, { backgroundColor: chromeBg }]}
            accessibilityLabel={t('map.zoom_in')}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => mapRef.current?.zoomOut()}
            style={[styles.zoomBtn, styles.zoomBtnBottom, { backgroundColor: chromeBg }]}
            accessibilityLabel={t('map.zoom_out')}
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none" accessibilityRole="progressbar">
          <ActivityIndicator size="large" color={Colors.brandGreen} />
          <Text style={[styles.loadingText, { color: colors.text }]}>{t('map.loading')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const chromeShadow = {
  shadowColor: '#000',
  shadowRadius: 8,
  shadowOpacity: 0.15,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topChrome: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 2,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    ...chromeShadow,
  },
  searchInput: { flex: 1, fontSize: 15 },
  suggestionsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    ...chromeShadow,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionText: {
    fontSize: 14,
  },
  suggestionUsual: {
    fontSize: 12,
    marginTop: 2,
  },
  zoomStack: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    overflow: 'hidden',
    ...chromeShadow,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnTop: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  zoomBtnBottom: {},
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 280,
  },
});
