import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { getColors, Colors } from '../theme';
import { InputField } from '../components/ui/InputField';
import { useTranslation } from '../hooks/useTranslation';

export function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [confirm, setConfirm] = useState('');
  const { t } = useTranslation();

  const canDelete = confirm === 'DELETE';

  return (
    <View style={[styles.root]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="warning" size={64} color={Colors.danger} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('delete.title')}</Text>
        <Text style={[styles.warning, { color: colors.subtext }]}>
          {t('delete.warning_prefix')}{' '}
          <Text style={{ fontWeight: '800', color: colors.text }}>{t('delete.warning_strong')}</Text>
        </Text>

        <View style={[styles.checklist, { backgroundColor: colors.card, borderRadius: 14, padding: 16 }]}>
          {[
            t('delete.item.erase'),
            t('delete.item.saved_cities'),
            t('delete.item.subscriptions'),
            t('delete.item.api_keys')].map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <Text style={styles.cross}>✕</Text>
              <Text style={[styles.checkText, { color: colors.subtext }]}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.note, { color: colors.muted }]}>
          <Text style={{ fontWeight: '600', color: colors.subtext }}>{t('delete.note_label')}</Text>{' '}
          {t('delete.note_body')}
        </Text>

        <InputField
          value={confirm}
          onChangeText={setConfirm}
          placeholder={t('delete.placeholder')}
          isDark={isDark}
          containerStyle={styles.input}
        />

        <TouchableOpacity
          style={[styles.deleteBtn, { opacity: canDelete ? 1 : 0.5 }]}
          disabled={!canDelete}
        >
          <Text style={styles.deleteBtnText}>{t('delete.confirm_button')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: colors.muted }]}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, alignItems: 'center', gap: 16 },
  iconWrap: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  warning: { fontSize: 16, textAlign: 'center' },
  checklist: { width: '100%', gap: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cross: { fontSize: 16, color: Colors.danger, fontWeight: '700', width: 20, textAlign: 'center' },
  checkText: { fontSize: 15 },
  note: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  input: { width: '100%' },
  deleteBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: 4 },
  cancelText: { fontSize: 15 },
});
