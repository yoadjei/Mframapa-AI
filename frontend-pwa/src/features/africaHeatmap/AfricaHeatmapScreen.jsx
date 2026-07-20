import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, getAQIColor } from "../../utils/colors.js";
import { getMapSummary } from "../../services/api.js";

// real mapbox canvas, shared with the map tab (lazy: mapbox-gl is a large chunk)
const MapCanvas = lazy(() =>
  import("../core/MapCanvas.jsx").then((m) => ({ default: m.MapCanvas }))
);

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

const FILTER_KEYS = [
  { key: "All", tKey: "screen.heatmap.filter_all" },
  { key: "Good", tKey: "screen.heatmap.filter_good" },
  { key: "Unhealthy", tKey: "screen.heatmap.filter_unhealthy" },
];

const LEGEND_STOPS = [
  { label: "Good", color: getAQIColor("good") },
  { label: "Moderate", color: getAQIColor("moderate") },
  { label: "Sensitive", color: getAQIColor("sensitive") },
  { label: "Unhealthy", color: getAQIColor("unhealthy") },
  { label: "Hazardous", color: getAQIColor("hazardous") },
];

// bigger dot = worse air, so severity reads at a glance on a continental view.
function dotSize(pm25) {
  if (pm25 >= 150) return 26;
  if (pm25 >= 55) return 22;
  if (pm25 >= 35) return 18;
  if (pm25 >= 12) return 15;
  return 12;
}

function isUnhealthy(category) {
  const c = (category ?? "").toLowerCase();
  return c.includes("unhealthy") || c.includes("hazardous");
}

export function AfricaHeatmapScreen({ isDark }) {
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  const [filter, setFilter] = useState("All");
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewState, setViewState] = useState({ longitude: 18, latitude: 3, zoom: 2.2 });

  async function load() {
    setLoading(true); setError("");
    try {
      setCities(await getMapSummary());
    } catch (e) {
      setError(e?.message ?? "Could not load the map");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const markers = useMemo(() => {
    const filtered = cities.filter((c) => {
      if (filter === "Unhealthy") return isUnhealthy(c.aqi_category);
      if (filter === "Good") return !isUnhealthy(c.aqi_category);
      return true;
    });
    return filtered.map((c) => ({
      name: c.name,
      lat: c.lat,
      lon: c.lon,
      color: getAQIColor(c.aqi_category),
      size: dotSize(c.pm25),
      label: `${c.name}: ${Math.round(c.pm25)} µg/m³`,
      pm25: c.pm25,
      aqi_category: c.aqi_category,
    }));
  }, [cities, filter]);

  const worst = useMemo(
    () => [...cities].sort((a, b) => b.pm25 - a.pm25).slice(0, 3),
    [cities]
  );

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: colors.bg }}>
      {/* header */}
      <div className="flex items-center gap-2 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 56px)" }}>
        <button type="button" onClick={goBack} aria-label="Back" className="sr-only">
          <ChevronLeft size={20} color={colors.text} />
        </button>
        <div className="flex-1">
          <p className="text-[20px] font-bold m-0" style={{ color: colors.text }}>
            {t("screen.heatmap.title")}
          </p>
          <p className="text-[13px] m-0" style={{ color: colors.subtext }}>
            {loading ? "Loading today's readings…" : `${cities.length} cities · today`}
          </p>
        </div>
        <button
          type="button" onClick={load} aria-label="Refresh"
          className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-60"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <RefreshCw size={16} color={colors.subtext} />
        </button>
      </div>

      {/* filters */}
      <div className="flex gap-2 px-4 mt-3">
        {FILTER_KEYS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-[13px] font-semibold active:opacity-70"
              style={{
                backgroundColor: active ? "#00C896" : colors.surface,
                color: active ? "#00110B" : colors.subtext,
                border: `1px solid ${active ? "#00C896" : colors.border}`,
              }}
            >
              {t(f.tKey)}
            </button>
          );
        })}
      </div>

      {/* map */}
      <div
        className="mx-4 mt-3 rounded-2xl overflow-hidden relative"
        style={{ flex: 1, minHeight: 340, border: `1px solid ${colors.border}`, backgroundColor: colors.surface }}
      >
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[14px] m-0" style={{ color: colors.subtext }}>{error}</p>
            <button
              type="button" onClick={load}
              className="px-4 py-2 rounded-full text-[13px] font-semibold"
              style={{ backgroundColor: "#00C896", color: "#00110B" }}
            >
              Try again
            </button>
          </div>
        ) : !MAPBOX_TOKEN ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-[13px] m-0" style={{ color: colors.subtext }}>
              Map unavailable on this build.
            </p>
          </div>
        ) : (
          <Suspense fallback={<div className="absolute inset-0" style={{ backgroundColor: colors.surface }} />}>
            <MapCanvas
              viewState={viewState}
              onMove={(e) => setViewState(e.viewState)}
              mapboxToken={MAPBOX_TOKEN}
              isDark={isDark ?? true}
              cities={markers}
              onMarkerClick={(city) =>
                navigate("cityDetail", { city: { name: city.name, lat: city.lat, lon: city.lon } })
              }
            />
          </Suspense>
        )}
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 mt-3">
        {LEGEND_STOPS.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[12px]" style={{ color: colors.subtext }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* highest readings today — the actionable part of a continental view */}
      {worst.length > 0 && (
        <div className="px-4 mt-4 mb-6">
          <p className="text-[13px] font-semibold mb-2" style={{ color: colors.subtext }}>
            Highest today
          </p>
          <div className="flex flex-col gap-2">
            {worst.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => navigate("cityDetail", { city: { name: c.name, lat: c.lat, lon: c.lon } })}
                className="flex items-center justify-between rounded-xl px-4 py-3 active:opacity-70"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <span className="flex items-center gap-2 text-[14px] font-medium" style={{ color: colors.text }}>
                  <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getAQIColor(c.aqi_category) }} />
                  {c.name}
                </span>
                <span className="text-[14px] font-semibold" style={{ color: getAQIColor(c.aqi_category) }}>
                  {Math.round(c.pm25)} µg/m³
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
