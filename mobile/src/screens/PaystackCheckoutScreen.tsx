import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { buildCheckoutHtml, generateReference, isPaystackConfigured } from '../services/paystack';
import { findPlan, PlanId } from '../utils/plans';

type Params = {
  PaystackCheckout: { planId: PlanId };
};

interface PaystackMessage {
  event: 'paystack:success' | 'paystack:cancelled' | 'paystack:failed';
  reference?: string;
  error?: string;
}

export function PaystackCheckoutScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, 'PaystackCheckout'>>();
  const planId = route.params?.planId;

  const profile              = useStore((s) => s.profile);
  const paymentCurrency      = useStore((s) => s.paymentCurrency);
  const activateSubscription = useStore((s) => s.activateSubscription);

  const plan = useMemo(() => (planId ? findPlan(planId) : null), [planId]);
  const reference = useMemo(() => (planId ? generateReference(planId) : ''), [planId]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  // Hard guards before touching the WebView.
  if (!plan) {
    return (
      <ErrorView
        message={t('screen.checkout.plan_missing')}
        colors={colors}
        insets={insets}
        onClose={() => navigation.goBack()}
      />
    );
  }
  if (!isPaystackConfigured()) {
    return (
      <ErrorView
        message={t('screen.checkout.not_configured')}
        colors={colors}
        insets={insets}
        onClose={() => navigation.goBack()}
      />
    );
  }
  if (!profile.email) {
    return (
      <ErrorView
        message={t('screen.checkout.sign_in_required')}
        colors={colors}
        insets={insets}
        onClose={() => navigation.goBack()}
      />
    );
  }

  const html = buildCheckoutHtml({
    email: profile.email,
    amountUsd: plan.amountUsd,
    currency: paymentCurrency,
    reference,
    planId: plan.id,
    metadata: {
      app: 'mframapa-mobile',
      full_name: profile.fullName || undefined,
    },
  });

  function handleMessage(e: WebViewMessageEvent) {
    if (done || !plan) return;
    const activePlan = plan;
    let msg: PaystackMessage | null = null;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (!msg) return;

    setDone(true);

    if (msg.event === 'paystack:success' && msg.reference) {
      // In production: send msg.reference to your backend for verification
      // via `GET /transaction/verify/:reference` before granting access.
      activateSubscription({
        plan: activePlan.id,
        reference: msg.reference,
        intervalDays: activePlan.intervalDays,
        amountUsd: activePlan.amountUsd,
      });
      Alert.alert(
        t('screen.checkout.success_title'),
        t('screen.checkout.success_body', { plan: activePlan.label }),
        [{ text: t('common.continue'), onPress: () => navigation.goBack() }],
      );
      return;
    }

    if (msg.event === 'paystack:cancelled') {
      navigation.goBack();
      return;
    }

    Alert.alert(t('screen.checkout.failed'), msg.error ?? '', [
      { text: t('common.back'), onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('screen.checkout.title', { plan: plan.label })}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.webViewWrap}>
        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://js.paystack.co' }}
          onMessage={handleMessage}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          style={{ backgroundColor: colors.background }}
        />
        {loading ? (
          <View style={styles.spinnerOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.brandGreen} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ErrorView({
  message, colors, insets, onClose,
}: { message: string; colors: ReturnType<typeof getColors>; insets: { top: number; bottom: number; left: number; right: number }; onClose: () => void }) {
  return (
    <View style={[styles.root, { backgroundColor: colors.background, padding: 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ width: 24 }} />
        <View style={{ width: 24 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.subtext} />
        <Text style={{ color: colors.text, textAlign: 'center', fontSize: 16 }}>{message}</Text>
      </View>
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
  title: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  webViewWrap: { flex: 1 },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
