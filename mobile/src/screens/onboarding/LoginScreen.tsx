import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { MframapaLogo } from '../../components/MframapaLogo';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  onAuth: () => void;
}

export function LoginScreen({ onAuth }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    onAuth();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <MframapaLogo size="lg" />
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>{t('screen.auth.welcome_back')}</Text>
        <Text style={[styles.sub, { color: colors.subtext }]}>{t('screen.auth.login_sub')}</Text>

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

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
          <Text style={[styles.forgotText, { color: Colors.brandGreen }]}>{t('screen.auth.forgot')}</Text>
        </TouchableOpacity>

        <PrimaryButton label={t('screen.auth.sign_in_btn')} onPress={handleLogin} loading={loading} style={styles.cta} />

        <View style={styles.signupRow}>
          <Text style={[styles.signupPrompt, { color: colors.subtext }]}>{t('screen.auth.no_account')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.signupLink, { color: Colors.brandGreen }]}>{t('screen.auth.sign_up')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 15, marginBottom: 28 },
  field: { marginBottom: 16 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 14, fontWeight: '500' },
  cta: { marginTop: 4 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 6 },
  signupPrompt: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '600' },
});
