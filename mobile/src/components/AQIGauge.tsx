import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';
import { getAQIColorFromCategory, pm25ToAQI } from '../utils/aqi';
import { getColors, fontSize, spacing } from '../theme';
import { useTranslation } from '../hooks/useTranslation';

interface AQIGaugeProps {
  pm25: number;
  category: string;
  isDark: boolean;
  size?: number;
}

export function AQIGauge({ pm25, category, isDark, size = 140 }: AQIGaugeProps) {
  const colors = getColors(isDark);
  const aqiColor = getAQIColorFromCategory(category);
  const aqi = pm25ToAQI(pm25);
  const { t } = useTranslation();

  const radius = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const progress = Math.min(aqi / 500, 1);
  const currentArc = startAngle + totalArc * progress;

  function polarToCart(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const start = polarToCart(startAngle, radius);
  const end = polarToCart(currentArc, radius);
  const largeArc = totalArc * progress > 180 ? 1 : 0;

  const trackEnd = polarToCart(endAngle, radius);
  const trackLarge = totalArc > 180 ? 1 : 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${trackLarge} 1 ${trackEnd.x} ${trackEnd.y}`}
          stroke={colors.border}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        {progress > 0 && (
          <Path
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            stroke={aqiColor}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={4} fill={aqiColor} />
      </Svg>

      <View style={{ position: 'absolute', top: size * 0.35, alignItems: 'center' }}>
        <Text style={{ color: aqiColor, fontSize: fontSize.xxxl, fontWeight: '800' }}>
          {aqi}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: fontSize.xs, marginTop: -4 }}>
          {t('common.aqi')}
        </Text>
      </View>

      <Text
        style={{
          color: aqiColor,
          fontSize: fontSize.sm,
          fontWeight: '700',
          marginTop: -spacing.md,
          textAlign: 'center',
        }}
      >
        {category}
      </Text>
    </View>
  );
}
