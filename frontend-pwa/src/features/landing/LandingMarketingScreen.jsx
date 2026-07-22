import { Activity, ArrowLeft, Globe, WifiOff, Gift, UserX, CloudOff } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { MorphBackground, useStaggeredEntrance } from "../../components/background/MorphBackground.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";

const FEATURE_KEYS = [
  {
    Icon:     Activity,
    labelKey: "screen.landing.feature1_label",
    descKey:  "screen.landing.feature1_desc",
  },
  {
    Icon:     Globe,
    labelKey: "screen.landing.feature2_label",
    descKey:  "screen.landing.feature2_desc",
  },
  {
    Icon:     WifiOff,
    labelKey: "screen.landing.feature3_label",
    descKey:  "screen.landing.feature3_desc",
  },
];

// these were hardcoded english and never reached the translation pipeline
const TRUST_ITEMS = [
  { Icon: Gift,     labelKey: "screen.landing.trust1" },
  { Icon: UserX,    labelKey: "screen.landing.trust2" },
  { Icon: CloudOff, labelKey: "screen.landing.trust3" },
];

export function LandingMarketingScreen({ params, isOnline, isDark }) {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();
  const { state } = useAppState();
  const colors = getColors(isDark ?? true);
  const liteMode = state.preferences?.liteMode ?? false;
  const shown = useStaggeredEntrance(4, { disabled: liteMode });

  // blocks rise into place in order rather than appearing all at once
  const enter = (i) => ({
    opacity: shown > i ? 1 : 0,
    transform: shown > i ? "translateY(0)" : "translateY(14px)",
    transition: liteMode ? undefined : "opacity 420ms ease, transform 420ms ease",
  });

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <MorphBackground isDark={isDark ?? true} liteMode={liteMode} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px 4px",
        }}
      >
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
          style={{ width: 36, height: 36 }}
          aria-label={t("common.go_back")}
        >
          <ArrowLeft size={22} color={colors.text} />
        </button>
        <div style={{ width: 36 }} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          padding: "8px 24px 40px",
        }}
      >
        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 36, ...enter(0) }}>
          {/* Wordmark */}
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: Colors.brandGreen,
              margin: 0,
            }}
          >
            MFRAMAPA
          </p>

          <h1
            style={{
              fontSize: "2.75rem",
              fontWeight: 800,
              lineHeight: "52px",
              letterSpacing: "-0.5px",
              color: colors.text,
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {t("screen.landing.hero")}
          </h1>

          <p style={{ fontSize: "1rem", lineHeight: "24px", color: colors.subtext, margin: 0 }}>
            {t("screen.landing.hero_sub")}
          </p>

          <PrimaryButton
            label={t("screen.landing.get_started")}
            onClick={() => navigate("auth")}
          />
        </div>

        {/* Feature cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {FEATURE_KEYS.map(({ Icon, labelKey, descKey }) => (
            <div
              key={labelKey}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                borderRadius: 14,
                padding: 12,
                backgroundColor: colors.card,
                minHeight: 110,
              }}
            >
              <Icon size={22} color={Colors.brandGreen} />
              <p style={{ fontSize: "0.75rem", fontWeight: 700, lineHeight: "16px", color: colors.text, margin: 0 }}>
                {t(labelKey)}
              </p>
              <p style={{ fontSize: "0.625rem", lineHeight: "14px", color: colors.muted, margin: 0 }}>
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              borderRadius: 999,
              padding: "12px 20px",
              backgroundColor: colors.card,
            }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: colors.subtext, margin: 0 }}>
              {t("screen.landing.stats")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: colors.border, marginBottom: 28, ...enter(2) }} />

        {/* Why Mframapa section */}
        <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 16, ...enter(3) }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: colors.text, margin: 0 }}>
            {t("screen.landing.why_title")}
          </h2>
          <p style={{ fontSize: "0.875rem", lineHeight: "20px", color: colors.subtext, margin: 0 }}>
            {t("screen.landing.why_body")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TRUST_ITEMS.map(({ Icon, labelKey }) => (
              <div key={labelKey} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: Colors.brandGreen + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color={Colors.brandGreen} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: colors.text, margin: 0 }}>
                  {t(labelKey)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: colors.border, marginBottom: 28, ...enter(2) }} />

        {/* Pricing teaser */}
        <div
          style={{
            marginBottom: 28,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            borderRadius: 16,
            padding: 20,
            backgroundColor: colors.card,
            border: `1.5px solid ${colors.border}`,
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: colors.text, margin: 0 }}>
            Free for every individual, forever
          </h2>
          <p style={{ fontSize: "0.875rem", lineHeight: "20px", color: colors.subtext, margin: 0 }}>
            Air quality estimates, health guidance and episode alerts are free for everyone,
            always. Institutions fund it through API access and data partnerships.
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "0.6875rem", color: colors.muted, margin: 0 }}>
          Made with love for Africa · Version 2.0.0
        </p>
      </div>
    </div>
  );
}
