import { Activity, Globe, WifiOff, Sparkles, ShieldCheck, Users } from "lucide-react";
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

const TRUST_ITEMS = [
  { Icon: Sparkles,    label: "AI-Powered Insights" },
  { Icon: ShieldCheck, label: "Privacy First"        },
  { Icon: Users,       label: "Built for Africa"     },
];

export function LandingMarketingScreen({ params, isOnline, isDark }) {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          padding: "32px 24px 40px",
        }}
      >
        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 36 }}>
          {/* Wordmark */}
          <p
            style={{
              fontSize: 11,
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
              fontSize: 44,
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

          <p style={{ fontSize: 16, lineHeight: "24px", color: colors.subtext, margin: 0 }}>
            {t("screen.landing.hero_sub")}
          </p>

          <PrimaryButton
            label={t("screen.landing.get_started")}
            onClick={() => navigate("auth")}
          />

          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "center",
              fontSize: 14,
              fontWeight: 600,
              color: colors.subtext,
            }}
            onClick={goBack}
          >
            Back
          </button>
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
              <p style={{ fontSize: 12, fontWeight: 700, lineHeight: "16px", color: colors.text, margin: 0 }}>
                {t(labelKey)}
              </p>
              <p style={{ fontSize: 10, lineHeight: "14px", color: colors.muted, margin: 0 }}>
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
            <p style={{ fontSize: 12, fontWeight: 500, color: colors.subtext, margin: 0 }}>
              {t("screen.landing.stats")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: colors.border, marginBottom: 28 }} />

        {/* Why Mframapa section */}
        <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.text, margin: 0 }}>
            Why Mframapa?
          </h2>
          <p style={{ fontSize: 14, lineHeight: "20px", color: colors.subtext, margin: 0 }}>
            Africa has over 1.4 billion people but fewer than 200 air quality monitoring stations.
            Mframapa bridges that gap with satellite data, machine learning, and a 30+ language interface.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TRUST_ITEMS.map(({ Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: 0 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: colors.border, marginBottom: 28 }} />

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
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text, margin: 0 }}>
            Free to start
          </h2>
          <p style={{ fontSize: 14, lineHeight: "20px", color: colors.subtext, margin: 0 }}>
            Real-time AQI readings and city search are always free. Upgrade to Researcher for
            historical data, predictions, and exports starting at $15/month.
          </p>
          <button
            type="button"
            onClick={() => navigate("pricing")}
            style={{
              width: "100%",
              borderRadius: 16,
              border: `1.5px solid ${Colors.brandGreen}`,
              backgroundColor: "transparent",
              padding: "16px 0",
              fontSize: 16,
              fontWeight: 600,
              color: Colors.brandGreen,
              cursor: "pointer",
            }}
          >
            View Pricing
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: colors.muted, margin: 0 }}>
          Made with love for Africa · Version 2.0.0
        </p>
      </div>
    </div>
  );
}
