import { Sparkles, BarChart3, List } from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { StackBackButton } from "../../components/navigation/StackBackButton.jsx";

function InsightCard({ icon: IconComp, title, desc, source, colors }) {
  const Icon = IconComp;
  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          backgroundColor: Colors.brandGreen + "22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={28} color={Colors.brandGreen} />
      </div>
      <p style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.text, margin: 0 }}>
        {title}
      </p>
      <p
        style={{
          fontSize: "0.875rem",
          lineHeight: "20px",
          color: colors.subtext,
          margin: 0,
          whiteSpace: "pre-line",
        }}
      >
        {desc}
      </p>
      {source ? (
        <span
          style={{
            borderRadius: 999,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 6,
            paddingBottom: 6,
            alignSelf: "flex-start",
            fontSize: "0.75rem",
            fontWeight: 500,
            backgroundColor: colors.surface,
            color: colors.subtext,
          }}
        >
          {source}
        </span>
      ) : null}
    </div>
  );
}

 
export function AIInsightsScreen({ isOnline, isDark, params }) {
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  // params.prediction is the PredictionResult passed when navigating to this screen.
  // Fall back to the home summary shape when navigating without explicit data.
  const lastPrediction = params?.prediction ?? null;

  const cards = (() => {
    if (!lastPrediction) return [];
    const out = [];

    // Card 1 — the AI-generated insight, when the backend returned one.
    if (lastPrediction.insight) {
      out.push({
        icon: Sparkles,
        title: t("screen.ai_insights.headline", { city: lastPrediction.location.name }),
        desc: lastPrediction.insight,
      });
    }

    // Card 2 — current reading + category, always shown when we have data.
    const unc = lastPrediction.uncertainty;
    out.push({
      icon: BarChart3,
      title: t("screen.ai_insights.current_reading"),
      desc: t("screen.ai_insights.reading_explanation", {
        pm25: (lastPrediction.pm25 ?? 0).toFixed(0),
        category: lastPrediction.aqi_category ?? "unknown",
        lower: (unc?.pm25_lower ?? 0).toFixed(0),
        upper: (unc?.pm25_upper ?? 0).toFixed(0),
      }),
    });

    // Card 3 — contributing factors, one card listing them.
    if (lastPrediction.factors && lastPrediction.factors.length > 0) {
      out.push({
        icon: List,
        title: t("screen.ai_insights.what_drove_this"),
        desc: lastPrediction.factors.slice(0, 6).map((f) => `• ${f}`).join("\n"),
      });
    }

    return out;
  })();

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Safe area top spacer */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <StackBackButton
          onClick={goBack}
          color={colors.text}
          variant="chevron"
          ariaLabel={t("common.go_back")}
        />
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: 1, color: colors.text }}>
          {t("screen.ai_insights.title").toUpperCase()}
        </span>
        <div style={{ width: 44 }} />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          padding: 16,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflowY: "auto",
        }}
      >
        {cards.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 80,
              gap: 14,
            }}
          >
            <Sparkles size={48} color={colors.subtext} />
            <p
              style={{
                fontSize: "0.9375rem",
                textAlign: "center",
                paddingLeft: 32,
                paddingRight: 32,
                color: colors.subtext,
                margin: 0,
              }}
            >
              {t("screen.ai_insights.no_insights_yet")}
            </p>
            <button
              type="button"
              onClick={() => navigate("home")}
              style={{
                paddingLeft: 18,
                paddingRight: 18,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: 999,
                fontSize: "0.875rem",
                fontWeight: 600,
                backgroundColor: Colors.brandGreen + "22",
                color: Colors.brandGreen,
                border: "none",
                cursor: "pointer",
              }}
            >
              {t("screen.ai_insights.check_a_city")}
            </button>
          </div>
        ) : (
          cards.map((card, i) => (
            <InsightCard key={i} colors={colors} {...card} />
          ))
        )}
      </div>
    </div>
  );
}
