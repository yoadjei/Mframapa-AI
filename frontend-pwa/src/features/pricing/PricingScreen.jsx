import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";

const FEATURES = [
  { key: "screen.pricing.feat.basic_aqi",       free: true,  researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.search",           free: true,  researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.saved_3",          free: true,  researcher: false, institutional: false },
  { key: "screen.pricing.feat.saved_unlimited",  free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.ai_insights",      free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.predictions",      free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.health_risk",      free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.historical",       free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.compare",          free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.exports",          free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.community",        free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.anomaly",          free: false, researcher: false, institutional: true  },
  { key: "screen.pricing.feat.heatmap",          free: false, researcher: false, institutional: true  },
  { key: "screen.pricing.feat.batch",            free: false, researcher: false, institutional: true  },
  { key: "screen.pricing.feat.api",              free: false, researcher: true,  institutional: true  },
  { key: "screen.pricing.feat.country",          free: false, researcher: false, institutional: true  },
];

function FeatureCheck({ included, color }) {
  if (included) {
    return <CheckCircle2 size={18} color={color} className="flex-shrink-0" />;
  }
  return <XCircle size={18} color="#25303C" className="flex-shrink-0" />;
}

export function PricingScreen({ isDark, isOnline, params }) {
  const { state } = useAppState();
  const { t } = useTranslation();
  const { goBack, navigate } = useNavigation();
  const colors = getColors(isDark);
  const tier = state.session?.tier ?? "free";

  const TIERS = [
    {
      key: "free",
      nameKey: "screen.pricing.tier_free",
      descKey: "screen.pricing.tier_free_desc",
      priceKey: "screen.pricing.price_free",
      color: colors.subtext,
      borderColor: colors.border,
      ctaKey: "screen.pricing.cta_current",
      ctaDisabled: true,
      isPopular: false,
      isCurrent: tier === "free",
      onPress: () => {},
    },
    {
      key: "researcher",
      nameKey: "screen.subscription.plan_researcher",
      descKey: "screen.pricing.tier_researcher_desc",
      priceKey: "screen.pricing.price_researcher",
      color: Colors.brandGreen,
      borderColor: Colors.brandGreen,
      ctaKey: tier === "researcher" || tier === "institutional"
        ? "screen.pricing.cta_current"
        : "screen.pricing.cta_upgrade",
      ctaDisabled: tier === "researcher" || tier === "institutional",
      isPopular: true,
      isCurrent: tier === "researcher",
      onPress: () => navigate("subscription", { tier: "researcher" }),
    },
    {
      key: "institutional",
      nameKey: "screen.pricing.tier_institutional",
      descKey: "screen.pricing.tier_institutional_desc",
      priceKey: "screen.pricing.price_institutional",
      color: Colors.enterprise,
      borderColor: Colors.enterprise,
      ctaKey: tier === "institutional"
        ? "screen.pricing.cta_current"
        : "screen.pricing.cta_contact",
      ctaDisabled: tier === "institutional",
      isPopular: false,
      isCurrent: tier === "institutional",
      onPress: () => navigate("subscription", { tier: "institutional" }),
    },
    {
      key: "programme",
      nameKey: "screen.pricing.tier_programme",
      descKey: "screen.pricing.tier_programme_desc",
      priceKey: "screen.pricing.price_programme",
      color: Colors.programme,
      borderColor: Colors.programme,
      ctaKey: "screen.pricing.cta_contact",
      ctaDisabled: false,
      isPopular: false,
      isCurrent: false,
      onPress: () => navigate("subscription", { tier: "programme" }),
    },
  ];

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Safe area top spacer */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ paddingTop: 8 }}>
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
        >
          <ChevronLeft size={22} color={colors.text} />
        </button>

        <span
          className="text-[17px] font-bold"
          style={{ color: colors.text }}
        >
          {t("screen.pricing.title")}
        </span>

        <div style={{ width: 22 }} />
      </div>

      {/* Scrollable content */}
      <div
        className="flex flex-col gap-4 px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)" }}
      >
        <p className="text-[14px]" style={{ color: colors.subtext }}>
          {t("screen.pricing.subtitle")}
        </p>

        {TIERS.map((tr) => {
          return (
            <div
              key={tr.key}
              className="rounded-2xl p-5"
              style={{
                backgroundColor: colors.card,
                border: `1.5px solid ${tr.borderColor}`,
              }}
            >
              {/* Card header */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p
                    className="text-[22px] font-extrabold leading-tight"
                    style={{ color: tr.color }}
                  >
                    {t(tr.nameKey)}
                  </p>
                  <p
                    className="mt-0.5 text-[15px] font-semibold"
                    style={{ color: colors.text }}
                  >
                    {t(tr.priceKey)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 pt-0.5">
                  {tr.isPopular && (
                    <span
                      className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                      style={{
                        backgroundColor: Colors.brandGreen + "22",
                        color: Colors.brandGreen,
                      }}
                    >
                      {t("screen.pricing.badge_popular")}
                    </span>
                  )}
                  {tr.isCurrent && (
                    <span
                      className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                      style={{
                        backgroundColor: colors.surface,
                        color: colors.subtext,
                      }}
                    >
                      {t("screen.pricing.badge_current")}
                    </span>
                  )}
                </div>
              </div>

              <p
                className="mb-3 text-[13px] leading-[18px]"
                style={{ color: colors.subtext }}
              >
                {t(tr.descKey)}
              </p>

              {/* Divider */}
              <div className="my-3 h-px" style={{ backgroundColor: colors.border }} />

              {/* Feature rows */}
              <div className="flex flex-col gap-2.5">
                {FEATURES.map((f) => {
                  const included =
                    tr.key === "free"
                      ? f.free
                      : tr.key === "researcher"
                      ? f.researcher
                      : tr.key === "institutional"
                      ? f.institutional
                      : false;
                  return (
                    <div key={f.key} className="flex items-center gap-2.5">
                      <FeatureCheck included={included} color={tr.color} />
                      <span
                        className="flex-1 text-[14px]"
                        style={{ color: included ? colors.text : colors.muted }}
                      >
                        {t(f.key)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="my-3 h-px" style={{ backgroundColor: colors.border }} />

              {/* CTA */}
              <button
                type="button"
                onClick={tr.onPress}
                disabled={tr.ctaDisabled}
                className="mt-1 w-full rounded-xl py-3 text-[15px] font-bold active:opacity-70 disabled:cursor-not-allowed"
                style={
                  tr.ctaDisabled
                    ? {
                        border: `1.5px solid ${colors.border}`,
                        color: colors.muted,
                        backgroundColor: "transparent",
                      }
                    : {
                        border: `1.5px solid ${tr.color}`,
                        color: "#fff",
                        backgroundColor: tr.color,
                      }
                }
              >
                {t(tr.ctaKey)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
