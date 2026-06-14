import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { getColors, spacing, fontSize } from '../theme';

interface LoadingSpinnerProps {
  isDark: boolean;
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingSpinner({
  isDark,
  message,
  size = 'large',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const colors = getColors(isDark);

  const inner = (
    <View style={{ alignItems: 'center' }}>
      <ActivityIndicator size={size} color={colors.accent} />
      {message && (
        <Text
          style={{
            color: colors.subtext,
            fontSize: fontSize.sm,
            marginTop: spacing.sm,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (!fullScreen) return inner;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(10,13,18,0.72)' : 'rgba(232,236,242,0.82)',
      }}
    >
      {inner}
    </View>
  );
}
