import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from '../hooks/useTranslation';
import { spacing, fontSize, borderRadius } from '../theme';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View
      style={{
        backgroundColor: '#78350f',
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FBBF24',
      }}
    >
      <Text style={{ fontSize: fontSize.sm, marginRight: spacing.xs }}>📶</Text>
      <Text
        style={{
          color: '#FBBF24',
          fontSize: fontSize.sm,
          fontWeight: '600',
          flex: 1,
        }}
      >
        {t('offline.cached_data')}
      </Text>
    </View>
  );
}
