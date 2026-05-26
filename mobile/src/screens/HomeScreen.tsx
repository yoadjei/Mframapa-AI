import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet,
  Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { fetchPredictionAtCoords } from '../services/prediction';
import { isAfricanCountryCode } from '../utils/africanCountries';
import { OfflineBanner } from '../components/OfflineBanner';
import { AQIBadge } from '../components/ui/AQIBadge';
import { getColors, Colors } from '../theme';
import { getAQIColor } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { aqiCategoryKey } from '../utils/i18nHelpers';
import { MframapaLogo } from '../components/MframapaLogo';

export function HomeScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const lastPrediction = useStore((s) => s.lastPrediction);
  const offlineCities  = useStore((s) => s.offlineCities);
  const language       = useStore((s) => s.language);
  const unreadCount    = useStore((s) => s.notifications.filter((n) => !n.read).length);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // AQI count-up animation
  const animVal = useRef(new Animated.Value(0)).current;
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    if (!lastPrediction) return;
    animVal.setValue(0);
    Animated.timing(animVal, { toValue: lastPrediction.pm25, duration: 600, useNativeDriver: false }).start();
    const id = animVal.addListener(({ value }) => setDisplayNum(Math.round(value)));
    return () => animVal.removeListener(id);
  }, [lastPrediction?.pm25]);

  async function handleLocate() {
    setError(null);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setError(t('error.location')); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo?.isoCountryCode && !isAfricanCountryCode(geo.isoCountryCode)) {
        setError(t('error.outside_africa'));
        return;
      }
      const name = geo?.city ?? geo?.district ?? geo?.region ?? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      await fetchPredictionAtCoords(latitude, longitude, name, language, offlineCities);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'OUTSIDE_AFRICA') setError(t('error.outside_africa'));
      else if (msg.toLowerCase().includes('network') || msg === 'ERR_NETWORK') setError(t('error.network'));
      else setError(t('error.prediction'));
    } finally {
      setLoading(false);
    }
  }

  const pred = lastPrediction;
  const aqiColor = pred ? getAQIColor(pred.aqi_category) : Colors.brandGreen;

  function openCityDetail() {
    if (!pred) return;
    navigation.navigate('CityDetail', { prediction: pred });
  }

  const heroCardContent = (
    <>
      <Text style={[styles.pm25Label, { color: colors.subtext }]}>{t('card.pm25')}</Text>
      <View style={styles.aqiRow}>
        <Text style={[styles.aqiNumber, { color: colors.text }]}>{pred ? displayNum : '--'}</Text>
        {pred ? (
          <AQIBadge
            category={pred.aqi_category}
            label={t(aqiCategoryKey(pred.aqi_category))}
            size="lg"
          />
        ) : null}
      </View>
      <Text style={[styles.locationStamp, { color: colors.subtext }]}>
        {pred
          ? `${pred.location.name} | ${t('card.today')}, ${new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
          : t('home.tap_check')}
      </Text>
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ height: insets.top }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

        {/* Header */}
        <View style={styles.header}>
          <MframapaLogo size="sm" />
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Location Selector */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={[styles.locationChip, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="location-outline" size={14} color={Colors.brandGreen} />
          <Text style={[styles.locationText, { color: colors.text }]}>
            {pred ? `${pred.location.name}` : t('home.select_city')}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.subtext} />
        </TouchableOpacity>

        <OfflineBanner />

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: Colors.danger + '18', borderColor: Colors.danger + '40' }]}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text style={[styles.errorText, { color: Colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {/* Primary AQI Hero Card */}
        <View style={styles.heroCardWrap}>
          <TouchableOpacity
            onPress={openCityDetail}
            disabled={!pred}
            activeOpacity={pred ? 0.85 : 1}
            accessibilityRole={pred ? 'button' : undefined}
            accessibilityLabel={pred ? t('screen.city_detail.air_quality') : undefined}
            style={[
              styles.heroCard,
              {
                backgroundColor: pred ? aqiColor + (isDark ? '22' : '14') : colors.card,
                borderColor: pred ? aqiColor + (isDark ? '45' : '40') : colors.border,
              },
            ]}
          >
            {heroCardContent}
            {pred ? (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.subtext}
                style={styles.heroChevron}
              />
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Secondary Stat Cards */}
        {pred ? (
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>{t('card.aqi_level')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{pred.pm25.toFixed(0)}</Text>
              <Text style={[styles.statSub, { color: getAQIColor(pred.aqi_category) }]}>
                ({t(aqiCategoryKey(pred.aqi_category))})
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>{t('card.main_pollutant')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{t('card.pm25')}</Text>
            </View>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          {[
            { icon: 'navigate-circle-outline' as const, label: t('home.action_check'), action: handleLocate, loading },
            { icon: 'search-outline' as const, label: t('tab.search'), action: () => navigation.navigate('Search') },
            { icon: 'notifications-outline' as const, label: t('tab.alerts'), action: () => navigation.navigate('Alerts') },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={item.action}
              disabled={item.loading}
              style={[styles.actionTile, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {item.loading
                ? <ActivityIndicator size="small" color={Colors.brandGreen} />
                : <Ionicons name={item.icon} size={24} color={Colors.brandGreen} />
              }
              <Text style={[styles.actionLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weather Stats (Android-style row, shown on Android) */}
        {pred && Platform.OS === 'android' ? (
          <View style={styles.weatherRow}>
            <View style={[styles.weatherCard, { backgroundColor: colors.card }]}>
              <Ionicons name="water-outline" size={20} color={Colors.brandGreen} />
              <Text style={[styles.weatherValue, { color: colors.text }]}>
                {pred.weather.humidity.toFixed(0)}%
              </Text>
              <Text style={[styles.weatherLabel, { color: colors.subtext }]}>{t('weather.humidity')}</Text>
            </View>
            <View style={[styles.weatherCard, { backgroundColor: colors.card }]}>
              <Ionicons name="speedometer-outline" size={20} color={Colors.brandGreen} />
              <Text style={[styles.weatherValue, { color: colors.text }]}>
                {pred.weather.wind.toFixed(1)} m/h
              </Text>
              <Text style={[styles.weatherLabel, { color: colors.subtext }]}>{t('home.wind_speed')}</Text>
            </View>
          </View>
        ) : null}
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
    paddingVertical: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wordmark: { fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  bellBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  locationText: { fontSize: 14, fontWeight: '600' },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500' },
  heroCardWrap: { paddingHorizontal: 16, marginBottom: 12 },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    minHeight: 160,
    justifyContent: 'space-between',
    position: 'relative',
  },
  heroChevron: { position: 'absolute', top: 20, right: 16 },
  pm25Label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  aqiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  aqiNumber: { fontSize: 56, fontWeight: '800', lineHeight: 60 },
  locationStamp: { fontSize: 12 },
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  statLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statSub: { fontSize: 12, fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  actionTile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  weatherRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  weatherCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  weatherValue: { fontSize: 18, fontWeight: '700' },
  weatherLabel: { fontSize: 12 },
});
