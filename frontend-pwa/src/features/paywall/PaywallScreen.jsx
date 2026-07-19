import { useState } from "react";
import { ArrowLeft, Leaf, FlaskConical, Building2, BarChart3, CreditCard, Smartphone, Banknote, Hash } from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";
import { OutlineButton } from "../../components/ui/OutlineButton.jsx";

// Pricing plans (simplified — no Paystack SDK in PWA)
const PLANS = [
  {
    id:       "researcher_monthly",
    interval: "Monthly",
    intervalKey: "screen.paywall.billing_monthly",
    price:    "$15",
    perUnit:  " / mo",
    perUnitKey: "screen.paywall.per_mo",
    badge:    null,
  },
  {
    id:       "researcher_annual",
    interval: "Annual",
    intervalKey: "screen.paywall.billing_annual",
    price:    "$144",
    perUnit:  " / yr",
    perUnitKey: "screen.paywall.per_yr",
    badge:    "Best value",
    perMonth: "$12 / mo",
  },
];

const CURRENCIES = [
  { code: "USD", flag: "🇺🇸" },
  { code: "GHS", flag: "🇬🇭" },
  { code: "NGN", flag: "🇳🇬" },
  { code: "KES", flag: "🇰🇪" },
  { code: "ZAR", flag: "🇿🇦" },
];

const CHANNELS = [
  { key: "card",          labelKey: "screen.paywall.channel_card",          Icon: CreditCard  },
  { key: "mobile_money",  labelKey: "screen.paywall.channel_mobile_money",  Icon: Smartphone  },
  { key: "bank_transfer", labelKey: "screen.paywall.channel_bank_transfer", Icon: Banknote    },
  { key: "ussd",          labelKey: "screen.paywall.channel_ussd",          Icon: Hash        },
];

