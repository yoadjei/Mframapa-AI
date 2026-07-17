import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getAQIColor } from '../../theme/colors';

interface Props {
  category: string;
  size?: number;
}

export function StatusDot({ category, size = 10 }: Props) {
  return (
    <View
      style={[styles.dot, { backgroundColor: getAQIColor(category), width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel={`AQI status: ${category}`}
    />
  );
}

const styles = StyleSheet.create({
  dot: {},
});
