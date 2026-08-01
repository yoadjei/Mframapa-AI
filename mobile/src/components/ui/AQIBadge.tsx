import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAQIColor } from '../../theme/colors';

interface Props {
  category: string;
  /** Localized AQI label; falls back to capitalized category string. */
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AQIBadge({ category, label: labelProp, size = 'md' }: Props) {
  const color = getAQIColor(category);
  const label =
    labelProp ?? category.charAt(0).toUpperCase() + category.slice(1);

  const padV = size === 'sm' ? 4 : size === 'xl' ? 10 : size === 'lg' ? 8 : 5;
  const padH = size === 'sm' ? 10 : size === 'xl' ? 18 : size === 'lg' ? 16 : 12;
  const fs   = size === 'sm' ? 13 : size === 'xl' ? 18 : size === 'lg' ? 15 : 14;

  return (
    <View style={[styles.badge, { backgroundColor: color, paddingVertical: padV, paddingHorizontal: padH }]}>
      <Text style={[styles.label, { fontSize: fs }]} accessibilityLabel={`AQI: ${label}`}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
