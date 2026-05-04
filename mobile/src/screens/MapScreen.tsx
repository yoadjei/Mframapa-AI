import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useStore, PredictionResult } from '../store/useStore';
import { getColors, getAQIColor, spacing, borderRadius, fontSize } from '../theme';

export function MapScreen() {
  const isDark = useStore((s) => s.isDark);
  const predictionHistory = useStore((s) => s.predictionHistory);
  const colors = getColors(isDark);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            color: colors.text,
            fontSize: fontSize.xl,
            fontWeight: '700',
          }}
        >
          Map
        </Text>
      </View>

      {/* Mapbox Placeholder Card */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          marginHorizontal: spacing.md,
          marginBottom: spacing.md,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: 'dashed',
        }}
      >
        <View
          style={{
            backgroundColor: colors.accent + '22',
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>🗺️</Text>
          <Text
            style={{
              color: colors.accent,
              fontSize: fontSize.md,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: spacing.xs,
            }}
          >
            Map View — Coming Soon
          </Text>
        </View>

        <Text
          style={{
            color: colors.subtext,
            fontSize: fontSize.sm,
            lineHeight: 20,
            marginBottom: spacing.sm,
          }}
        >
          Map view requires a Mapbox token. Set{' '}
          <Text
            style={{
              color: colors.accent,
              fontFamily: 'monospace',
              fontWeight: '600',
            }}
          >
            EXPO_PUBLIC_MAPBOX_TOKEN
          </Text>{' '}
          in your{' '}
          <Text style={{ color: colors.accent, fontFamily: 'monospace', fontWeight: '600' }}>
            .env
          </Text>{' '}
          file and install{' '}
          <Text style={{ color: colors.accent, fontFamily: 'monospace', fontWeight: '600' }}>
            @rnmapbox/maps
          </Text>{' '}
          to enable the interactive air quality map.
        </Text>

        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: borderRadius.sm,
            padding: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.subtext,
              fontSize: fontSize.xs,
              fontFamily: 'monospace',
            }}
          >
            EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91...
          </Text>
        </View>
      </View>

      {/* Recent Predictions */}
      <Text
        style={{
          color: colors.subtext,
          fontSize: fontSize.sm,
          fontWeight: '600',
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        Recent Predictions
      </Text>

      {predictionHistory.length === 0 ? (
        <View
          style={{
            alignItems: 'center',
            paddingVertical: spacing.xxl,
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>📍</Text>
          <Text
            style={{
              color: colors.subtext,
              fontSize: fontSize.sm,
              textAlign: 'center',
            }}
          >
            No predictions yet. Use your location or search for a city.
          </Text>
        </View>
      ) : (
        <FlatList
          data={predictionHistory}
          keyExtractor={(item, index) =>
            `${item.location.lat}-${item.location.lon}-${index}`
          }
          renderItem={({ item }) => (
            <RecentPredictionRow prediction={item} isDark={isDark} />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

interface RecentPredictionRowProps {
  prediction: PredictionResult;
  isDark: boolean;
}

function RecentPredictionRow({ prediction, isDark }: RecentPredictionRowProps) {
  const colors = getColors(isDark);
  const aqiColor = getAQIColor(prediction.aqi_category);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: aqiColor + '22',
          borderWidth: 2,
          borderColor: aqiColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Text style={{ color: aqiColor, fontSize: fontSize.sm, fontWeight: '700' }}>
          {prediction.pm25.toFixed(0)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: colors.text, fontSize: fontSize.md, fontWeight: '600' }}
          numberOfLines={1}
        >
          {prediction.location.name}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: fontSize.xs }}>
          {prediction.aqi_category}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: aqiColor + '22',
          borderRadius: borderRadius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        }}
      >
        <Text style={{ color: aqiColor, fontSize: fontSize.xs, fontWeight: '700' }}>
          {prediction.pm25.toFixed(1)} µg/m³
        </Text>
      </View>
    </View>
  );
}
