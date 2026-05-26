import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { getColors, Colors } from '../theme';
import { SUPPORTED_LANGUAGES } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';
import { clearLocaleCache } from '../services/translation';

export function LanguageSelectorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const language    = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const languageSections = [
    {
      title: t('language.supported'),
      data: SUPPORTED_LANGUAGES.map((item) => ({
        code: item.code,
        label: item.name,
        flag: item.flag,
      })),
    },
  ];

  const filtered = languageSections.map((sec) => ({
    ...sec,
    data: sec.data.filter((l) => !search || l.label.toLowerCase().includes(search.toLowerCase())),
  })).filter((sec) => sec.data.length > 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{t('language.title')}</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search-outline" size={16} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search')}
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <SectionList
        sections={filtered}
        keyExtractor={(item) => item.code}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionLabel, { color: colors.text, backgroundColor: colors.background }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={async () => {
              await clearLocaleCache(item.code);
              setLanguage(item.code);
              navigation.goBack();
            }}
            style={[styles.langRow, { borderBottomColor: colors.border }]}
          >
            <Text style={styles.flag}>{item.flag}</Text>
            <Text style={[styles.langLabel, { color: colors.text }]}>{item.label}</Text>
            {language === item.code ? (
              <Ionicons name="checkmark" size={18} color={Colors.brandGreen} style={{ marginLeft: 'auto' }} />
            ) : null}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleBlock: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flag: { fontSize: 20 },
  langLabel: { fontSize: 15 },
});
