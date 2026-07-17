import React from 'react';
import { View, Text } from 'react-native';
import { getAQIColorFromCategory } from '../utils/aqi';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../hooks/useTranslation';
import { healthAdviceKey } from '../utils/i18nHelpers';

interface HealthAdviceProps {
  category: string;
  isDark: boolean;
}

const ICONS: Record<string, string> = {
  good: '😊',
  moderate: '😐',
  sensitive: '😷',
  unhealthy: '🤢',
  'very unhealthy': '☠️',
  hazardous: '💀',
};

function getIcon(category: string): string {
  const lower = category.toLowerCase();
  for (const [key, icon] of Object.entries(ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '😐';
}

export function HealthAdvice({ category, isDark }: HealthAdviceProps) {
  const { t } = useTranslation();
  const colors = getColors(isDark);
  const color = getAQIColorFromCategory(category);
  const advice = t(healthAdviceKey(category));
  const icon = getIcon(category);

  return (
    <View
      style={{
        backgroundColor: color + '18',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: color,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <Text style={{ fontSize: fontSize.xl, marginRight: spacing.sm }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color, fontSize: fontSize.sm, fontWeight: '700', marginBottom: 2 }}>
          {t('card.health_guidance')}
        </Text>
        <Text style={{ color: colors.text, fontSize: fontSize.sm, lineHeight: 18 }}>{advice}</Text>
      </View>
    </View>
  );
}
