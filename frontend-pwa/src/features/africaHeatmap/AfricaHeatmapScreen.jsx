import { useState, useMemo } from "react";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors } from "../../utils/colors.js";

// Mirror mobile's AFRICAN_CITIES slice — first 280 entries represented as
// an approximation using regional representative points.
const AFRICAN_CITIES = [
  { name: "Cairo", lat: 30.04, lon: 31.24 },
  { name: "Alexandria", lat: 31.2, lon: 29.92 },
  { name: "Khartoum", lat: 15.55, lon: 32.53 },
  { name: "Lagos", lat: 6.52, lon: 3.38 },
  { name: "Accra", lat: 5.6, lon: -0.19 },
  { name: "Dakar", lat: 14.69, lon: -17.45 },
  { name: "Abidjan", lat: 5.36, lon: -4.01 },
  { name: "Kumasi", lat: 6.69, lon: -1.62 },
  { name: "Bamako", lat: 12.65, lon: -8.0 },
  { name: "Ouagadougou", lat: 12.37, lon: -1.52 },
  { name: "Niamey", lat: 13.51, lon: 2.11 },
  { name: "Kinshasa", lat: -4.32, lon: 15.32 },
  { name: "Douala", lat: 4.05, lon: 9.77 },
  { name: "Luanda", lat: -8.84, lon: 13.23 },
  { name: "Nairobi", lat: -1.29, lon: 36.82 },
  { name: "Dar es Salaam", lat: -6.79, lon: 39.21 },
  { name: "Kampala", lat: 0.35, lon: 32.58 },
  { name: "Kigali", lat: -1.94, lon: 30.06 },
  { name: "Addis Ababa", lat: 9.02, lon: 38.75 },
  { name: "Mogadishu", lat: 2.05, lon: 45.34 },
  { name: "Johannesburg", lat: -26.2, lon: 28.05 },
  { name: "Cape Town", lat: -33.92, lon: 18.42 },
  { name: "Lusaka", lat: -15.42, lon: 28.28 },
  { name: "Harare", lat: -17.83, lon: 31.05 },
  { name: "Casablanca", lat: 33.57, lon: -7.59 },
  { name: "Tunis", lat: 36.82, lon: 10.17 },
  { name: "Tripoli", lat: 32.88, lon: 13.18 },
  { name: "Algiers", lat: 36.74, lon: 3.06 },
];

// Mirrors mobile's heatWeight()
function heatWeight(lat, lon) {
  if (lat > 22) return 0.92;
  if (lat > 8 && lon > 28) return 0.78;
  if (lat > 5 && lat < 18 && lon > -18 && lon < 25) return 0.55;
  if (lat < -5) return 0.38;
  return 0.48;
}

// Mirrors mobile's categoryFromWeight()
function categoryFromWeight(w) {
  return w >= 0.7 ? "unhealthy" : "good";
}

const FILTER_KEYS = [
  { key: "All", tKey: "screen.heatmap.filter_all" },
  { key: "Good", tKey: "screen.heatmap.filter_good" },
  { key: "Unhealthy", tKey: "screen.heatmap.filter_unhealthy" },
];

const LEGEND_STOPS = [
  { tKey: "screen.heatmap.legend_cleaner", fallback: "Cleaner", color: "#00C896" },
  { tKey: "screen.heatmap.legend_good", fallback: "Good", color: "#7DCE57" },
  { tKey: "screen.heatmap.legend_moderate", fallback: "Moderate", color: "#F5C518" },
  { tKey: "screen.heatmap.legend_sahel", fallback: "Sahel", color: "#FF8C00" },
  { tKey: "screen.heatmap.legend_unhealthy", fallback: "Unhealthy", color: "#E53935" },
];

export function AfricaHeatmapScreen({ isDark }) {
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  const [filter, setFilter] = useState("All");

  const heatMarkers = useMemo(() => {
    const base = AFRICAN_CITIES.map((city) => ({
      ...city,
      weight: heatWeight(city.lat, city.lon),
    }));
    if (filter === "All") return base;
    return base.filter((m) => {
      const cat = categoryFromWeight(m.weight);
      return filter === "Good" ? cat === "good" : cat === "unhealthy";
    });
  }, [filter]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Safe area top */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div
        className="flex items-center"
        style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6 }}
      >
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center"
          style={{ padding: 10 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </button>
        <span
          className="font-bold text-center"
          style={{ flex: 1, fontSize: 17, color: colors.text }}
        >
          {t("app.name") || "Mframapa"}
        </span>
        <button
          type="button"
          className="flex items-center justify-center"
          style={{ padding: 10 }}
          aria-label="More options"
        >
          <MoreHorizontal size={22} color={colors.subtext} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex" style={{ paddingLeft: 16, paddingRight: 16, gap: 8, marginBottom: 10 }}>
        {FILTER_KEYS.map(({ key, tKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className="transition-colors"
            style={{
              borderRadius: 999,
              paddingLeft: 18,
              paddingRight: 18,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: filter === key ? colors.text : "transparent",
              color: filter === key ? colors.bg : colors.text,
              border: filter === key ? "none" : `1px solid ${colors.border}`,
              cursor: "pointer",
            }}
          >
            {t(tKey)}
          </button>
        ))}
      </div>

      {/* Map placeholder — mirrors mobile AfricaMapView */}
      <div
        style={{
          flex: 1,
          marginLeft: 16,
          marginRight: 16,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: isDark ? "#0e1420" : "#c8d6e0",
          position: "relative",
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Dot grid representing heat markers */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 24,
            pointerEvents: "none",
          }}
        >
          {heatMarkers.map((m) => {
            const w = m.weight;
            const r = 5 + w * 7;
            const col = w >= 0.9
              ? "#E53935"
              : w >= 0.7
              ? "#FF8C00"
              : w >= 0.5
              ? "#F5C518"
              : "#00C896";
            return (
              <div
                key={m.name}
                title={m.name}
                style={{
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  backgroundColor: col,
                  opacity: 0.75,
                  boxShadow: `0 0 ${r * 2.5}px ${col}88`,
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
        <span
          className="text-[13px] font-semibold text-center"
          style={{
            color: "rgba(255,255,255,0.55)",
            zIndex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: 8,
            padding: "4px 10px",
          }}
        >
          Interactive map — requires Mapbox
        </span>
      </div>

      {/* Legend */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 14,
          gap: 8,
          marginLeft: 16,
          marginRight: 16,
          marginBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span
          className="text-[12px] font-semibold"
          style={{ color: colors.subtext }}
        >
          {t("screen.heatmap.legend_title") || "Color Legend"}
        </span>

        {/* Gradient bar */}
        <div
          style={{
            height: 14,
            borderRadius: 7,
            background: "linear-gradient(to right, #00C896, #7DCE57, #F5C518, #FF8C00, #E53935)",
            width: "100%",
          }}
        />

        {/* Labels */}
        <div className="flex justify-between">
          {LEGEND_STOPS.map(({ tKey, fallback }) => (
            <span key={tKey} className="text-[10px]" style={{ color: colors.subtext }}>
              {t(tKey) || fallback}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
