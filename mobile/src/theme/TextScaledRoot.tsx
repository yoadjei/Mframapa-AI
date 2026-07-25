/**
 * App-wide text size — mirrors PWA root `font-size: N%` by scaling the
 * whole UI tree (layout compensated so tabs stay full-bleed).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  scale: number;
  children: React.ReactNode;
};

export function TextScaledRoot({ scale, children }: Props) {
  if (!Number.isFinite(scale) || Math.abs(scale - 1) < 0.01) {
    return <>{children}</>;
  }
  const inv = 100 / scale;
  return (
    <View style={styles.clip}>
      <View
        style={{
          width: `${inv}%`,
          height: `${inv}%`,
          transform: [{ scale }],
          transformOrigin: 'left top',
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: 'hidden' },
});
