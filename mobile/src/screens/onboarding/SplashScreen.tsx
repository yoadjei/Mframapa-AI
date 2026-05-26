import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getColors } from '../../theme';
import { MframapaLogo } from '../../components/MframapaLogo';

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const opacity = new Animated.Value(0);
  const scale   = new Animated.Value(0.85);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(onDone, 800);
    });
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <MframapaLogo size="lg" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center' },
});
