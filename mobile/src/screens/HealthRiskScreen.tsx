import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AQIBadge } from '../components/ui/AQIBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { aqiCategoryKey } from '../utils/i18nHelpers';
import { deriveHealthRisks } from '../utils/deriveHealthRisks';
import { PredictionResult } from '../store/useStore';

export function HealthRiskScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  const raw = route.params?.prediction?.prediction ?? route.params?.prediction ?? null;
  const prediction = (raw as PredictionResult | null) ?? null;
  const risks = deriveHealthRisks(prediction);
  const cityName = prediction?.location?.name?.split(',')[0]?.trim() ?? '';

  if (!prediction || !risks) {
    return (
      <View style={[styles.root, styles.emptyRoot, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('screen.health_risk.title').toUpperCase()}
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            {t('screen.health_risk.open_city_first')}
          </Text>
          <PrimaryButton label={t('common.back')} onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('screen.health_risk.title').toUpperCase()}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {cityName ? (
        <Text style={[styles.cityName, { color: colors.subtext }]}>{cityName}</Text>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {risks.map((risk) => (
          <View
            key={risk.nameKey}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.riskName, { color: colors.text }]}>{t(risk.nameKey)}</Text>
              <AQIBadge
                category={risk.category}
                label={t(aqiCategoryKey(risk.category))}
                size="sm"
              />
            </View>
            <Text style={[styles.riskDesc, { color: colors.subtext }]}>{t(risk.descKey)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyRoot: { flex: 1 },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyText: { fontSize: 15, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  cityName: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  content: { padding: 16, gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskName: { fontSize: 16, fontWeight: '700' },
  riskDesc: { fontSize: 14, lineHeight: 20 },
});
