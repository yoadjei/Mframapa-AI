import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useStore, City } from '../store/useStore';
import { getPrediction } from '../services/api';
import { OfflineBanner } from '../components/OfflineBanner';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../hooks/useTranslation';

interface SearchScreenProps {
  onNavigateHome?: () => void;
}

export function SearchScreen({ onNavigateHome }: SearchScreenProps) {
  const isDark = useStore((s) => s.isDark);
  const offlineCities = useStore((s) => s.offlineCities);
  const setPrediction = useStore((s) => s.setPrediction);
  const colors = getColors(isDark);
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCity, setLoadingCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return offlineCities.slice(0, 50);
    const q = query.toLowerCase();
    return offlineCities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
      )
      .slice(0, 100);
  }, [query, offlineCities]);

  async function handleSelectCity(city: City) {
    setError(null);
    setLoadingCity(city.name);
    setLoading(true);
    try {
      const result = await getPrediction(city.lat, city.lon, city.name);
      setPrediction(result);
      onNavigateHome?.();
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('network') || err?.code === 'ERR_NETWORK') {
        setError(t('error.network'));
      } else {
        setError(t('error.prediction'));
      }
    } finally {
      setLoading(false);
      setLoadingCity(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: spacing.xl,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: fontSize.xl,
            fontWeight: '700',
            marginBottom: spacing.md,
          }}
        >
          Search
        </Text>

        {/* Search Input */}
        <View
          style={{
            backgroundColor: colors.inputBackground,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
          }}
        >
          <Text style={{ fontSize: fontSize.md, marginRight: spacing.sm }}>🔍</Text>
          <TextInput
            style={{
              flex: 1,
              color: colors.text,
              fontSize: fontSize.md,
              paddingVertical: spacing.md,
            }}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.subtext}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {loading && (
            <ActivityIndicator color={colors.accent} size="small" />
          )}
        </View>
      </View>

      <OfflineBanner />

      {/* Error */}
      {error && (
        <View
          style={{
            backgroundColor: colors.danger + '22',
            borderRadius: borderRadius.sm,
            padding: spacing.sm,
            marginHorizontal: spacing.md,
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: colors.danger,
          }}
        >
          <Text style={{ color: colors.danger, fontSize: fontSize.sm }}>{error}</Text>
        </View>
      )}

      {/* Results count */}
      {offlineCities.length > 0 && (
        <Text
          style={{
            color: colors.subtext,
            fontSize: fontSize.xs,
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xs,
          }}
        >
          {query.trim()
            ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
            : `${results.length} cities shown (${offlineCities.length} total)`}
        </Text>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <View
          style={{
            alignItems: 'center',
            paddingVertical: spacing.xxl,
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>🔭</Text>
          <Text
            style={{
              color: colors.subtext,
              fontSize: fontSize.sm,
              textAlign: 'center',
            }}
          >
            {offlineCities.length === 0
              ? 'City database loading...'
              : t('search.no_results')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
          renderItem={({ item }) => (
            <CityRow
              city={item}
              isDark={isDark}
              isLoading={loadingCity === item.name}
              onPress={() => handleSelectCity(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

interface CityRowProps {
  city: City;
  isDark: boolean;
  isLoading: boolean;
  onPress: () => void;
}

function CityRow({ city, isDark, isLoading, onPress }: CityRowProps) {
  const colors = getColors(isDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      <Text style={{ fontSize: fontSize.lg, marginRight: spacing.md }}>🏙️</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSize.md,
            fontWeight: '600',
          }}
          numberOfLines={1}
        >
          {city.name}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: fontSize.xs }}>
          {city.country}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <View
          style={{
            backgroundColor: city.urban
              ? colors.accent + '22'
              : colors.subtext + '22',
            borderRadius: borderRadius.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              color: city.urban ? colors.accent : colors.subtext,
              fontSize: fontSize.xs,
              fontWeight: '600',
            }}
          >
            {city.urban ? 'Urban' : 'Rural'}
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Text style={{ color: colors.subtext, fontSize: fontSize.sm }}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
