import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { getColors, Colors, getAQIColor } from "../../utils/colors.js";
import { MframapaLogo } from "../../components/brand/MframapaLogo.jsx";
import { getMapHistory } from "../../services/api.js";
import { MapBoundary } from "../../components/map/MapBoundary.jsx";

const MapCanvas = lazy(() =>
  import("../core/MapCanvas.jsx").then((m) => ({ default: m.MapCanvas }))
);

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/** how far back we replay. the api caps this to what the archives can rebuild. */
const HISTORY_DAYS = 14;
/** one frame per day, slow enough to read the date as it changes. */
const FRAME_MS = 700;

function formatPlaybackDate(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function HistoricalPlaybackScreen({ isDark }) {
  const { t, language } = useTranslation();
  const { goBack, navigate } = useNavigation();
  const colors = getColors(isDark ?? true);
  const locale = language === "en" ? undefined : language;

  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [cities, setCities] = useState([]);   // each with its own day rows
  const [dates, setDates] = useState([]);     // shared timeline
  const [loading, setLoading] = useState(true);
  // stored as a key, not a sentence, so it re-renders in the current language
  const [errorKey, setErrorKey] = useState(null);

  const frameRef = useRef(0);
  const playingRef = useRef(false);
  useEffect(() => { frameRef.current = frame; });
  useEffect(() => { playingRef.current = playing; });

  const [viewState, setViewState] = useState({
    longitude: 17, latitude: 3, zoom: 2.4,
  });

  const load = useCallback(() => {
    setLoading(true);
    setErrorKey(null);
    getMapHistory(HISTORY_DAYS)
      .then((payload) => {
        const cities = payload.cities ?? [];
        setCities(cities);
        setDates(payload.dates ?? []);
        setFrame(Math.max(0, (payload.dates ?? []).length - 1));   // open on today
        if (cities.length === 0) setErrorKey("screen.historical.empty");
      })
      .catch(() => setErrorKey("screen.historical.load_failed"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const markers = useMemo(() => {
    const day = dates[frame];
    if (!day) return [];
    return cities.flatMap((city) => {
      const row = city.days.find((d) => d.date === day);
      if (!row) return [];                 // a day we could not rebuild shows no dot
      return [{
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        color: getAQIColor(row.aqi_category),
        size: Math.max(10, Math.min(34, 10 + row.pm25 * 0.35)),
        label: `${city.name} — ${Math.round(row.pm25)} µg/m³`,
      }];
    });
  }, [cities, dates, frame]);

  useEffect(() => {
    if (!playing || dates.length === 0) return;
    const interval = setInterval(() => {
      const next = frameRef.current + 1;
      if (next >= dates.length) {
        setPlaying(false);
        return;
      }
      frameRef.current = next;
      setFrame(next);
    }, FRAME_MS);
    return () => clearInterval(interval);
  }, [playing, dates.length]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) { setPlaying(false); return; }
    if (frameRef.current >= dates.length - 1) setFrame(0);   // replay from the start
    setPlaying(true);
  }, [dates.length]);

  function handleScrubberInput(e) {
    setFrame(parseInt(e.target.value, 10));
    if (playingRef.current) setPlaying(false);
  }

  const lastIndex = Math.max(0, dates.length - 1);
  const progress = lastIndex === 0 ? 1 : frame / lastIndex;
  const displayDate = dates[frame] ? formatPlaybackDate(dates[frame], locale) : "—";

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      <div
        className="flex items-center justify-between"
        style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, zIndex: 2 }}
      >
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
          style={{ width: 36, height: 36 }}
          aria-label="Go back"
        >
          <ArrowLeft size={22} color={colors.text} />
        </button>

        <MframapaLogo size="sm" />

        <div style={{ width: 36 }} />
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          backgroundColor: colors.surface,
          minHeight: 260,
          overflow: "hidden",
        }}
      >
        {errorKey ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[14px] m-0" style={{ color: colors.subtext }}>{t(errorKey)}</p>
            <button
              type="button" onClick={load}
              className="px-4 py-2 rounded-full text-[13px] font-semibold"
              style={{ backgroundColor: Colors.brandGreen, color: "#00110B" }}
            >
              {t("common.try_again")}
            </button>
          </div>
        ) : !MAPBOX_TOKEN ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-[13px] m-0" style={{ color: colors.subtext }}>
              {t("map.unavailable")}
            </p>
          </div>
        ) : (
          <MapBoundary fallback={(retry) => (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-[14px] m-0" style={{ color: colors.subtext }}>{t("map.load_failed")}</p>
                <button
                  type="button" onClick={retry}
                  className="px-4 py-2 rounded-full text-[13px] font-semibold"
                  style={{ backgroundColor: "#00C896", color: "#00110B" }}
                >
                  {t("common.try_again")}
                </button>
              </div>
            )}>
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <p className="text-[13px] m-0" style={{ color: colors.subtext }}>{t("map.loading")}…</p>
            </div>
          }>
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
          </MapBoundary>
        )}
      </div>

      <div
        style={{
          backgroundColor: isDark ? "#171E28" : "#ffffff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 20,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          gap: 12,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p
          className="font-extrabold text-center"
          style={{ fontSize: 24, color: colors.text, margin: 0 }}
        >
          {loading ? `${t("screen.historical.loading")}…` : displayDate}
        </p>

        <div style={{ width: "100%", paddingTop: 14, paddingBottom: 14 }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.border,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: 6,
                width: `${progress * 100}%`,
                backgroundColor: Colors.brandGreen,
                borderRadius: 3,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: `${progress * 100}%`,
                transform: "translate(-50%, -50%)",
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "#fff",
                border: `2px solid ${Colors.brandGreen}`,
                pointerEvents: "none",
              }}
            />
            <input
              type="range"
              min="0"
              max={lastIndex}
              step="1"
              value={frame}
              onChange={handleScrubberInput}
              disabled={dates.length === 0}
              aria-label={t("screen.historical.scrubber") || "Timeline position"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
                margin: 0,
              }}
            />
          </div>
        </div>

        <div className="flex justify-between" style={{ width: "100%" }}>
          <span className="text-[12px]" style={{ color: colors.subtext }}>
            {dates[0] ? formatPlaybackDate(dates[0], locale) : ""}
          </span>
          <span className="text-[12px]" style={{ color: colors.subtext }}>
            {dates[lastIndex] ? formatPlaybackDate(dates[lastIndex], locale) : ""}
          </span>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          disabled={dates.length === 0}
          className="flex items-center justify-center transition-transform active:scale-90"
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.brandGreen,
            border: "none",
            cursor: dates.length === 0 ? "default" : "pointer",
            opacity: dates.length === 0 ? 0.5 : 1,
          }}
          aria-label={playing ? t("screen.historical.pause") : t("screen.historical.play")}
        >
          {playing ? (
            <Pause size={28} color="#fff" fill="#fff" />
          ) : (
            <Play size={28} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
          )}
        </button>
      </div>
    </div>
  );
}
