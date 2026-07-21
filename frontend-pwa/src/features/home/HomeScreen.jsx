import { Bell, ChevronDown, MapPin, Navigation, Search, AlertTriangle, Clock, Droplets, Wind, Thermometer, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { fetchCityPrediction, fetchPredictionAtCoords } from "../../services/predictionService.js";
import { MframapaLogo } from "../../components/brand/MframapaLogo.jsx";

// ── AQI helpers ───────────────────────────────────────────────────────────────

function getAQIColor(category) {
  const c = (category ?? "").toLowerCase();
  if (c === "good")                                          return "#00C896";
  if (c === "moderate")                                      return "#F5C518";
  if (c.includes("sensitive") || c === "high")               return "#FF8C00";
  if (c === "unhealthy")                                     return "#E53935";
  if (c.includes("very") || c.includes("hazardous"))        return "#9C27B0";
  return "#F5C518";
}

function aqiCategoryKey(category) {
  const c = (category ?? "").toLowerCase();
  if (c === "good")            return "aqi.good";
  if (c === "moderate")        return "aqi.moderate";
  if (c.includes("sensitive")) return "aqi.sensitive";
  if (c === "unhealthy")       return "aqi.unhealthy";
  return "aqi.hazardous";
}

// Animated count-up for the PM2.5 number
function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (target == null) { setDisplay(0); return; }
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (target - from) * p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return display;
}

// ── Screen ─────────────────────────────────────────────────────────────────