export function PaywallScreen({ params, isOnline, isDark }) {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  const [selectedPlan,     setSelectedPlan]     = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [restoring,        setRestoring]        = useState(false);

  function handleSubscribe() {
    if (!selectedPlan) return;
    navigate("subscription", { tier: selectedPlan });
  }

  function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      window.alert(t("screen.paywall.nothing_to_restore"));
    }, 800);
  }

  function PlanCard({ plan }) {
    const selected = selectedPlan === plan.id;
    return (
      <button
        type="button"
        onClick={() => setSelectedPlan(plan.id)}
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          borderRadius: 12,
          padding: 12,
          minHeight: 100,
          backgroundColor: colors.card,
          border: `${selected ? 2 : 1}px solid ${selected ? Colors.brandGreen : colors.border}`,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {plan.badge && (
          <span
            style={{
              position: "absolute",
              top: -8,
              right: 8,
              borderRadius: 6,
              padding: "2px 7px",
              backgroundColor: Colors.brandGreen,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            {plan.badge}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            color: selected ? Colors.brandGreen : colors.subtext,
          }}
        >
          {t(plan.intervalKey)}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{plan.price}</span>
          <span style={{ fontSize: 11, color: colors.subtext }}>{plan.perUnit}</span>
        </div>
        {plan.perMonth && (
          <span style={{ fontSize: 10, marginTop: 1, color: colors.muted }}>{plan.perMonth}</span>
        )}
        {selected && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: Colors.brandGreen,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 10, color: "#fff" }}>✓</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px 12px",
        }}
      >
        <button
          type="button"
          onClick={goBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: colors.text }}>
          {t("screen.paywall.all_plans_title")}
        </span>
        <div style={{ width: 22 }} />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          overflowY: "auto",
          padding: "8px 16px 40px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p style={{ fontSize: 14, textAlign: "center", marginBottom: 20, color: colors.subtext }}>
          {t("screen.paywall.all_plans_subtitle")}
        </p>

        {/* ── Free tier ────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 16,
            border: `1.5px solid ${colors.border}`,
            backgroundColor: colors.card,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Leaf size={18} color={colors.subtext} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: colors.text, margin: 0 }}>
                {t("screen.pricing.tier_free")}
              </p>
              <p style={{ fontSize: 12, lineHeight: "16px", marginTop: 2, color: colors.subtext, margin: 0 }}>
                {t("screen.pricing.tier_free_desc")}
              </p>
            </div>
            <span
              style={{
                borderRadius: 999,
                padding: "4px 10px",
                backgroundColor: colors.surface,
                color: colors.subtext,
                fontSize: 13,
                fontWeight: 700,
                alignSelf: "flex-start",
              }}
            >
              {t("screen.pricing.price_free")}
            </span>
          </div>
        </div>

        {/* ── Researcher tier ──────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 16,
            border: `1.5px solid ${Colors.brandGreen}`,
            backgroundColor: colors.card,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: Colors.brandGreen + "22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FlaskConical size={18} color={Colors.brandGreen} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: Colors.brandGreen, margin: 0 }}>
                {t("screen.subscription.plan_researcher")}
              </p>
              <p style={{ fontSize: 12, lineHeight: "16px", marginTop: 2, color: colors.subtext, margin: 0 }}>
                {t("screen.pricing.tier_researcher_desc")}
              </p>
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ display: "flex", gap: 10 }}>
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Currency selector */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: colors.subtext,
                marginBottom: 8,
                margin: 0,
              }}
            >
              {t("screen.paywall.pay_in")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {CURRENCIES.map((c) => {
                const sel = selectedCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setSelectedCurrency(c.code)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      borderRadius: 999,
                      border: `1px solid ${sel ? Colors.brandGreen : colors.border}`,
                      backgroundColor: sel ? Colors.brandGreen : colors.surface,
                      padding: "7px 11px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{c.flag}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sel ? "#fff" : colors.text }}>
                      {c.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment channels */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CHANNELS.map(({ key, labelKey, Icon }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  borderRadius: 999,
                  padding: "5px 9px",
                  backgroundColor: Colors.brandGreen + "15",
                }}
              >
                <Icon size={12} color={Colors.brandGreen} />
                <span style={{ fontSize: 11, fontWeight: 600, color: Colors.brandGreen }}>
                  {t(labelKey)}
                </span>
              </div>
            ))}
          </div>

          {/* Subscribe / prompt */}
          {selectedPlan ? (
            <PrimaryButton
              label={t("screen.paywall.subscribe_for", {
                price:
                  (PLANS.find((p) => p.id === selectedPlan)?.price ?? "") +
                  (PLANS.find((p) => p.id === selectedPlan)?.perUnit ?? ""),
              })}
              onClick={handleSubscribe}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                padding: "14px 0",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: colors.muted }}>
                {t("screen.paywall.select_plan_prompt")}
              </span>
            </div>
          )}
        </div>

        {/* ── Institutional API tier ───────────────────────────────────── */}
        <div
          style={{
            borderRadius: 16,
            border: `1.5px solid ${Colors.enterprise}`,
            backgroundColor: colors.card,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: Colors.enterprise + "22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Building2 size={18} color={Colors.enterprise} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: Colors.enterprise, margin: 0 }}>
                {t("screen.pricing.tier_institutional")}
              </p>
              <p style={{ fontSize: 12, lineHeight: "16px", marginTop: 2, color: colors.subtext, margin: 0 }}>
                {t("screen.pricing.tier_institutional_desc")}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: 0 }}>
            {t("screen.pricing.price_institutional")}
          </p>
          <OutlineButton
            label={t("screen.pricing.cta_contact")}
            onClick={() => { window.location.href = "mailto:adjeiyawosei@gmail.com"; }}
            color={Colors.enterprise}
          />
        </div>

        {/* ── Programme & Verification tier ────────────────────────────── */}
        <div
          style={{
            borderRadius: 16,
            border: `1.5px solid ${Colors.programme}`,
            backgroundColor: colors.card,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: Colors.programme + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BarChart3 size={18} color={Colors.programme} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: Colors.programme, margin: 0 }}>
                {t("screen.pricing.tier_programme")}
              </p>
              <p style={{ fontSize: 12, lineHeight: "16px", marginTop: 2, color: colors.subtext, margin: 0 }}>
                {t("screen.pricing.tier_programme_desc")}
              </p>
            </div>
          </div>
          <OutlineButton
            label={t("screen.pricing.cta_contact")}
            onClick={() => { window.location.href = "mailto:adjeiyawosei@gmail.com"; }}
            color={Colors.programme}
          />
        </div>

        {/* Legal & restore */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.muted }}
            onClick={() => {}}
          >
            {t("screen.paywall.terms")}
          </button>
          <span style={{ fontSize: 12, color: colors.muted }}>|</span>
          <button
            type="button"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.muted }}
            onClick={() => {}}
          >
            {t("screen.paywall.privacy")}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <button
            type="button"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.muted }}
            onClick={handleRestore}
          >
            {restoring ? t("screen.paywall.restoring") : t("screen.paywall.restore")}
          </button>
        </div>
      </div>
    </div>
  );
}
