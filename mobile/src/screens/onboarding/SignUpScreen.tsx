import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { MframapaLogo } from '../../components/MframapaLogo';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  onAuth: () => void;
}

export function SignUpScreen({ onAuth }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const signUp = useStore((s) => s.signUp);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert(t('screen.auth.error_required'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('screen.auth.error_password_match'));
      return;
    }
    setLoading(true);
    const res = await signUp(fullName, email, password);
    setLoading(false);
    if (!res.ok) {
      Alert.alert(res.error ?? t('screen.auth.error_sign_up'));
      return;
    }
    onAuth();
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

        <View style={styles.logoWrap}>
          <MframapaLogo size="lg" />
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>{t('screen.auth.create_account_heading')}</Text>
        <Text style={[styles.sub, { color: colors.subtext }]}>{t('screen.auth.signup_sub')}</Text>

        <InputField
          label={t('screen.auth.full_name')}
          icon="person-outline"
          placeholder={t('screen.auth.placeholder_name')}
          value={fullName}
          onChangeText={setFullName}
          isDark={isDark}
          containerStyle={styles.field}
          autoCapitalize="words"
        />

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

        <InputField
          label={t('screen.auth.password')}
          icon="lock-closed-outline"
          placeholder={t('screen.auth.placeholder_password')}
          value={password}
          onChangeText={setPassword}
          isDark={isDark}
          secure
          containerStyle={styles.field}
        />

        <InputField
          label={t('screen.auth.confirm_password')}
          icon="lock-closed-outline"
          placeholder={t('screen.auth.placeholder_confirm')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isDark={isDark}
          secure
          containerStyle={styles.field}
        />

        <PrimaryButton label={t('screen.auth.create_btn')} onPress={handleSignUp} loading={loading} style={styles.cta} />

        <View style={styles.loginRow}>
          <Text style={[styles.loginPrompt, { color: colors.subtext }]}>{t('screen.auth.have_account')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.loginLink, { color: Colors.brandGreen }]}>{t('screen.auth.sign_in_btn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontSize: 16 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 15, marginBottom: 24 },
  field: { marginBottom: 16 },
  cta: { marginTop: 8 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 6 },
  loginPrompt: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '600' },
});
