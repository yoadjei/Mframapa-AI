import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { getColors } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

const OFFLINE_CITIES = [
  { name: 'Accra', selected: true },
  { name: 'Kumasi', selected: false },
  { name: 'Tamale', selected: false },
  { name: 'Cape Coast', selected: false }];

export function OfflineCityPickerScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const crumbs = [
    'screen.offline.breadcrumb_africa',
    'screen.offline.breadcrumb_west',
    'screen.offline.breadcrumb_ghana'] as const;

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="person-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <Ionicons name="airplane-outline" size={56} color={Colors.brandGreen} />
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.offline.title')}</Text>
        <View style={styles.breadcrumb}>
          {crumbs.map((key, i, arr) => (
            <React.Fragment key={key}>
              <Text style={styles.crumb}>{t(key)}</Text>
              {i < arr.length - 1 ? <Text style={[styles.crumb, { color: colors.subtext }]}> › </Text> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <FlatList
        data={OFFLINE_CITIES}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.cityRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={18} color={Colors.brandGreen} />
            <Text style={[styles.cityName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.cityRight, { color: item.selected ? Colors.brandGreen : colors.subtext }]}>
              {item.selected ? t('screen.offline.selected') : '›'}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 80 }}
      />

      <View style={[styles.toast, { bottom: insets.bottom + 16 }]}>
        <Ionicons name="information-circle-outline" size={16} color="#fff" />
        <Text style={styles.toastText}>{t('screen.offline.toast_cached')}</Text>
      </View>
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
    paddingBottom: 8,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 16 },
  center: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  breadcrumb: { flexDirection: 'row', alignItems: 'center' },
  crumb: { fontSize: 14, fontWeight: '500', color: Colors.brandGreen },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cityName: { flex: 1, fontSize: 16, fontWeight: '600' },
  cityRight: { fontSize: 14, fontWeight: '600' },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#C8900A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  toastText: { color: '#fff', fontSize: 13, flex: 1 },
});
