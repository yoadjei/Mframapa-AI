import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useStore, City } from '../store/useStore';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../hooks/useTranslation';

interface CityPickerProps {
  onSelect: (city: City) => void;
  isDark: boolean;
  placeholder?: string;
}

export function CityPicker({ onSelect, isDark, placeholder = 'Search city...' }: CityPickerProps) {
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const offlineCities = useStore((s) => s.offlineCities);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return offlineCities.slice(0, 30);
    const q = query.toLowerCase();
    return offlineCities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [query, offlineCities]);

  function handleSelect(city: City) {
    setVisible(false);
    setQuery('');
    onSelect(city);
  }

  const displayPlaceholder = placeholder === 'Search city...' ? t('search.city_placeholder') : placeholder;

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
        }}
      >
        <Text style={{ fontSize: fontSize.md, marginRight: spacing.sm }}>🌍</Text>
        <Text style={{ color: colors.subtext, fontSize: fontSize.md, flex: 1 }}>
          {displayPlaceholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={{ flex: 1}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={t('city_picker.search_city_country')}
              placeholderTextColor={colors.subtext}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: fontSize.md,
                backgroundColor: colors.inputBackground,
                borderRadius: borderRadius.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <TouchableOpacity onPress={() => setVisible(false)} style={{ marginLeft: spacing.sm }}>
              <Text style={{ color: colors.subtext, fontSize: fontSize.md }}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => `${item.lat},${item.lon}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: fontSize.lg, marginRight: spacing.sm }}>
                  {item.urban ? '🏙️' : '🌿'}
                </Text>
                <View>
                  <Text style={{ color: colors.text, fontSize: fontSize.md, fontWeight: '600' }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: fontSize.sm }}>
                    {item.country}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>
    </>
  );
}