export function HomeScreen({ isOnline }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const isDark = state.preferences.theme === "dark" ||
    (state.preferences.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [loading, setLoading]     = useState(false);
  const [locating, setLocating]   = useState(false);
  const [error, setError]         = useState(null);
  const [prediction, setPrediction] = useState(null);

  const displayNum = useCountUp(prediction?.pm25 ?? null);

  const colors = {
    card:    isDark ? "#171E28" : "#FFFFFF",
    cardAlt: isDark ? "#10161F" : "#F1F5F9",
    border:  isDark ? "#25303C" : "#D4DAE3",
    text:    isDark ? "#FFFFFF" : "#0F1419",
    sub:     isDark ? "#9AA7B5" : "#5C6B7A",
    muted:   isDark ? "#647182" : "#7B8A99",
    bg:      isDark ? "#0A0D12" : "#F8FAFC",
  };

  // Auto-fetch on mount if city is known
  useEffect(() => {
    if (!isOnline) return;
    const { city, lat, lon } = state.homeSummary ?? {};
    if (!city && lat == null) { handleLocate(); return; }   // first run: ask the device
    let active = true;
    setLoading(true);
    const language = state.preferences.language ?? "en";
    const request = lat != null && lon != null
      ? fetchPredictionAtCoords(lat, lon, language)
      : fetchCityPrediction(city, language);
    request
      .then((r) => { if (active) { setPrediction(r); updateSummary(r); } })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, state.homeSummary?.city, state.preferences.language]);

  function updateSummary(r) {
    dispatch({
      type: "SET_HOME_SUMMARY",
      payload: {
        city: r.city?.name,
        lat: r.city?.lat,
        lon: r.city?.lon,
        pm25: r.pm25,
        aqiCategory: r.category,
        degraded: r.degraded,
        lastUpdated: r.timestamp,
      },
    });
  }

  function handleLocate() {
    if (!navigator.geolocation) { setError(t("error.geolocation_unsupported")); return; }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;
          setLoading(true);
          // fetchCityPrediction only ever accepted (name, language): the extra
          // coordinates were silently dropped and the coordinate string was then
          // looked up as a city name, which always failed. that is why granting
          // location changed nothing and the default city stayed on screen.
          const r = await fetchPredictionAtCoords(latitude, longitude, state.preferences.language ?? "en");
          setPrediction(r);
          updateSummary(r);
        } catch {
          setError(t("error.generic"));
        } finally {
          setLocating(false);
          setLoading(false);
        }
      },
      () => { setLocating(false); setError(t("pwa.core.location_permission")); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  const pred = prediction;
  const aqiColor = pred ? getAQIColor(pred.aqi_category ?? pred.category) : "#00C896";
  const unreadCount = state.notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="flex flex-col pb-36 min-h-[100dvh]" style={{ backgroundColor: colors.bg }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3">
          <MframapaLogo size="sm" isDark={isDark} markOnly />
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "notifications" })}
            className="relative p-1"
          >
            <Bell size={22} color={colors.text} />
            {unreadCount > 0 && (
              <span
                className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: "#E53935" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Location chip ── */}
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "search" })}
          className="mx-4 mb-3 flex items-center gap-1.5 self-start rounded-full border px-3 py-2"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <MapPin size={14} color="#00C896" />
          <span className="text-sm font-semibold" style={{ color: colors.text }}>
            {pred?.city?.name ?? state.homeSummary?.city ?? t("home.select_city")}
          </span>
          <ChevronDown size={14} color={colors.sub} />
        </button>

        {/* ── Offline banner ── */}
        {!isOnline && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border px-3 py-2.5"
            style={{ backgroundColor: "#F5C51818", borderColor: "#F5C51840", color: "#F5C518" }}>
            <AlertTriangle size={15} />
            <span className="text-sm font-medium">{t("pwa.home.offline_banner") ?? "Offline — showing cached data"}</span>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border px-3 py-3"
            style={{ backgroundColor: "#E5393518", borderColor: "#E5393540", color: "#E53935" }}>
            <AlertTriangle size={16} />
            <span className="flex-1 text-sm font-medium">{error}</span>
          </div>
        )}

        {/* ── AQI Hero card ── */}
        <div className="mx-4 mb-3">
          <button
            type="button"
            disabled={!pred}
            onClick={() => pred && dispatch({ type: "SET_ACTIVE_SCREEN", payload: "core" })}
            className="relative w-full rounded-[20px] border p-5 text-left"
            style={{
              backgroundColor: pred ? aqiColor + (isDark ? "22" : "14") : colors.card,
              borderColor:     pred ? aqiColor + (isDark ? "45" : "40") : colors.border,
              minHeight: 160,
            }}
          >
            {/* PM2.5 label */}
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: colors.sub }}>
              {t("card.pm25_label") ?? "PM2.5"}
            </p>

            {/* Big number + badge */}
            <div className="my-2 flex items-center gap-3">
              <span className="font-black leading-none" style={{ fontSize: 56, color: colors.text }}>
                {pred ? (loading ? "…" : displayNum) : "--"}
              </span>
              {pred && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: aqiColor + "28", color: aqiColor }}
                >
                  {t(aqiCategoryKey(pred.aqi_category ?? pred.category))}
                </span>
              )}
            </div>

            {/* Location + time stamp */}
            <p className="text-xs" style={{ color: colors.sub }}>
              {pred
                ? `${pred.city?.name ?? ""} | ${t("card.today") ?? "Today"}, ${new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
                : t("home.tap_check") ?? "Tap Check to get started"}
            </p>

            {pred && (
              <ChevronRight
                size={18}
                color={colors.sub}
                style={{ position: "absolute", top: 20, right: 16 }}
              />
            )}
          </button>
        </div>

        {/* ── Stat row ── */}
        {pred && (
          <div className="mx-4 mb-3 flex gap-2.5">
            {[
              { label: t("card.aqi_level") ?? "AQI Level", value: pred.pm25.toFixed(0), sub: t(aqiCategoryKey(pred.aqi_category ?? pred.category)), subColor: aqiColor },
              { label: t("card.main_pollutant") ?? "Main Pollutant", value: "PM2.5", sub: `${t("card.unit") ?? "µg/m³"}` },
            ].map((s, i) => (
              <div key={i} className="flex-1 rounded-2xl border p-3.5"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.5px]" style={{ color: colors.sub }}>{s.label}</p>
                <p className="text-[22px] font-black" style={{ color: colors.text }}>{s.value}</p>
                <p className="text-xs font-medium" style={{ color: s.subColor ?? colors.sub }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Action tiles ── */}
        <div className="mx-4 mb-3 flex gap-2.5">
          {[
            {
              icon: Navigation,
              label: locating ? "…" : (t("home.action_check") ?? "Check"),
              action: handleLocate,
              loading: loading || locating,
              color: "#00C896",
            },
            {
              icon: Search,
              label: t("tab.search") ?? "Search",
              action: () => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "search" }),
              loading: false,
              color: "#00C896",
            },
            {
              icon: Bell,
              label: t("tab.alerts") ?? "Alerts",
              action: () => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "notifications" }),
              loading: false,
              color: "#00C896",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={item.action}
                disabled={item.loading}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border py-4 active:opacity-70 disabled:opacity-50"
                style={{ backgroundColor: colors.card, borderColor: colors.border, minHeight: 80 }}
              >
                {item.loading
                  ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-app-green border-t-transparent" />
                  : <Icon size={24} color={item.color} />
                }
                <span className="text-[10px] font-bold uppercase tracking-[0.5px]" style={{ color: colors.text }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Weather strip (when available) ── */}
        {pred?.weather && (
          <div className="mx-4 mb-3 flex gap-2.5">
            {[
              pred.weather.humidity != null && { icon: Droplets, value: `${Math.round(pred.weather.humidity)}%`, label: t("weather.humidity") },
              pred.weather.wind     != null && { icon: Wind,     value: `${pred.weather.wind.toFixed(1)} m/s`, label: t("weather.wind") },
              pred.weather.temp     != null && { icon: Thermometer, value: `${Math.round(pred.weather.temp)}°C`, label: t("weather.temp") },
            ].filter(Boolean).map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1 rounded-2xl p-3.5"
                  style={{ backgroundColor: colors.card }}>
                  <Icon size={20} color="#00C896" />
                  <p className="text-[18px] font-bold" style={{ color: colors.text }}>{w.value}</p>
                  <p className="text-xs" style={{ color: colors.sub }}>{w.label}</p>
                </div>
              );
            })}
          </div>
        )}


    </div>
  );
}
