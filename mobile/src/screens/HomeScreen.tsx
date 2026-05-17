import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { fetchPredictionAtCoords } from '../services/prediction';
import { isInAfrica } from '../utils/geo';
import { AQICard } from '../components/AQICard';
import { MframapaLogo } from '../components/MframapaLogo';
import { OfflineBanner } from '../components/OfflineBanner';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';

export function HomeScreen() {
  const { isDark } = useTheme();
  const lastPrediction = useStore((s) => s.lastPrediction);
  const offlineCities = useStore((s) => s.offlineCities);
  const language = useStore((s) => s.language);
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const [geo] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const name =
        geo?.city ??
        geo?.district ??
        geo?.region ??
        `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

      await fetchPredictionAtCoords(latitude, longitude, name, language, offlineCities);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'OUTSIDE_AFRICA') {
        setError(t('error.outside_africa'));
      } else if (message.toLowerCase().includes('network') || message === 'ERR_NETWORK') {
        setError(t('error.network'));
      } else if (message === 'CACHED') {
        setError(t('error.cached_fallback'));
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <LinearGradient
          colors={
            isDark
              ? ['#0E1C28', '#0B1018', '#0B1018']
              : ['#ECF8F2', '#F4FAF7', '#F4FAF7']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroShell}
        >
          <View style={styles.header}>
            <MframapaLogo size="md" />
            <TouchableOpacity
              onPress={() => navigation.navigate('Alerts')}
              style={[
                styles.headerIcon,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {lastPrediction ? t('home.track') : t('home.subtitle')}
          </Text>

          {lastPrediction ? (
            <TouchableOpacity
              style={[styles.locationChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="location-outline" size={14} color={colors.accent} />
              <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                {lastPrediction.location.name}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.subtext} />
            </TouchableOpacity>
          ) : null}
        </LinearGradient>

        <OfflineBanner />

        {error ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: colors.danger + '12', borderColor: colors.danger + '33' },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {lastPrediction ? (
          <AQICard prediction={lastPrediction} isDark={isDark} />
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accentDim }]}>
              <Ionicons name="leaf-outline" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('home.empty_title')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.subtext }]}>
              {t('home.empty_sub')}
            </Text>
          </View>
        )}

        <View style={styles.actionGrid}>
          <ActionTile
            icon={loading ? undefined : 'navigate-circle-outline'}
            label={t('home.action_check')}
            sublabel={t('home.locate')}
            colors={colors}
            emphasis
            loading={loading}
            onPress={handleLocate}
          />
          <ActionTile
            icon="search-outline"
            label={t('search.title')}
            sublabel={t('home.action_search_sub')}
            colors={colors}
            onPress={() => navigation.navigate('Search')}
          />
          <ActionTile
            icon="notifications-outline"
            label={t('home.action_alerts')}
            sublabel={t('home.action_alerts_sub')}
            colors={colors}
            onPress={() => navigation.navigate('Alerts')}
          />
        </View>

        {lastPrediction ? (
          <View style={styles.infoRow}>
            <InfoMiniCard
              label={t('weather.humidity')}
              value={`${lastPrediction.weather.humidity.toFixed(0)}%`}
              icon="water-outline"
              colors={colors}
            />
            <InfoMiniCard
              label={t('weather.wind')}
              value={`${lastPrediction.weather.wind.toFixed(1)} m/s`}
              icon="speedometer-outline"
              colors={colors}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ActionTile({
  icon,
  label,
  sublabel,
  colors,
  emphasis,
  loading,
  onPress,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel: string;
  colors: ReturnType<typeof getColors>;
  emphasis?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        styles.actionTile,
        {
          backgroundColor: emphasis ? colors.accentDim : colors.card,
          borderColor: emphasis ? colors.accent + '44' : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: emphasis ? colors.accent : colors.surface },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={emphasis ? '#FFFFFF' : colors.accent} />
        ) : (
          <Ionicons
            name={icon ?? 'ellipse-outline'}
            size={18}
            color={emphasis ? '#FFFFFF' : colors.accent}
          />
        )}
      </View>
      <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.actionSub, { color: colors.subtext }]}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

function InfoMiniCard({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  colors: ReturnType<typeof getColors>;
}) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.infoLabel, { color: colors.subtext }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  heroShell: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 6,
  },
  locationText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    maxWidth: 220,
  },
  errorBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  actionTile: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 132,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  actionLabel: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  actionSub: {
    fontSize: fontSize.xs,
    marginTop: 4,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  infoCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  infoLabel: {
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
});
