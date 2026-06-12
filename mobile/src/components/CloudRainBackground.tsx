import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { AppBackgroundColors } from '../theme/background';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_VARIANTS: IoniconName[] = [
  'rainy',
  'rainy-outline',
  'cloud',
  'cloud-outline',
  'cloudy',
  'cloudy-outline',
  'thunderstorm-outline',
];

/** Spacing between icon anchors — larger = fewer icons. */
const CELL = 88;

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type PlacedIcon = {
  key: string;
  name: IoniconName;
  left: number;
  top: number;
  size: number;
  opacity: number;
  rotate: string;
};

function buildCluster(width: number, height: number, isDark: boolean): PlacedIcon[] {
  const cols = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(height / CELL) + 2;
  const items: PlacedIcon[] = [];
  let seed = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const slot = hash(row * 113 + col * 17);
      if (slot < 0.42) continue;

      const h0 = hash(seed++);
      const h1 = hash(seed++);
      const h2 = hash(seed++);
      const h3 = hash(seed++);
      const h4 = hash(seed++);
      const left = col * CELL + (h0 - 0.5) * CELL * 0.55;
      const top = row * CELL + (h1 - 0.5) * CELL * 0.55;
      const size = 34 + Math.floor(h2 * 18);
      const opacity = isDark ? 0.14 + h3 * 0.06 : 0.12 + h3 * 0.06;

      items.push({
        key: `${row}-${col}`,
        name: ICON_VARIANTS[Math.floor(h4 * ICON_VARIANTS.length)],
        left,
        top,
        size,
        opacity,
        rotate: `${Math.floor(h2 * 360)}deg`,
      });
    }
  }

  return items;
}

type Props = {
  style?: ViewStyle;
};

export function CloudRainBackground({ style }: Props) {
  const { isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const icons = useMemo(
    () => buildCluster(width, height, isDark),
    [width, height, isDark],
  );

  const base = isDark ? AppBackgroundColors.dark : AppBackgroundColors.light;
  const iconColor = isDark ? AppBackgroundColors.iconDark : AppBackgroundColors.iconLight;

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: base }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {icons.map((icon) => (
        <View
          key={icon.key}
          style={[
            styles.iconWrap,
            {
              left: icon.left,
              top: icon.top,
              opacity: icon.opacity,
              transform: [{ rotate: icon.rotate }],
            }]}
        >
          <Ionicons name={icon.name} size={icon.size} color={iconColor} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    position: 'absolute',
  },
});
