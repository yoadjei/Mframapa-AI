import { ChevronLeft } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { getColors, getAQIColor } from "../../utils/colors.js";
import { aqiCategoryKey } from "../../utils/i18nHelpers.js";

const RISK_KEYS = [
  {
    nameKey: "screen.health_risk.asthma_name",
    descKey: "screen.health_risk.asthma_desc",
    category: "good",
  },
  {
    nameKey: "screen.health_risk.dust_name",
    descKey: "screen.health_risk.dust_desc",
    category: "moderate",
  },
  {
    nameKey: "screen.health_risk.heat_name",
    descKey: "screen.health_risk.heat_desc",
    category: "good",
  },
  {
    nameKey: "screen.health_risk.uv_name",
    descKey: "screen.health_risk.uv_desc",
    category: "high",
  },
];

function AQIBadge({ category, label }) {
  const color = getAQIColor(category);
  return (
    <span
      className="flex-shrink-0 rounded-full px-3 py-1 text-[12px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

export function HealthRiskScreen({ isDark, isOnline, params }) {
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  const colors = getColors(isDark);

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Safe area top spacer */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 8 }}
      >
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
        >
          <ChevronLeft size={22} color={colors.text} />
        </button>

        <span
          className="text-[13px] font-bold uppercase tracking-widest"
          style={{ color: colors.text }}
        >
          {t("screen.health_risk.title").toUpperCase()}
        </span>

        {/* Spacer to keep title centred */}
        <div style={{ width: 22 }} />
      </div>

      {/* Risk cards */}
      <div
        className="flex flex-col gap-3 px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)" }}
      >
        {RISK_KEYS.map((risk) => (
          <div
            key={risk.nameKey}
            className="rounded-2xl border p-4"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            {/* Top row: name + badge */}
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[16px] font-bold" style={{ color: colors.text }}>
                {t(risk.nameKey)}
              </span>
              <AQIBadge
                category={risk.category}
                label={t(aqiCategoryKey(risk.category))}
              />
            </div>

            {/* Description */}
            <p
              className="text-[14px] leading-snug"
              style={{ color: colors.subtext }}
            >
              {t(risk.descKey)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
