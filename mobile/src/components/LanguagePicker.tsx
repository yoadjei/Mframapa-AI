import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { SUPPORTED_LANGUAGES, languagesByCountry } from '../utils/constants';
import { getColors, spacing, fontSize } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

export function LanguagePicker() {
  const { isDark } = useTheme();
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const selected =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];
  const sections = languagesByCountry();
  const selectedLabel = t(`lang.${selected.code}`) || selected.name;

  return (
    <View>
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        style={[styles.selector, { borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={[styles.label, { color: colors.text }]}>{selectedLabel}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.subtext}
        />
      </TouchableOpacity>

      {expanded ? (
        <View style={[styles.list, { borderColor: colors.border }]}>
          {sections.map((section) => (
            <View key={section.countryKey}>
              <Text style={[styles.country, { color: colors.muted }]}>
                {t(section.countryKey) || section.country}
              </Text>
              {section.languages.map((lang, index) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    setLanguage(lang.code);
                    setExpanded(false);
                  }}
                  style={[
                    styles.option,
                    index < section.languages.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {t(`lang.${lang.code}`) || lang.name}
                  </Text>
                  {language === lang.code ? (
                    <Ionicons name="checkmark" size={20} color={colors.accent} />
                  ) : (
                    <View style={{ width: 20 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: spacing.md,
  },
  flag: {
    fontSize: 22,
  },
  label: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  list: {
    borderWidth: 0.5,
    borderRadius: 12,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  country: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    paddingTop: 12,
    paddingBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
