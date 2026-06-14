import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AQIBadge } from '../components/ui/AQIBadge';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { aqiCategoryKey } from '../utils/i18nHelpers';

const RISK_KEYS = [
  {
    nameKey: 'screen.health_risk.asthma_name',
    descKey: 'screen.health_risk.asthma_desc',
    category: 'good',
  },
  {
    nameKey: 'screen.health_risk.dust_name',
    descKey: 'screen.health_risk.dust_desc',
    category: 'moderate',
  },
  {
    nameKey: 'screen.health_risk.heat_name',
    descKey: 'screen.health_risk.heat_desc',
    category: 'good',
  },
  {
    nameKey: 'screen.health_risk.uv_name',
    descKey: 'screen.health_risk.uv_desc',
    category: 'high',
  }] as const;

export function HealthRiskScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

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

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {RISK_KEYS.map((risk) => (
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
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
