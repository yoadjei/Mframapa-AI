import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface Props {
  options: string[];
  selected?: string;
  selectedIndex?: number;
  onSelect?: (opt: string) => void;
  onSelectIndex?: (index: number) => void;
  style?: ViewStyle;
  isDark?: boolean;
}

export function SegmentedControl({ options, selected, selectedIndex, onSelect, onSelectIndex, style, isDark = true }: Props) {
  const bg      = isDark ? Colors.bgCard : '#E8F0EB';
  const activeBg = Colors.brandGreen;
  const inactiveText = isDark ? Colors.textSecondary : Colors.lightTextSecondary;

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {options.map((opt, i) => {
        const active = selectedIndex !== undefined ? i === selectedIndex : opt === selected;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => {
              onSelectIndex?.(i);
              onSelect?.(opt);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.option, active && { backgroundColor: activeBg }]}
          >
            <Text style={[styles.label, { color: active ? '#fff' : inactiveText }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    alignSelf: 'flex-start',
  },
  option: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
