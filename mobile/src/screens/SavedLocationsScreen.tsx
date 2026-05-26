import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getColors, Colors } from '../theme';
import { getAQIColor } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import { useStore, SavedLocation } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

export function SavedLocationsScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const savedLocations       = useStore((s) => s.savedLocations);
  const removeSavedLocation  = useStore((s) => s.removeSavedLocation);
  const addSavedLocation     = useStore((s) => s.addSavedLocation);

  const [swipedId, setSwipedId] = useState<string | null>(null);

  function handleDelete(id: string) {
    removeSavedLocation(id);
    setSwipedId(null);
  }

  // Use default data if empty
  const displayLocations: SavedLocation[] = savedLocations.length > 0 ? savedLocations : [
    { id: 'accra', name: 'Accra', country: 'Accra', lat: 5.6, lon: -0.2, lastPm25: 42, lastAqiCategory: 'moderate', lastChecked: '7:59 AM' },
    { id: 'london', name: 'London', country: 'London', lat: 51.5, lon: -0.1, lastPm25: 18, lastAqiCategory: 'good', lastChecked: '12:30 AM' },
    { id: 'lomptam', name: 'Lomptam', country: 'Germany', lat: 52, lon: 13, lastPm25: 18, lastAqiCategory: 'moderate', lastChecked: '12:39 AM' },
  ];

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
          onPress={() => isSwiped ? setSwipedId(null) : setSwipedId(item.id)}
          onLongPress={() => setSwipedId(item.id)}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.rowLeft}>
            <Text style={[styles.cityName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.country, { color: colors.subtext }]}>{item.country}</Text>
            <View style={styles.aqiRow}>
              <View style={[styles.dot, { backgroundColor: getAQIColor(item.lastAqiCategory ?? 'moderate') }]} />
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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.saved_locations.title').toUpperCase()}</Text>
        <TouchableOpacity>
          <Ionicons name="add" size={24} color={Colors.brandGreen} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayLocations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={32} color={colors.subtext} />
            <Ionicons name="cloud-outline" size={32} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Add more locations to monitor more.
            </Text>
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
    gap: 8,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
