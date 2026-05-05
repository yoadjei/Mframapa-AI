import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../utils/constants';

interface LanguagePickerProps {
  current: string;
  onSelect: (code: LanguageCode) => void;
  isDark: boolean;
}

export function LanguagePicker({ current, onSelect, isDark }: LanguagePickerProps) {
  const colors = getColors(isDark);
  const [visible, setVisible] = useState(false);

  const currentLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === current)?.name ?? current.toUpperCase();

  function handleSelect(code: LanguageCode) {
    setVisible(false);
    onSelect(code);
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          backgroundColor: colors.inputBackground,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.lg, marginRight: spacing.sm }}>🌐</Text>
          <Text style={{ color: colors.text, fontSize: fontSize.md }}>{currentLabel}</Text>
        </View>
        <Text style={{ color: colors.subtext }}>›</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              padding: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: fontSize.xl, fontWeight: '700' }}>
              Language
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={{ color: colors.subtext, fontSize: fontSize.md }}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={SUPPORTED_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item.code as LanguageCode)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: colors.text, fontSize: fontSize.md }}>{item.name}</Text>
                {item.code === current && (
                  <Text style={{ color: colors.accent, fontSize: fontSize.md }}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}
