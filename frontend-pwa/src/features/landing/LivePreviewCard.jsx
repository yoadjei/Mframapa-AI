import { useEffect, useState } from "react";
import { MapPin, TrendingUp } from "lucide-react";
import { getColors, getAQIColor, aqiSymbol } from "../../utils/colors.js";
import { aqiCategoryKey } from "../../utils/i18nHelpers.js";
import { getPrediction, getHistory } from "../../services/api.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useAppState } from "../../state/appState.jsx";

// a real city to show the product with, not a mock. everything on this card is
// fetched live from the same endpoints the app uses, so the landing page can
// never promise something the product does not do.
const SHOWCASE = { name: "Accra", lat: 5.6, lon: -0.19 };

function Sparkline({ values, color }) {
  if (!values || values.length < 2) return null;
  const w = 240;
  const h = 56;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - ((v - min) / span) * (h - 8) - 4]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id="mf-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#mf-spark)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LivePreviewCard({ isDark = true }) {
  const { t } = useTranslation();
  const colors = getColors(isDark);
  const { state } = useAppState();
  const [pred, setPred] = useState(null);
  const [trend, setTrend] = useState([]);

  // the visitor's own place when we know it, otherwise the showcase city
  const home = state.homeSummary ?? {};
  const place =
    home.lat != null && home.lon != null && home.city
      ? { name: home.city, lat: home.lat, lon: home.lon }
      : SHOWCASE;

  useEffect(() => {
    let active = true;
    getPrediction(place.lat, place.lon, place.name)
      .then((p) => { if (active) setPred(p); })
      .catch(() => {});
    getHistory(place.lat, place.lon, place.name, 7)
      .then((days) => { if (active) setTrend(days.map((d) => Math.round(d.pm25))); })
      .catch(() => {});
    return () => { active = false; };
  }, [place.name, place.lat, place.lon]);

  const category = pred?.aqi_category ?? pred?.category;
  const color = getAQIColor(category, isDark);
  const unc = pred?.uncertainty;

  return (
    <div
      className="mf-glass"
      style={{
        borderRadius: 20,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
      }}
      aria-label={t("landing.preview.aria")}
    >
      {/* header: city + live reading */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={15} color={colors.subtext} aria-hidden="true" />
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: colors.text }}>{place.name}</span>
        </div>
        <span style={{ fontSize: "0.6875rem", color: colors.muted }}>{t("landing.preview.label")}</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <span style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1, color: colors.text }}>
          {pred ? Math.round(pred.pm25) : "—"}
        </span>
        <div style={{ paddingBottom: 6 }}>
          <span style={{ fontSize: "0.6875rem", color: colors.muted, display: "block" }}>{t("card.unit")}</span>
          {category && (
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color }}>
              <span aria-hidden="true" style={{ marginRight: 4 }}>{aqiSymbol(category)}</span>
              {t(aqiCategoryKey(category))}
            </span>
          )}
        </div>
      </div>

      {/* confidence range — our differentiator, and honest */}
      {unc && (
        <p style={{ fontSize: "0.75rem", lineHeight: 1.5, color: colors.subtext, margin: 0 }}>
          {t("landing.preview.confidence", {
            low: Math.max(0, Math.round(unc.pm25_lower ?? 0)),
            high: Math.round(unc.pm25_upper ?? 0),
          })}
        </p>
      )}

      {/* real 7-day trend */}
      {trend.length > 1 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <TrendingUp size={13} color={colors.subtext} aria-hidden="true" />
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: colors.subtext }}>
              {t("landing.preview.trend")}
            </span>
          </div>
          <Sparkline values={trend} color={color} />
        </div>
      )}
    </div>
  );
}
