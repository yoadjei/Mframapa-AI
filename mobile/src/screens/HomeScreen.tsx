import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { useStore } from '../store/useStore';
import { getPrediction } from '../services/api';
import { AQICard } from '../components/AQICard';
import { OfflineBanner } from '../components/OfflineBanner';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../hooks/useTranslation';

export function HomeScreen() {
  const isDark = useStore((s) => s.isDark);
  const lastPrediction = useStore((s) => s.lastPrediction);
  const setPrediction = useStore((s) => s.setPrediction);
  const colors = getColors(isDark);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLocate() {
    setError(null);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('error.location'));
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const name =
        geo?.city ??
        geo?.district ??
        geo?.region ??
        `${loc.coords.latitude.toFixed(2)}, ${loc.coords.longitude.toFixed(2)}`;

      const result = await getPrediction(
        loc.coords.latitude,
        loc.coords.longitude,
        name
      );
      setPrediction(result);
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('network') || err?.code === 'ERR_NETWORK') {
        setError(t('error.network'));
      } else {
        setError(t('error.prediction'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: spacing.xl,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }}
      >
        <Text
          style={{
            color: colors.accent,
            fontSize: fontSize.xxl,
            fontWeight: '800',
            letterSpacing: 0.5,
          }}
        >
          {t('home.title')}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: fontSize.sm }}>
          {t('home.subtitle')}
        </Text>
      </View>

      <OfflineBanner />

      {/* Error */}
      {error && (
        <View
          style={{
            backgroundColor: colors.danger + '22',
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginHorizontal: spacing.md,
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: colors.danger,
          }}
        >
          <Text style={{ color: colors.danger, fontSize: fontSize.sm }}>
            {error}
          </Text>
          <TouchableOpacity onPress={handleLocate} style={{ marginTop: spacing.sm }}>
            <Text
              style={{
                color: colors.accent,
                fontSize: fontSize.sm,
                fontWeight: '600',
              }}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Locate Button */}
      <TouchableOpacity
        onPress={handleLocate}
        disabled={loading}
        style={{
          backgroundColor: colors.accent,
          borderRadius: borderRadius.md,
          marginHorizontal: spacing.md,
          marginBottom: spacing.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" style={{ marginRight: spacing.sm }} />
        ) : (
          <Text style={{ fontSize: fontSize.md, marginRight: spacing.xs }}>📍</Text>
        )}
        <Text
          style={{
            color: '#fff',
            fontSize: fontSize.md,
            fontWeight: '700',
          }}
        >
          {loading ? t('home.loading') : t('home.locate')}
        </Text>
      </TouchableOpacity>

      {/* AQI Card or Empty Prompt */}
      {lastPrediction ? (
        <AQICard prediction={lastPrediction} isDark={isDark} />
      ) : (
        !loading && (
          <View
            style={{
              alignItems: 'center',
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.xxl,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🌍</Text>
            <Text
              style={{
                color: colors.subtext,
                fontSize: fontSize.md,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              {t('home.tap_map')}
            </Text>
          </View>
        )
      )}
    </ScrollView>
  );
}
