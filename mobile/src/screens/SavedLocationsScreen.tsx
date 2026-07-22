import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getColors, Colors } from '../theme';
import { getAQIColor } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import { useStore, SavedLocation } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { fetchPredictionAtCoords } from '../services/prediction';

export function SavedLocationsScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const savedLocations       = useStore((s) => s.savedLocations);
  const removeSavedLocation  = useStore((s) => s.removeSavedLocation);
  const updateSavedLocation  = useStore((s) => s.updateSavedLocation);
  const offlineCities        = useStore((s) => s.offlineCities);
  const language             = useStore((s) => s.language);
  const setPrediction        = useStore((s) => s.setPrediction);

  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    removeSavedLocation(id);
    setSwipedId(null);
  }

  function handleAdd() {
    // Search tab is a sibling at the navigator root — React Navigation will
    // resolve the name even from inside the Profile stack.
    navigation.navigate('Search');
  }

  async function handleOpen(loc: SavedLocation) {
    if (loadingId) return;
    setLoadingId(loc.id);
    try {
      const prediction = await fetchPredictionAtCoords(
        loc.lat, loc.lon, loc.name, language, offlineCities,
      );
      setPrediction(prediction);
      updateSavedLocation(loc.id, {
        lastPm25: prediction.pm25,
        lastAqiCategory: prediction.aqi_category,
        lastChecked: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      });
      navigation.navigate('CityDetail', { prediction });
    } catch {
      Alert.alert(t('error.prediction'));
    } finally {
      setLoadingId(null);
    }
  }

  function renderItem({ item }: { item: SavedLocation }) {
    const isSwiped = swipedId === item.id;
    return (
      <View style={styles.rowWrapper}>
        {/* Delete action background */}
        {isSwiped ? (
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteAction}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => (isSwiped ? setSwipedId(null) : handleOpen(item))}
          onLongPress={() => setSwipedId(item.id)}
          disabled={loadingId === item.id}
          style={[
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border },
            loadingId === item.id && { opacity: 0.6 },
          ]}
        >
          <View style={styles.rowLeft}>
            <Text style={[styles.cityName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.country, { color: colors.subtext }]}>{item.country}</Text>
            <View style={styles.aqiRow}>
              <View style={[styles.dot, { backgroundColor: getAQIColor(item.lastAqiCategory ?? 'moderate', isDark) }]} />
              <Text style={[styles.aqiLabel, { color: colors.subtext }]}>{t('common.aqi')}</Text>
            </View>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.pmLabel, { color: colors.subtext }]}>{t('screen.saved_locations.last_pm25')}</Text>
            <Text style={[styles.pmValue, { color: colors.text }]}>
              {item.lastPm25} {t('unit.ug_m3')}
            </Text>
            <Text style={[styles.time, { color: colors.muted }]}>{item.lastChecked}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.saved_locations.title').toUpperCase()}</Text>
        <TouchableOpacity onPress={handleAdd} accessibilityLabel={t('screen.saved_locations.add')}>
          <Ionicons name="add" size={24} color={Colors.brandGreen} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={savedLocations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={36} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {t('screen.saved_locations.nothing_saved_yet')}
            </Text>
            <TouchableOpacity onPress={handleAdd} style={[styles.emptyCta, { backgroundColor: Colors.brandGreen + '22' }]}>
              <Ionicons name="add" size={16} color={Colors.brandGreen} />
              <Text style={[styles.emptyCtaText, { color: Colors.brandGreen }]}>
                {t('screen.saved_locations.add')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  rowWrapper: { position: 'relative', marginBottom: 10 },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.danger,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 4,
    zIndex: 0,
  },
  deleteText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  rowLeft: { gap: 4 },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  cityName: { fontSize: 18, fontWeight: '700' },
  country: { fontSize: 12 },
  aqiRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  aqiLabel: { fontSize: 11, fontWeight: '600' },
  pmLabel: { fontSize: 11 },
  pmValue: { fontSize: 14, fontWeight: '700' },
  time: { fontSize: 11 },
  emptyCard: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  emptyCtaText: { fontSize: 14, fontWeight: '600' },
});
