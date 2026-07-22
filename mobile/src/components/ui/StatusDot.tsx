import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { getAQIColor, aqiSymbol } from '../../theme/colors';

interface Props {
  category: string;
  size?: number;
  isDark?: boolean;
}

/**
 * Severity indicator. Colour alone cannot carry meaning — roughly one in twelve
 * men has some colour vision deficiency — so the band is drawn as a shape in the
 * category colour, and labelled for screen readers.
 */
export function StatusDot({ category, size = 12, isDark = true }: Props) {
  return (
    <Text
      style={[styles.symbol, { color: getAQIColor(category, isDark), fontSize: size }]}
      accessibilityLabel={category}
      allowFontScaling
    >
      {aqiSymbol(category)}
    </Text>
  );
}

const styles = StyleSheet.create({
  symbol: {},
});
