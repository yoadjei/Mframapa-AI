import React from 'react';
import { View, Text } from 'react-native';
import { AQI_LEVELS } from '../utils/aqi';
import { getColors, fontSize, spacing, borderRadius } from '../theme';
import { useTranslation } from '../hooks/useTranslation';

interface AQIColorBarProps {
  pm25: number;
  isDark: boolean;
  showLabels?: boolean;
}

export function AQIColorBar({ pm25, isDark, showLabels = true }: AQIColorBarProps) {
  const colors = getColors(isDark);
  const { t } = useTranslation();

  const activeLevelIndex = AQI_LEVELS.findIndex((l) => pm25 >= l.min && pm25 <= l.max);
  const activeIndex = activeLevelIndex === -1 ? AQI_LEVELS.length - 1 : activeLevelIndex;

  return (
    <View>
      <View style={{ flexDirection: 'row', height: 8, borderRadius: borderRadius.full, overflow: 'hidden' }}>
        {AQI_LEVELS.map((level, i) => (
          <View
            key={level.category}
            style={{
              flex: 1,
              backgroundColor: level.color,
              opacity: i === activeIndex ? 1 : 0.35,
            }}
          />
        ))}
      </View>

      {showLabels && (
        <View style={{ flexDirection: 'row', marginTop: spacing.xs }}>
          {AQI_LEVELS.map((level, i) => (
            <View key={level.category} style={{ flex: 1, alignItems: 'center' }}>
              {i === activeIndex && (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: level.color,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
        <Text style={{ color: AQI_LEVELS[0].color, fontSize: fontSize.xs }}>{t('aqi.good')}</Text>
        <Text style={{ color: AQI_LEVELS[AQI_LEVELS.length - 1].color, fontSize: fontSize.xs }}>
          {t('aqi.hazardous')}
        </Text>
      </View>
    </View>
  );
}
