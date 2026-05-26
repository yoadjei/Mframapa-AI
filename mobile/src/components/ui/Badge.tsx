import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

type Variant = 'verified' | 'pending' | 'free' | 'pro' | 'enterprise' | 'custom';

interface Props {
  label: string;
  variant?: Variant;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<Variant, { bg: string; text: string }> = {
  verified:   { bg: Colors.brandGreen,   text: '#fff' },
  pending:    { bg: '#C8900A',            text: '#fff' },
  free:       { bg: '#2A3E34',            text: Colors.textSecondary },
  pro:        { bg: Colors.brandGreen,   text: '#fff' },
  enterprise: { bg: Colors.enterprise,   text: '#fff' },
  custom:     { bg: Colors.bgCard,        text: Colors.textPrimary },
};

export function Badge({ label, variant = 'custom', color, textColor, style }: Props) {
  const { bg, text } = VARIANT_COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: color ?? bg }, style]}>
      <Text style={[styles.label, { color: textColor ?? text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
