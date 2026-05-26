import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from '../components/charts/LineChart';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

const CITY_A_DATA = [40, 75, 55, 130, 90, 80, 75];
const CITY_B_DATA = [80, 85, 80, 100, 120, 150, 200];

export function CompareCitiesScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [cityA, setCityA] = useState('Accra');
  const [cityB, setCityB] = useState('Lagos');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.compare.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {[
          { label: cityA, setter: setCityA },
          { label: cityB, setter: setCityB },
        ].map((c, i) => (
          <View key={i} style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.pickerText, { color: colors.text }]}>{c.label}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.subtext} />
          </View>
        ))}

        <View style={styles.legendRow}>
          <Text style={[styles.pm25Label, { color: colors.text }]}>{t('card.pm25')}</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.brandGreen }]} />
              <Text style={[styles.legendText, { color: Colors.brandGreen }]}>{cityA}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={[styles.legendText, { color: '#2196F3' }]}>{cityB}</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartWrap}>
          <LineChart
            data={CITY_A_DATA}
            secondaryData={CITY_B_DATA}
            secondaryColor="#2196F3"
            labels={['0d', '6', '16', '24', '30']}
            isDark={isDark}
            height={180}
          />
        </View>

        <View style={[styles.compBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.compSide}>
            <Text style={[styles.compCity, { color: Colors.brandGreen }]}>{cityA}</Text>
            <Text style={[styles.compValue, { color: Colors.brandGreen }]}>{t('screen.compare.avg_accra')}</Text>
          </View>
          <View style={[styles.vsPill, { backgroundColor: colors.surface }]}>
            <Text style={[styles.vsText, { color: colors.subtext }]}>{t('screen.compare.vs')}</Text>
          </View>
          <View style={styles.compSide}>
            <Text style={[styles.compCity, { color: '#2196F3' }]}>{cityB}</Text>
            <Text style={[styles.compValue, { color: '#2196F3' }]}>{t('screen.compare.avg_lagos')}</Text>
          </View>
        </View>
      </ScrollView>
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
  title: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 16, gap: 14 },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerText: { fontSize: 16, fontWeight: '600' },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pm25Label: { fontSize: 15, fontWeight: '700' },
  legendItems: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 13, fontWeight: '600' },
  chartWrap: { alignItems: 'center' },
  compBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  compSide: { gap: 4, alignItems: 'center' },
  compCity: { fontSize: 15, fontWeight: '700' },
  compValue: { fontSize: 13 },
  vsPill: { borderRadius: 999, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  vsText: { fontSize: 13, fontWeight: '600' },
});
