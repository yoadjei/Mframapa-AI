import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AQIBadge } from '../components/ui/AQIBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { LineChart } from '../components/charts/LineChart';
import { getHistory } from '../services/api';
import { getColors, Colors, AppBackgroundColors } from '../theme';
import { getAQIColor } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import { PredictionResult, useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { aqiCategoryKey, healthAdviceKey } from '../utils/i18nHelpers';
import { cleanGuidanceText } from '../utils/cleanGuidanceText';
import { isDegradedPrediction } from '../utils/deriveHealthRisks';
import { ShareSheetScreen } from './system/ShareSheetScreen';
import { generateInsight } from '../services/api';
import { languageName } from '../utils/constants';

const TREND_DAY_KEYS = [
  'screen.city_detail.day_mon',
  'screen.city_detail.day_tue',
  'screen.city_detail.day_wed',
  'screen.city_detail.day_thu',
  'screen.city_detail.day_fri',
  'screen.city_detail.day_sat',
  'screen.city_detail.day_sun'] as const;

// invented context cards removed: they cited data we do not have.

function locationId(lat: number, lon: number): string {
  return `${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

function resolveCountry(
  name: string,
  lat: number,
  lon: number,
  cities: { name: string; country: string; lat: number; lon: number }[]
): string {
  const shortName = name.split(',')[0].trim();
  const fromList = cities.find(
    (c) =>
      c.name === shortName ||
      (Math.abs(c.lat - lat) < 0.05 && Math.abs(c.lon - lon) < 0.05)
  );
  if (fromList?.country) return fromList.country;
  const parts = name.split(',').slice(1).map((p) => p.trim()).filter(Boolean);
  return parts.join(', ') || '';
}

export function CityDetailScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const addSavedLocation = useStore((s) => s.addSavedLocation);
  const savedLocations = useStore((s) => s.savedLocations);
  const offlineCities = useStore((s) => s.offlineCities);
  const lastPrediction = useStore((s) => s.lastPrediction);
  const setPrediction = useStore((s) => s.setPrediction);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();
  const [shareVisible, setShareVisible] = useState(false);
  const [insight, setInsight] = useState<string | undefined>();
  const [insightLoading, setInsightLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pred: PredictionResult | null =
    route.params?.prediction ?? lastPrediction ?? null;

  const cityId = pred ? locationId(pred.location.lat, pred.location.lon) : '';
  const isSaved = savedLocations.some(
    (loc) =>
      loc.id === cityId ||
      (pred &&
        Math.abs(loc.lat - pred.location.lat) < 0.01 &&
        Math.abs(loc.lon - pred.location.lon) < 0.01)
  );
  const displayName = pred?.location.name.split(',')[0].trim() ?? '';

  const cityName = pred?.location?.name ?? t('home.select_city');
  const pm25 = pred?.pm25 ?? 0;
  const category = pred?.aqi_category ?? 'good';
  const aqiColor = getAQIColor(category, isDark);
  const pageBg = isDark ? AppBackgroundColors.dark : AppBackgroundColors.light;
  // Light AQI washes are pale — white chrome fails contrast (PWA parity).
  const chromeColor = isDark ? '#FFFFFF' : colors.text;
  const headerGradient = isDark
    ? [aqiColor + 'CC', aqiColor + '66', pageBg]
    : [aqiColor + '33', aqiColor + '14', pageBg];
  const categoryLabel = t(aqiCategoryKey(category));
  const healthAdvice = cleanGuidanceText(t(healthAdviceKey(category)));
  const trendLabels = TREND_DAY_KEYS.map((key) => t(key));
  // real recent days rather than today's number times fixed multipliers
  const [trendData, setTrendData] = useState<number[]>([]);
  useEffect(() => {
    const lat = pred?.location?.lat;
    const lon = pred?.location?.lon;
    if (lat == null || lon == null) { setTrendData([]); return; }
    let cancelled = false;
    getHistory(lat, lon, pred?.location?.name ?? 'Unknown', 7)
      .then((days) => { if (!cancelled) setTrendData(days.map((d) => Math.round(d.pm25))); })
      .catch(() => { if (!cancelled) setTrendData([]); });
    return () => { cancelled = true; };
  }, [pred?.location?.lat, pred?.location?.lon, pred?.location?.name]);
  const updatedAt = pred?.timestamp
    ? new Date(pred.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    setInsight(pred?.insight);
    setInsightLoading(false);
  }, [pred?.insight, pred?.location?.lat, pred?.location?.lon]);

  useEffect(() => {
    if (!pred) return undefined;
    // Already have insight from predict/cache — don't spin forever.
    if (pred.insight) {
      setInsightLoading(false);
      return undefined;
    }

    let cancelled = false;
    setInsightLoading(true);

    const fullName = useStore.getState().profile.fullName;
    generateInsight({
      pm25: pred.pm25,
      aqi_category: pred.aqi_category,
      weather: pred.weather,
      language,
      language_name: languageName(language),
      lat: pred.location?.lat,
      lon: pred.location?.lon,
      name: fullName && fullName !== 'Guest' ? fullName : undefined,
    })
      .then((text) => {
        if (cancelled) return;
        setInsight(text);
        const isCurrent =
          lastPrediction &&
          Math.abs(lastPrediction.location.lat - pred.location.lat) < 0.01 &&
          Math.abs(lastPrediction.location.lon - pred.location.lon) < 0.01;
        if (isCurrent) {
          setPrediction({ ...pred, insight: text });
        }
      })
      .catch(() => {
        if (!cancelled) setInsight(undefined);
      })
      .finally(() => {
        if (!cancelled) setInsightLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pred?.location?.lat, pred?.location?.lon, language, pred?.insight]);

  async function handleSave() {
    if (!pred || isSaved || saving) return;

    setSaving(true);
    const country = resolveCountry(
      pred.location.name,
      pred.location.lat,
      pred.location.lon,
      offlineCities
    );
    const checkedAt = new Date().toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    addSavedLocation({
      id: cityId,
      name: displayName || pred.location.name,
      country,
      lat: pred.location.lat,
      lon: pred.location.lon,
      lastPm25: pred.pm25,
      lastAqiCategory: pred.aqi_category,
      lastChecked: checkedAt,
    });

    setSaving(false);
    Alert.alert(
      t('screen.city_detail.save_success_title'),
      t('screen.city_detail.save_success', { city: displayName || pred.location.name })
    );
  }

  if (!pred) {
    return (
      <View style={[styles.root, styles.emptyRoot]}>
        <Text style={[styles.emptyText, { color: colors.subtext }]}>{t('home.tap_check')}</Text>
        <PrimaryButton label={t('common.back')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={[styles.root]}>
      <LinearGradient
        colors={headerGradient as [string, string, string]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          {/* Chevron only — match PWA StackBackButton variant="chevron". */}
          <Ionicons name="chevron-back" size={22} color={chromeColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: chromeColor }]}>{cityName}</Text>
        <TouchableOpacity
          onPress={() => setShareVisible(true)}
          style={styles.shareBtn}
          accessibilityRole="button"
          accessibilityLabel={t('screen.share.title')}
        >
          {/* Network share nodes — matches Lucide Share on PWA (not iOS box+arrow). */}
          <Ionicons name="share-social-outline" size={22} color={chromeColor} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.aqiBlock, { backgroundColor: aqiColor + '18' }]}>
          {isDegradedPrediction(pred) ? (
            <View style={[styles.degradedBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.subtext} />
              <Text style={[styles.degradedText, { color: colors.text }]}>
                {t('screen.city_detail.degraded_banner')}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.updatedText, { color: colors.subtext }]}>
            {t('screen.city_detail.updated_at', { time: updatedAt })}
          </Text>
          <Text style={[styles.aqiLabel, { color: colors.subtext }]}>
            {t('screen.city_detail.pm25_concentration')}
          </Text>
          <View style={styles.aqiRow}>
            <Text style={[styles.aqiNum, { color: colors.text }]}>{pm25.toFixed(0)}</Text>
            <View style={styles.aqiMeta}>
              <Text style={[styles.aqiUnit, { color: colors.subtext }]}>{t('unit.ug_m3')}</Text>
              <AQIBadge category={category} label={categoryLabel} size="lg" />
            </View>
          </View>
          <Text style={[styles.uncertaintyText, { color: colors.subtext }]}>
            {t('screen.city_detail.uncertainty_range')}: {pred.uncertainty.pm25_lower.toFixed(0)}–
            {pred.uncertainty.pm25_upper.toFixed(0)} {t('unit.ug_m3')}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={18} color={Colors.brandGreen} />
          <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
            {t('screen.city_detail.ai_insights_section')}
          </Text>
        </View>

        <View style={[styles.section, styles.insightPrimary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.insightHeader}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.brandGreen} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('card.insight_title')}</Text>
          </View>
          {insightLoading ? (
            <View style={styles.insightLoading}>
              <ActivityIndicator color={Colors.brandGreen} />
              <Text style={[styles.insightLoadingText, { color: colors.subtext }]}>
                {t('screen.city_detail.insight_loading')}
              </Text>
            </View>
          ) : insight ? (
            <Text style={[styles.insightBody, { color: colors.text }]}>
              {cleanGuidanceText(insight)}
            </Text>
          ) : (
            <Text style={[styles.insightBody, { color: colors.subtext }]}>
              {t('screen.ai_insights.no_insights_yet')}
            </Text>
          )}
        </View>


        {trendData.length > 1 ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('screen.city_detail.trend_7d')}</Text>
            <Text style={[styles.trendHint, { color: colors.subtext }]}>
              {t('screen.city_detail.trend_7d_hint')}
            </Text>
            <LineChart data={trendData} labels={trendLabels} isDark={isDark} color={aqiColor} height={120} />
          </View>
        ) : null}

        {pred.factors && pred.factors.length > 0 ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('card.factors_title')}</Text>
            {pred.factors.slice(0, 6).map((factor) => (
              <View key={factor} style={styles.factorRow}>
                <Ionicons name="ellipse" size={6} color={Colors.brandGreen} />
                <Text style={[styles.factorText, { color: colors.text }]}>
                  {typeof factor === 'string' ? factor.replace(/_/g, ' ') : String(factor)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}


        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('card.health_guidance')}</Text>
          <Text style={[styles.healthText, { color: colors.text }]}>{healthAdvice}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('HealthRisk', { prediction: pred })}
            style={styles.healthLink}
          >
            <Text style={[styles.healthLinkText, { color: Colors.brandGreen }]}>
              {t('screen.city_detail.view_health_risk')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.brandGreen} />
          </TouchableOpacity>
        </View>

        <View style={styles.saveSection}>
          {isSaved ? (
            <View style={[styles.savedBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.brandGreen} />
              <Text style={[styles.savedText, { color: colors.text }]}>{t('screen.city_detail.saved')}</Text>
            </View>
          ) : (
            <PrimaryButton
              label={t('screen.city_detail.save')}
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
            />
          )}
        </View>
      </ScrollView>

      <ShareSheetScreen
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        cityName={cityName}
        pm25={pm25}
        category={category}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyRoot: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', minWidth: 44, minHeight: 44 },
  shareBtn: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', flex: 1 },
  aqiBlock: { padding: 24, alignItems: 'flex-start', gap: 6 },
  degradedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    width: '100%',
  },
  degradedText: { fontSize: 14, lineHeight: 20, flex: 1 },
  updatedText: { fontSize: 12, marginBottom: 4 },
  aqiLabel: { fontSize: 13, fontWeight: '500' },
  aqiRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: 4 },
  aqiNum: { fontSize: 56, fontWeight: '800', lineHeight: 60 },
  aqiMeta: { gap: 8, paddingBottom: 8 },
  aqiUnit: { fontSize: 13, fontWeight: '600' },
  uncertaintyText: { fontSize: 13, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHeaderText: { fontSize: 16, fontWeight: '700' },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  insightPrimary: { marginTop: 4 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  insightLoadingText: { fontSize: 14, flex: 1 },
  insightBody: { fontSize: 15, lineHeight: 22 },
  contextInsight: { gap: 8 },
  contextIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextTitle: { fontSize: 16, fontWeight: '700' },
  contextDesc: { fontSize: 14, lineHeight: 20 },
  sourcePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  sourceText: { fontSize: 12, fontWeight: '500' },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  trendHint: { fontSize: 12, lineHeight: 16, marginBottom: 8, marginTop: 2 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factorText: { fontSize: 14, textTransform: 'capitalize' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaText: { fontSize: 12, fontWeight: '500', flex: 1 },
  healthText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  healthLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  healthLinkText: { fontSize: 14, fontWeight: '600' },
  saveSection: { paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },
  saveBtn: {},
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  savedText: { fontSize: 15, fontWeight: '600' },
});
