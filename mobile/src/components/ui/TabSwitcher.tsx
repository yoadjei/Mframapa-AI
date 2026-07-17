import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface Props {
  tabs: string[];
  selected: string;
  onSelect: (tab: string) => void;
  style?: ViewStyle;
  isDark?: boolean;
  scrollable?: boolean;
}

export function TabSwitcher({ tabs, selected, onSelect, style, isDark = true, scrollable }: Props) {
  const inactiveText = isDark ? Colors.textMuted : '#8BA99A';
  const Wrapper = scrollable ? ScrollView : View;
  const wrapperProps = scrollable ? { horizontal: true, showsHorizontalScrollIndicator: false } : {};

  return (
    <Wrapper {...(wrapperProps as any)} style={[styles.container, style]}>
      {tabs.map((tab) => {
        const active = tab === selected;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onSelect(tab)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.tab}
          >
            <Text style={[styles.label, { color: active ? Colors.brandGreen : inactiveText }]}>
              {tab}
            </Text>
            {active ? <View style={styles.underline} /> : null}
          </TouchableOpacity>
        );
      })}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3328',
  },
  tab: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: Colors.brandGreen,
    borderRadius: 1,
  },
});
