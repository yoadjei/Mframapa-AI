import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
  isDark?: boolean;
}

export function SectionHeader({ title, action, onAction, style, isDark = true }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, { color: isDark ? Colors.textSecondary : Colors.lightTextSecondary }]}>
        {title.toUpperCase()}
      </Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.action]}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brandGreen,
  },
});
