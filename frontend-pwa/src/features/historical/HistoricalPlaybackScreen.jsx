import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ArrowLeft, Info, Play, Pause } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { getColors, Colors, getAQIColor } from "../../utils/colors.js";
import { MframapaLogo } from "../../components/brand/MframapaLogo.jsx";

const PLAYBACK_CITIES = [
  { name: "Accra", lat: 5.6, lon: -0.2 },
  { name: "Lagos", lat: 6.5, lon: 3.4 },
  { name: "Cairo", lat: 30.1, lon: 31.2 },
  { name: "Nairobi", lat: -1.3, lon: 36.8 },
  { name: "Kinshasa", lat: -4.3, lon: 15.3 },
];

const AQI_CATEGORIES = [
  "good",
  "moderate",
  "unhealthy for sensitive groups",
  "unhealthy",
  "very unhealthy",
];

const RANGE_START = new Date(2024, 0, 1);
const PLAYBACK_DURATION_MS = 14_000;
const TICK_MS = 80;
/** Map marker updates are stepped to limit redraws during playback. */
const MARKER_STEPS = 36;

function endOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

function categoryAtProgress(cityIndex, progress) {
  const phase = cityIndex * 1.73 + 0.4;
  const wave =
    Math.sin(progress * Math.PI * 5 + phase) * 0.45 +
    Math.cos(progress * Math.PI * 2.3 + phase * 0.6) * 0.35;
  const normalized = (wave + 1) / 2;
  const idx = Math.min(
    AQI_CATEGORIES.length - 1,
    Math.floor(normalized * AQI_CATEGORIES.length)
  );
  return AQI_CATEGORIES[idx];
}

function dateAtProgress(progress, rangeEnd) {
  const t = RANGE_START.getTime() + progress * (rangeEnd.getTime() - RANGE_START.getTime());
  return new Date(t);
}

function formatPlaybackDate(date, locale) {
  return date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function HistoricalPlaybackScreen({ isDark }) {
  const { t, language } = useTranslation();
  const { goBack } = useNavigation();
  const colors = getColors(isDark ?? true);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const playingRef = useRef(false);

  // Keep refs in sync outside of render (avoids lint rule: no ref access during render)
  useEffect(() => { progressRef.current = progress; });
  useEffect(() => { playingRef.current = playing; });

  const locale = language === "en" ? undefined : language;
  const rangeEnd = useMemo(() => endOfToday(), []);

  const displayDate = useMemo(
    () => formatPlaybackDate(dateAtProgress(progress, rangeEnd), locale),
    [progress, locale, rangeEnd]
  );

  const markerProgress = useMemo(
    () => Math.round(progress * MARKER_STEPS) / MARKER_STEPS,
    [progress]
  );

  const markers = useMemo(
    () =>
      PLAYBACK_CITIES.map((city, i) => {
        const category = categoryAtProgress(i, markerProgress);
        return {
          name: city.name,
          lat: city.lat,
          lon: city.lon,
          color: getAQIColor(category),
          weight: 0.25 + markerProgress * 0.5,
        };
      }),
    [markerProgress]
  );

  const seekTo = useCallback((next) => {
    const clamped = Math.max(0, Math.min(1, next));
    progressRef.current = clamped;
    setProgress(clamped);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      const next = progressRef.current + TICK_MS / PLAYBACK_DURATION_MS;
      if (next >= 1) {
        progressRef.current = 1;
        setProgress(1);
        setPlaying(false);
        return;
      }
      progressRef.current = next;
      setProgress(next);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [playing]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) {
      setPlaying(false);
      return;
    }
    if (progressRef.current >= 1) seekTo(0);
    setPlaying(true);
  }, [seekTo]);

  const rangeStartLabel = useMemo(
    () => RANGE_START.toLocaleDateString(locale, { month: "short", year: "numeric" }),
    [locale]
  );
  const rangeEndLabel = useMemo(
    () => rangeEnd.toLocaleDateString(locale, { month: "short", year: "numeric" }),
    [locale, rangeEnd]
  );

  function handleScrubberInput(e) {
    const val = parseFloat(e.target.value);
    seekTo(val);
    if (playingRef.current) setPlaying(false);
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Safe area top */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header — back arrow left, logo centred, info icon right */}
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

        <button
          type="button"
          className="flex items-center justify-end"
          style={{ width: 36 }}
          aria-label={t("screen.historical.info") || "About historical playback"}
        >
          <Info size={22} color={colors.text} />
        </button>
      </div>

      {/* Map area — mirrors mobile's flex:1 AfricaMapView area */}
      <div
        style={{
          flex: 1,
          position: "relative",
          backgroundColor: isDark ? "#0e1420" : "#c8d6e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          minHeight: 260,
          overflow: "hidden",
        }}
      >
        {/* Animated marker dots — step-updated to match MARKER_STEPS */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: 32,
            pointerEvents: "none",
          }}
        >
          {markers.map((m) => {
            const r = 8 + m.weight * 10;
            return (
              <div
                key={m.name}
                title={m.name}
                style={{
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  backgroundColor: m.color,
                  opacity: 0.8,
                  boxShadow: `0 0 ${r * 2.5}px ${m.color}99`,
                  transition: "background-color 0.2s, box-shadow 0.2s",
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
        {/* Map overlay label */}
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

      {/* Bottom panel — mirrors mobile's bottomPanel */}
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
        {/* Date display */}
        <p
          className="font-extrabold text-center"
          style={{ fontSize: 24, color: colors.text, margin: 0 }}
        >
          {displayDate}
        </p>

        {/* Scrubber — custom styled range input */}
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
            {/* Fill */}
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
            {/* Thumb — positioned via absolute left */}
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
            {/* Invisible range input on top for interaction */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={progress}
              onChange={handleScrubberInput}
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

        {/* Range labels */}
        <div className="flex justify-between" style={{ width: "100%" }}>
          <span className="text-[12px]" style={{ color: colors.subtext }}>
            {rangeStartLabel}
          </span>
          <span className="text-[12px]" style={{ color: colors.subtext }}>
            {rangeEndLabel}
          </span>
        </div>

        {/* Play/Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center transition-transform active:scale-90"
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.brandGreen,
            border: "none",
            cursor: "pointer",
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
