import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PredictionResult } from '../store/useStore';
import { getColors, getAQIColor, spacing, borderRadius, fontSize, HERO_GRADIENT } from '../theme';
import { useTranslation } from '../hooks/useTranslation';
import { aqiCategoryKey, healthAdviceKey } from '../utils/i18nHelpers';

interface AQICardProps {
  prediction: PredictionResult;
  isDark: boolean;
}

export function AQICard({ prediction, isDark }: AQICardProps) {
  const { t } = useTranslation();
  const colors = getColors(isDark);
  const aqiColor = getAQIColor(prediction.aqi_category);
  const categoryLabel = t(aqiCategoryKey(prediction.aqi_category));
  const healthAdvice = t(healthAdviceKey(prediction.aqi_category));
  const shortLocation = prediction.location.name.split(',')[0];
  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={HERO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.caption}>{t('card.current_city')}</Text>
            <Text style={styles.location}>{shortLocation}</Text>
          </View>
          <View style={styles.menuPill}>
            <Ionicons name="ellipsis-vertical" size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </View>

        <Text style={styles.metricLabel}>{t('card.pm25')}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.metricValue}>{Math.round(prediction.pm25)}</Text>
          <View style={[styles.statusPill, { backgroundColor: aqiColor }]}>
            <Text style={styles.statusText}>{categoryLabel}</Text>
          </View>
        </View>

        <Text style={styles.metaLine}>
          {t('card.meta', {
            city: shortLocation,
            day: t('card.today'),
            time: timestamp,
          })}
        </Text>

        <View style={styles.weatherRow}>
          <WeatherChip
            icon="water-outline"
            label={t('weather.humidity')}
            value={`${prediction.weather.humidity.toFixed(0)}%`}
          />
          <WeatherChip
            icon="navigate-outline"
            label={t('weather.wind')}
            value={`${prediction.weather.wind.toFixed(1)} m/s`}
          />
          <WeatherChip
            icon="pulse-outline"
            label={t('weather.range')}
            value={`${prediction.uncertainty.pm25_lower.toFixed(0)}-${prediction.uncertainty.pm25_upper.toFixed(0)}`}
          />
        </View>
      </LinearGradient>

      <View style={styles.detailRow}>
        <DetailCard
          title={t('card.aqi_level')}
          value={Math.round(prediction.pm25).toString()}
          subtitle={categoryLabel}
          colors={colors}
          valueColor={aqiColor}
        />
        <DetailCard
          title={t('card.main_pollutant')}
          value={t('card.pm25')}
          subtitle={t('card.weather_suffix', {
            temp: prediction.weather.temp.toFixed(0),
          })}
          colors={colors}
          valueColor={colors.text}
        />
      </View>

      {prediction.insight ? (
        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.insightHeader}>
            <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
            <Text style={[styles.insightTitle, { color: colors.text }]}>{t('card.insight_title')}</Text>
          </View>
          <Text style={[styles.insightBody, { color: colors.subtext }]}>{prediction.insight}</Text>
        </View>
      ) : null}

      {prediction.factors && prediction.factors.length > 0 ? (
        <View style={[styles.factorsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.factorsTitle, { color: colors.subtext }]}>{t('card.factors_title')}</Text>
          {prediction.factors.slice(0, 4).map((factor) => (
            <Text key={factor} style={[styles.factorItem, { color: colors.text }]}>
              • {factor.replace(/_/g, ' ')}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[styles.healthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.healthHeader}>
          <Text style={[styles.healthLabel, { color: colors.subtext }]}>{t('card.health_guidance')}</Text>
          <View style={[styles.healthTone, { backgroundColor: aqiColor + '22' }]}>
            <Text style={[styles.healthToneText, { color: aqiColor }]}>{categoryLabel}</Text>
          </View>
        </View>
        <Text style={[styles.healthBody, { color: colors.text }]}>{healthAdvice}</Text>
      </View>

      {prediction.model ? (
        <Text style={[styles.modelText, { color: colors.subtext }]}>
          {t('card.model_prefix', { model: prediction.model })}
        </Text>
      ) : null}
    </View>
  );
}

function WeatherChip({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.weatherChip}>
      <Ionicons name={icon} size={14} color="rgba(255,255,255,0.82)" />
      <Text style={styles.weatherValue}>{value}</Text>
      <Text style={styles.weatherLabel}>{label}</Text>
    </View>
  );
}

function DetailCard({
  title,
  value,
  subtitle,
  colors,
  valueColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  colors: ReturnType<typeof getColors>;
  valueColor: string;
}) {
  return (
    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.detailTitle, { color: colors.subtext }]}>{title}</Text>
      <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.detailSubtitle, { color: colors.subtext }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  heroCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#23C28A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  caption: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  location: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginTop: 2,
  },
  menuPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 10,
  },
  statusText: {
    color: '#0B1018',
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  metaLine: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  weatherRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  weatherChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },
  weatherValue: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: 2,
  },
  weatherLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: fontSize.xs,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  detailTitle: {
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  detailSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  insightCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  insightBody: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  factorsCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  factorsTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  factorItem: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: 4,
  },
  healthCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  healthLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  healthTone: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  healthToneText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  healthBody: {
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: '600',
  },
  modelText: {
    textAlign: 'right',
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
  },
});
