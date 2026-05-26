import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Shadow } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  isDark?: boolean;
  noPad?: boolean;
}

export function Card({ children, style, isDark = true, noPad }: Props) {
  const bg = isDark ? Colors.bgCard : '#FFFFFF';
  return (
    <View style={[styles.card, Shadow.card, { backgroundColor: bg }, !noPad && styles.pad, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
  pad: {
    padding: 16,
  },
});
