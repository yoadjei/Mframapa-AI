import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { getColors } from '../theme';

interface MframapaLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { icon: 18, text: 15, gap: 6 },
  md: { icon: 24, text: 20, gap: 8 },
  lg: { icon: 32, text: 26, gap: 10 },
};

export function MframapaLogo({ size = 'md' }: MframapaLogoProps) {
  const s = SIZES[size];
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={styles.row}>
      <CloudIcon size={s.icon} color={colors.accent} />
      <View style={[styles.textRow, { gap: s.gap / 2 }]}>
        <Text style={[styles.name, { fontSize: s.text }]}>
          <Text style={[styles.mLetter, { color: colors.accent }]}>M</Text>
          <Text style={[styles.rest, { color: colors.text }]}>framapa</Text>
        </Text>
      </View>
    </View>
  );
}

function CloudIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <Path d="M8 14v7" />
      <Path d="M12 16v7" />
      <Path d="M16 14v7" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mLetter: {
    fontWeight: '800',
  },
  rest: {
    fontWeight: '700',
  },
});


