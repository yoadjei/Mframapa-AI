import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';

export function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.root]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <View style={[styles.iconWrap, { backgroundColor: Colors.brandGreen + '22' }]}>
          <Ionicons name="lock-open-outline" size={40} color={Colors.brandGreen} />
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>{t('screen.auth.reset_heading')}</Text>
        <Text style={[styles.sub, { color: colors.subtext }]}>{t('screen.auth.reset_sub')}</Text>

        {sent ? (
          <View style={[styles.sentBox, { backgroundColor: Colors.brandGreen + '18', borderColor: Colors.brandGreen + '44' }]}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.brandGreen} />
            <Text style={[styles.sentText, { color: Colors.brandGreen }]}>{t('screen.auth.reset_sent')}</Text>
          </View>
        ) : (
          <>
            <InputField
              label={t('screen.auth.email')}
              icon="mail-outline"
              placeholder={t('screen.auth.placeholder_email')}
              value={email}
              onChangeText={setEmail}
              isDark={isDark}
              containerStyle={styles.field}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PrimaryButton label={t('screen.auth.send_reset_btn')} onPress={handleSend} loading={loading} style={styles.cta} />
          </>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLinkWrap}>
          <Text style={[styles.backLink, { color: colors.subtext }]}>{t('screen.auth.back_login')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 },
  backText: { fontSize: 16 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 24,
  },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 15, marginBottom: 28 },
  field: { marginBottom: 16 },
  cta: { marginTop: 8 },
  sentBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16,
  },
  sentText: { fontSize: 14, fontWeight: '500', flex: 1 },
  backLinkWrap: { alignSelf: 'center', marginTop: 24 },
  backLink: { fontSize: 14 },
});
