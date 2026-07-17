import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  color?: string;
}

export function PrimaryButton({ label, onPress, loading, disabled, style, color }: Props) {
  const bg = color ?? Colors.brandGreen;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.label}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
