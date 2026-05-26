import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
  size?: number;
}

export function TextLinkButton({ label, onPress, color, style, size = 14 }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={style} accessibilityRole="button">
      <Text style={[styles.label, { color: color ?? Colors.brandGreen, fontSize: size }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '500', textAlign: 'center' },
});
