import React from 'react';
import { View, Text } from 'react-native';
import { PredictionResult } from '../store/useStore';
import { getColors, getAQIColor, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../hooks/useTranslation';

interface AQICardProps {
  prediction: PredictionResult;
  isDark: boolean;
}

export function AQICard({ prediction, isDark }: AQICardProps) {
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const aqiColor = getAQIColor(prediction.aqi_category);

  const pm25Display = prediction.pm25.toFixed(1);
  const lowerDisplay = prediction.uncertainty.pm25_lower.toFixed(1);
  const upperDisplay = prediction.uncertainty.pm25_upper.toFixed(1);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.4 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Location */}
      <Text
        style={{
          color: colors.text,
          fontSize: fontSize.xl,
          fontWeight: '700',
          marginBottom: spacing.xs,
        }}
        numberOfLines={1}
      >
        {prediction.location.name}
      </Text>
      <Text
        style={{
          color: colors.subtext,
          fontSize: fontSize.sm,
          marginBottom: spacing.lg,
        }}
      >
        {prediction.location.lat.toFixed(4)}, {prediction.location.lon.toFixed(4)}
      </Text>

      {/* PM2.5 Circle + Category */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: aqiColor + '22',
            borderWidth: 3,
            borderColor: aqiColor,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <Text
            style={{
              color: aqiColor,
              fontSize: fontSize.xl,
              fontWeight: '800',
            }}
          >
            {pm25Display}
          </Text>
          <Text style={{ color: aqiColor, fontSize: fontSize.xs }}>µg/m³</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: aqiColor + '22',
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              alignSelf: 'flex-start',
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{
                color: aqiColor,
                fontSize: fontSize.sm,
                fontWeight: '700',
              }}
            >
              {prediction.aqi_category}
            </Text>
          </View>
          <Text style={{ color: colors.subtext, fontSize: fontSize.xs }}>
            Range: {lowerDisplay}–{upperDisplay} µg/m³
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: colors.border,
          marginVertical: spacing.sm,
        }}
      />

      {/* Weather Row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <WeatherItem
          icon="🌡"
          label={t('weather.temp')}
          value={`${prediction.weather.temp.toFixed(1)}°C`}
          colors={colors}
        />
        <WeatherItem
          icon="💧"
          label={t('weather.humidity')}
          value={`${prediction.weather.humidity.toFixed(0)}%`}
          colors={colors}
        />
        <WeatherItem
          icon="💨"
          label={t('weather.wind')}
          value={`${prediction.weather.wind.toFixed(1)} m/s`}
          colors={colors}
        />
      </View>

      {/* Model badge */}
      {prediction.model && (
        <Text
          style={{
            color: colors.subtext,
            fontSize: fontSize.xs,
            marginTop: spacing.sm,
            textAlign: 'right',
          }}
        >
          Model: {prediction.model}
        </Text>
      )}
    </View>
  );
}

interface WeatherItemProps {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof getColors>;
}

function WeatherItem({ icon, label, value, colors }: WeatherItemProps) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: fontSize.lg }}>{icon}</Text>
      <Text style={{ color: colors.text, fontSize: fontSize.md, fontWeight: '600' }}>
        {value}
      </Text>
      <Text style={{ color: colors.subtext, fontSize: fontSize.xs }}>{label}</Text>
    </View>
  );
}
