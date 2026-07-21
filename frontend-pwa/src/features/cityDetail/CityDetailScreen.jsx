import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Droplets,
  Loader2,
  Share2,
  Sparkles,
  Thermometer,
  TrendingUp,
  Wind,
} from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { getColors, Colors, getAQIColor } from "../../utils/colors.js";
import { aqiCategoryKey } from "../../utils/i18nHelpers.js";
import { generateInsight, getHistory } from "../../services/api.js";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";

const TREND_DAY_KEYS = [
  "screen.city_detail.day_mon",
  "screen.city_detail.day_tue",
  "screen.city_detail.day_wed",
  "screen.city_detail.day_thu",
  "screen.city_detail.day_fri",
  "screen.city_detail.day_sat",
  "screen.city_detail.day_sun",
];

function healthAdviceKey(category) {
  const lower = (category || "").toLowerCase();
  if (lower.includes("hazardous")) return "advice.hazardous";
  if (lower.includes("very")) return "advice.very_unhealthy";
  if (lower.includes("unhealthy") && !lower.includes("sensitive")) return "advice.unhealthy";
  if (lower.includes("sensitive")) return "advice.sensitive";
  if (lower.includes("moderate")) return "advice.moderate";
  return "advice.good";
}

// Sparkline bar chart for the 7-day trend, mirrors mobile LineChart height/proportions
function TrendChart({ data, labels, color }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 120 }}>
      {data.map((val, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-sm"
            style={{
              height: `${Math.round((val / max) * 80)}px`,
              minHeight: 4,
              backgroundColor: color,
              opacity: 0.85,
            }}
          />
          <span className="text-[9px]" style={{ color: "#9AA7B5" }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CityDetailScreen({ isDark, params }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { goBack, navigate } = useNavigation();
  const colors = getColors(isDark);
  const language = state.preferences?.language ?? "en";

  // params comes from the stack: { city: {...}, prediction: {...} }
  const prediction = params?.prediction ?? null;
  const city = params?.city ?? prediction?.city ?? null;

  const pm25 = prediction?.pm25 ?? 0;
  const category = prediction?.category ?? prediction?.aqi_category ?? "good";
  const weather = prediction?.weather ?? { temp: 0, humidity: 0, wind: 0 };
  const uncertainty = prediction?.uncertainty ?? null;
  const factors = prediction?.factors ?? null;
  const aqiColor = getAQIColor(category, isDark);
  const categoryLabel = t(aqiCategoryKey(category));
  const healthAdvice = t(healthAdviceKey(category));
  const trendLabels = TREND_DAY_KEYS.map((key) => t(key));
  // real recent days rather than multipliers applied to today's number
  const [trendData, setTrendData] = useState([]);
  useEffect(() => {
    const lat = city?.lat, lon = city?.lon;
    if (lat == null || lon == null) { setTrendData([]); return; }
    let cancelled = false;
    getHistory(lat, lon, city?.name ?? "Unknown", 7)
      .then((days) => { if (!cancelled) setTrendData(days.map((d) => Math.round(d.pm25))); })
      .catch(() => { if (!cancelled) setTrendData([]); });
    return () => { cancelled = true; };
  }, [city?.lat, city?.lon, city?.name]);
  const cityName = city?.name ?? "";
  const displayName = cityName.split(",")[0].trim();

  const updatedAt = prediction?.timestamp
    ? new Date(prediction.timestamp).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  // Save city state
  const savedCities = state.savedCities ?? [];
  const isSaved = savedCities.some(
    (c) =>
      c.name === displayName ||
      (city &&
        Math.abs((c.lat ?? 0) - city.lat) < 0.01 &&
        Math.abs((c.lon ?? 0) - city.lon) < 0.01)
  );
  const [saving, setSaving] = useState(false);

  // AI Insight state — seed from params so we don't needlessly refetch
  const [insight, setInsight] = useState(() => prediction?.insight ?? undefined);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightFetchedForRef = useRef(null);

  // Fetch insight when prediction changes and no insight is already present
  useEffect(() => {
    const locKey = city ? `${city.lat.toFixed(4)}:${city.lon.toFixed(4)}` : null;
    if (prediction?.insight) {
      setInsight(prediction.insight);
      insightFetchedForRef.current = locKey;
      return undefined;
    }
    if (!prediction || insightFetchedForRef.current === locKey) return undefined;
    insightFetchedForRef.current = locKey;

    let cancelled = false;
    const run = async () => {
      setInsightLoading(true);
      try {
        const text = await generateInsight({
          pm25: prediction.pm25,
          aqi_category: prediction.category ?? prediction.aqi_category,
          weather: prediction.weather ?? {},
          language,
        });
        if (!cancelled) setInsight(text);
      } catch {
        // leave insight undefined
      } finally {
        if (!cancelled) setInsightLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.lat, city?.lon, prediction?.insight]);

  function handleSave() {
    if (!city || isSaved || saving) return;
    setSaving(true);
    dispatch({
      type: "SAVE_CITY",
      payload: {
        name: displayName || cityName,
        lat: city.lat,
        lon: city.lon,
        country: city.country ?? "",
      },
    });
    setSaving(false);
  }

  async function handleShare() {
    const text = `${cityName} air quality is ${categoryLabel}. PM2.5: ${Math.round(pm25)} μg/m³ — Mframapa AI`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mframapa AI", text, url: "https://mframapaai.health/" });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  if (!prediction) {
    return (
      <>
        {/* Safe area spacer */}
        <div style={{ height: "env(safe-area-inset-top)" }} />
        <div
          className="flex flex-col items-center justify-center gap-4 px-6 py-16"
          style={{ backgroundColor: colors.background }}
        >
          <p className="text-center text-[15px]" style={{ color: colors.subtext }}>
            {t("home.tap_check")}
          </p>
          <PrimaryButton label={t("common.back")} onClick={goBack} />
        </div>
      </>
    );
  }

  return (
    <div
      className="min-h-[100dvh] overflow-y-auto"
      style={{
        backgroundColor: colors.background,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)",
      }}
    >
      {/* ── Gradient header (mirrors mobile LinearGradient + paddingTop: insets.top) ── */}
      <div
        style={{
          background: `linear-gradient(180deg, ${aqiColor}CC 0%, ${aqiColor}66 55%, ${colors.background} 100%)`,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 pb-4"
          style={{ paddingTop: 12 }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 active:opacity-60"
            style={{ minWidth: 60 }}
            aria-label={t("common.back")}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#fff"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[16px] text-white">{t("common.back")}</span>
          </button>

          {/* City name */}
          <h1 className="flex-1 text-center text-[18px] font-bold text-white">
            {cityName}
          </h1>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-end active:opacity-60"
            style={{ minWidth: 60 }}
            aria-label={t("screen.share.title")}
          >
            <Share2 size={22} color="#fff" />
          </button>
        </div>
      </div>

      {/* ── AQI block (mirrors mobile aqiBlock) ── */}
      <div className="flex flex-col gap-1.5 px-6 py-6" style={{ backgroundColor: aqiColor + "18" }}>
        <p className="mb-1 text-[12px]" style={{ color: colors.subtext }}>
          {t("screen.city_detail.updated_at", { time: updatedAt })}
        </p>
        <p className="text-[13px] font-medium" style={{ color: colors.subtext }}>
          {t("screen.city_detail.pm25_concentration")}
        </p>
        <div className="mt-1 flex items-end gap-4">
          {/* Big PM2.5 number */}
          <span
            className="text-[56px] font-black"
            style={{ color: colors.text, lineHeight: "60px" }}
          >
            {Math.round(pm25)}
          </span>
          <div className="flex flex-col gap-2 pb-2">
            <span className="text-[13px] font-semibold" style={{ color: colors.subtext }}>
              {t("unit.ug_m3")}
            </span>
            {/* AQI badge */}
            <span
              className="rounded-full px-3 py-1 text-[12px] font-bold text-white"
              style={{ backgroundColor: aqiColor }}
            >
              {categoryLabel}
            </span>
          </div>
        </div>
        {uncertainty ? (
          <p className="mt-1 text-[13px]" style={{ color: colors.subtext }}>
            {t("screen.city_detail.uncertainty_range")}:{" "}
            {uncertainty.pm25_lower.toFixed(0)}–{uncertainty.pm25_upper.toFixed(0)}{" "}
            {t("unit.ug_m3")}
          </p>
        ) : null}
      </div>

      {/* ── Weather chips (mirrors mobile weatherRow) ── */}
      <div className="flex gap-2 px-4 py-3">
        {[
          {
            icon: <Thermometer size={14} color={Colors.brandGreen} />,
            val: `${Math.round(weather.temp ?? 0)}°C`,
            label: t("weather.temp"),
          },
          {
            icon: <Droplets size={14} color={Colors.brandGreen} />,
            val: `${Math.round(weather.humidity ?? 0)}%`,
            label: t("weather.humidity"),
          },
          {
            icon: <Wind size={14} color={Colors.brandGreen} />,
            val: t("screen.city_detail.wind_kmh", { speed: Math.round(weather.wind ?? 0).toString() }),
            label: t("weather.wind"),
          },
        ].map(({ icon, val, label }, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center gap-1 rounded-2xl border px-2 py-2.5"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            {icon}
            <span className="text-[13px] font-bold" style={{ color: colors.text }}>
              {val}
            </span>
            <span className="text-center text-[11px]" style={{ color: colors.subtext }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── AI Insights section header ── */}
      <div className="mt-2 flex items-center gap-2 px-4 pb-1">
        <Sparkles size={18} color={Colors.brandGreen} />
        <span className="text-[16px] font-bold" style={{ color: colors.text }}>
          {t("screen.city_detail.ai_insights_section")}
        </span>
      </div>

      {/* ── Primary insight card ── */}
      <div
        className="mx-4 mb-3 mt-1 flex flex-col gap-2.5 rounded-2xl border p-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} color={Colors.brandGreen} />
          <span className="text-[14px] font-semibold" style={{ color: colors.text }}>
            {t("card.insight_title")}
          </span>
        </div>
        {insightLoading ? (
          <div className="flex items-center gap-2.5 py-2">
            <Loader2 size={16} color={Colors.brandGreen} className="animate-spin" />
            <span className="flex-1 text-[14px]" style={{ color: colors.subtext }}>
              {t("screen.city_detail.insight_loading")}
            </span>
          </div>
        ) : insight ? (
          <p className="text-[15px] leading-relaxed" style={{ color: colors.text }}>
            {insight}
          </p>
        ) : (
          <p className="text-[15px] leading-relaxed" style={{ color: colors.subtext }}>
            {t("screen.ai_insights.trend_desc")}
          </p>
        )}
      </div>

      {/* ── 7-day trend (mirrors mobile LineChart section) ── */}
      <div
        className="mx-4 mb-3 flex flex-col gap-2.5 rounded-2xl border p-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <p className="text-[14px] font-semibold" style={{ color: colors.text }}>
          {t("screen.city_detail.trend_7d")}
        </p>
        <TrendChart data={trendData} labels={trendLabels} color={aqiColor} />
      </div>

      {/* ── Contributing factors ── */}
      {factors && factors.length > 0 ? (
        <div
          className="mx-4 mb-3 flex flex-col gap-2.5 rounded-2xl border p-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <p className="text-[14px] font-semibold" style={{ color: colors.text }}>
            {t("card.factors_title")}
          </p>
          <ul className="flex flex-col gap-2">
            {factors.slice(0, 6).map((factor) => (
              <li key={factor} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: Colors.brandGreen }}
                />
                <span
                  className="text-[14px] capitalize"
                  style={{ color: colors.text }}
                >
                  {factor.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}


      {/* ── Health guidance ── */}
      <div
        className="mx-4 mb-3 flex flex-col gap-2.5 rounded-2xl border p-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <p className="text-[14px] font-semibold" style={{ color: colors.subtext }}>
          {t("card.health_guidance")}
        </p>
        <p className="text-[15px] font-medium leading-relaxed" style={{ color: colors.text }}>
          {healthAdvice}
        </p>
        <button
          type="button"
          onClick={() => navigate("healthRisk", { prediction })}
          className="mt-1 flex items-center gap-1 active:opacity-60"
        >
          <span className="text-[14px] font-semibold" style={{ color: Colors.brandGreen }}>
            {t("screen.city_detail.view_health_risk")}
          </span>
          <ChevronRight size={16} color={Colors.brandGreen} />
        </button>
      </div>

      {/* ── Save city (mirrors mobile saveSection) ── */}
      <div className="mx-4 mt-2 mb-3">
        {isSaved ? (
          <div
            className="flex items-center justify-center gap-2 rounded-full border px-5 py-4"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <CheckCircle2 size={22} color={Colors.brandGreen} />
            <span className="text-[15px] font-semibold" style={{ color: colors.text }}>
              {t("screen.city_detail.saved")}
            </span>
          </div>
        ) : (
          <PrimaryButton
            label={t("screen.city_detail.save")}
            onClick={handleSave}
            loading={saving}
          />
        )}
      </div>
    </div>
  );
}
