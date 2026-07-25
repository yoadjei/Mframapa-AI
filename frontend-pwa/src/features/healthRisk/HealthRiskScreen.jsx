import { useTranslation } from "../../hooks/useTranslation.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { getColors, getAQIColor } from "../../utils/colors.js";
import { aqiCategoryKey } from "../../utils/i18nHelpers.js";
import { StackBackButton } from "../../components/navigation/StackBackButton.jsx";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";
import {
  cityNameFromPrediction,
  deriveHealthRisks,
  resolvePrediction,
} from "./deriveHealthRisks.js";

function AQIBadge({ category, label, isDark }) {
  const color = getAQIColor(category, isDark);
  return (
    <span
      className="flex-shrink-0 rounded-full px-3 py-1 text-[0.75rem] font-bold text-white"
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

  const prediction = resolvePrediction(params);
  const risks = deriveHealthRisks(prediction);
  const cityName = cityNameFromPrediction(prediction);

  if (!prediction || !risks) {
    return (
      <div style={{ minHeight: "100dvh" }}>
        <div style={{ height: "env(safe-area-inset-top)" }} />
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ paddingTop: 8 }}
        >
          <StackBackButton
            onClick={goBack}
            color={colors.text}
            variant="chevron"
            ariaLabel={t("common.go_back")}
          />
          <span
            className="text-[0.8125rem] font-bold uppercase tracking-widest"
            style={{ color: colors.text }}
          >
            {t("screen.health_risk.title").toUpperCase()}
          </span>
          <div style={{ width: 44 }} />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
          <p className="text-center text-[0.9375rem]" style={{ color: colors.subtext }}>
            {t("screen.health_risk.open_city_first")}
          </p>
          <PrimaryButton label={t("common.back")} onClick={goBack} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 8 }}
      >
        <StackBackButton
          onClick={goBack}
          color={colors.text}
          variant="chevron"
          ariaLabel={t("common.go_back")}
        />

        <span
          className="text-[0.8125rem] font-bold uppercase tracking-widest"
          style={{ color: colors.text }}
        >
          {t("screen.health_risk.title").toUpperCase()}
        </span>

        <div style={{ width: 44 }} />
      </div>

      {cityName ? (
        <p
          className="px-4 pb-2 text-[0.875rem] font-semibold"
          style={{ color: colors.subtext }}
        >
          {cityName.split(",")[0].trim()}
        </p>
      ) : null}

      <div
        className="flex flex-col gap-3 px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)" }}
      >
        {risks.map((risk) => (
          <div
            key={risk.nameKey}
            className="rounded-2xl border p-4"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[1rem] font-bold" style={{ color: colors.text }}>
                {t(risk.nameKey)}
              </span>
              <AQIBadge
                isDark={isDark}
                category={risk.category}
                label={t(aqiCategoryKey(risk.category))}
              />
            </div>

            <p
              className="text-[0.875rem] leading-snug"
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
