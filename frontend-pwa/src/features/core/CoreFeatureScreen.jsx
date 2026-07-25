import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Minus, Navigation, Plus, Search, X } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getPrediction, generateInsight, getMapSummary } from "../../services/api.js";
import { useCityPack } from "../../hooks/useCityPack.js";
import { getColors, Colors, getAQIColor } from "../../utils/colors.js";

/** a city we have no reading for: visibly not a judgement about its air. */
const UNKNOWN_DOT = "#64748B";
import { aqiCategoryKey } from "../../utils/i18nHelpers.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";
const MapCanvas = lazy(() =>
  import("./MapCanvas.jsx").then((m) => ({ default: m.MapCanvas }))
);

const INITIAL_VIEW = {
  longitude: 17.5,
  latitude: 4.5,
  zoom: 2.2,
  pitch: 22,
  bearing: 0,
};

const AFRICA_BOUNDS = { minLat: -38, maxLat: 38.5, minLon: -26, maxLon: 60 };

function isInAfrica(lat, lon) {
  return (
    lat >= AFRICA_BOUNDS.minLat &&
    lat <= AFRICA_BOUNDS.maxLat &&
    lon >= AFRICA_BOUNDS.minLon &&
    lon <= AFRICA_BOUNDS.maxLon
  );
}

function squaredDist(lat1, lon1, lat2, lon2) {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return dLat * dLat + dLon * dLon;
}

function nearestCity(lat, lon, cities) {
  if (!cities.length) return null;
  let best = cities[0];
  let min = Infinity;
  for (const c of cities) {
    const d = squaredDist(lat, lon, c.lat, c.lon);
    if (d < min) { min = d; best = c; }
  }
  return best;
}

async function fetchFullPrediction(city, language) {
  const response = await getPrediction(city.lat, city.lon, city.name);
  let insight;
  try {
    insight = await generateInsight({
      pm25: response.pm25,
      aqi_category: response.aqi_category,
      weather: response.weather ?? {},
      language: language ?? "en",
    });
  } catch {
    insight = undefined;
  }
  return {
    city: { name: city.name, lat: city.lat, lon: city.lon, country: city.country },
    pm25: response.pm25,
    category: response.aqi_category,
    timestamp: response.timestamp || new Date().toISOString(),
    weather: response.weather ?? null,
    factors: response.factors ?? null,
    uncertainty: response.uncertainty ?? null,
    model: response.model ?? null,
    insight,
  };
}

export function CoreFeatureScreen({ isOnline, isDark }) {
  const { state, dispatch } = useAppState();
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark);
  const language = state.preferences?.language ?? "en";

  const { cities, loading: cityPackLoading } = useCityPack(isOnline);

  // the city pack carries no air quality, so every marker fell through to the
  // default green dot. green means "good" in our own legend, so the map was
  // telling people the whole continent was fine. readings are merged in here,
  // and a city we have no reading for is drawn neutral rather than green.
  const [summary, setSummary] = useState([]);
  useEffect(() => {
    let active = true;
    getMapSummary().then((rows) => { if (active) setSummary(rows); }).catch(() => {});
    return () => { active = false; };
  }, []);

  // colour every city we have a reading for; the summary covers all 55 countries
  // so none is a blank space. offline cities without a reading fill in neutral.
  const mapCities = useMemo(() => {
    const named = new Set(summary.map((r) => r.name.toLowerCase()));
    const coloured = summary.map((r) => ({
      name: r.name,
      lat: r.lat,
      lon: r.lon,
      color: getAQIColor(r.aqi_category, isDark),
      size: r.pm25 >= 55 ? 20 : r.pm25 >= 35 ? 17 : 14,
      label: `${r.name}: ${Math.round(r.pm25)} µg/m³`,
      hasReading: true,
    }));
    const neutral = cities
      .filter((c) => !named.has(String(c.name).toLowerCase()))
      .map((city) => ({
        ...city,
        color: UNKNOWN_DOT,
        size: 9,
        label: city.name,
        hasReading: false,
      }));
    // Coloured AQI readings first — neutrals-first + MapCanvas slice used to
    // drop every map-summary city and leave whole countries blank.
    return [...coloured, ...neutral];
  }, [cities, summary, isDark]);

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const fetchGen = useRef(0);
  const suggestionGen = useRef(0);

  // ── Search suggestions (offline-instant, matches mobile behaviour) ──────────
  useMemo(() => {
    const text = search.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    // Instant offline matches
    const q = text.toLowerCase();
    const offline = cities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.country ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map((c) => ({
        id: `offline-${c.name}-${c.lat}-${c.lon}`,
        placeName: c.country ? `${c.name}, ${c.country}` : c.name,
        lat: c.lat,
        lon: c.lon,
        country: c.country,
        name: c.name,
      }));
    setSuggestions(offline);

    // Debounced enrichment placeholder (≥3 chars): kept for future Mapbox integration
    if (text.length < 3) return;
    const gen = ++suggestionGen.current;
    const timer = setTimeout(() => {
      if (gen !== suggestionGen.current) return;
      // Mapbox enrichment would merge here when a token is available
    }, 300);

    return () => clearTimeout(timer);
  }, [search, cities]);

  async function loadPredictionAndNavigate(city) {
    const gen = ++fetchGen.current;
    setLoading(true);
    setError("");
    try {
      const prediction = await fetchFullPrediction(city, language);
      if (gen !== fetchGen.current) return;

      dispatch({ type: "SELECT_CITY", payload: prediction.city });
      dispatch({
        type: "SET_HOME_SUMMARY",
        payload: {
          city: city.name,
          pm25: prediction.pm25,
          aqiCategory: prediction.category,
        },
      });
      dispatch({
        type: "ADD_ACTIVITY",
        payload: {
          id: crypto.randomUUID(),
          type: "prediction",
          cityName: city.name,
          pm25: prediction.pm25,
          category: prediction.category,
          message: `Checked ${city.name}: ${Math.round(prediction.pm25)} μg/m³`,
          createdAt: prediction.timestamp,
        },
      });
      if (state.preferences?.notificationsEnabled) {
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            id: crypto.randomUUID(),
            type: "update",
            title: `${city.name} air quality`,
            subtitle: `PM2.5 ${Math.round(prediction.pm25)} μg/m³ — ${t(aqiCategoryKey(prediction.category))}`,
            message: `PM2.5 ${Math.round(prediction.pm25)} μg/m³ — ${t(aqiCategoryKey(prediction.category))}`,
            read: false,
            createdAt: prediction.timestamp,
          },
        });
      }

      // Fly map to the city
      setViewState((prev) => ({
        ...prev,
        longitude: city.lon,
        latitude: city.lat,
        zoom: 10,
        pitch: 40,
      }));

      navigate("cityDetail", { city: prediction.city, prediction });
    } catch {
      if (gen === fetchGen.current) {
        setError(t("error.prediction"));
      }
    } finally {
      if (gen === fetchGen.current) setLoading(false);
    }
  }

  function selectSuggestion(s) {
    setSearch("");
    setSearchFocused(false);
    setSuggestions([]);
    loadPredictionAndNavigate({
      name: s.name ?? s.placeName.split(",")[0]?.trim() ?? s.placeName,
      lat: s.lat,
      lon: s.lon,
      country: s.country,
    });
  }

  function handleMapPress(event) {
    if (!event?.lngLat) return;
    const lat = event.lngLat.lat;
    const lon = event.lngLat.lng;
    if (!isInAfrica(lat, lon)) { setError(t("error.outside_africa")); return; }
    try {
      const waterFeatures = event.target.queryRenderedFeatures(event.point, { layers: ["water"] });
      if (waterFeatures && waterFeatures.length > 0) {
        setError(t("error.water_only"));
        return;
      }
    } catch {
      // Map may not be fully loaded yet — proceed
    }
    const city = nearestCity(lat, lon, cities);
    if (city) loadPredictionAndNavigate(city);
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setError(t("error.location"));
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        if (!isInAfrica(latitude, longitude)) {
          setError(t("error.outside_africa"));
          return;
        }
        setViewState((prev) => ({ ...prev, longitude, latitude, zoom: 13, pitch: 45 }));
        if (isOnline) {
          const city = nearestCity(latitude, longitude, cities);
          if (city) loadPredictionAndNavigate(city);
        }
      },
      () => {
        setLocating(false);
        setError(t("error.location"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }

  const chromeBg = isDark ? colors.card : "#ffffff";
  const chromeShadow = "0 2px 12px rgba(0,0,0,0.18)";

  // ── No Mapbox token fallback: city list ──────────────────────────────────────
  if (!MAPBOX_TOKEN) {
    return (
      <NoCityListFallback
        cities={cities}
        loading={cityPackLoading || loading}
        onSelectCity={loadPredictionAndNavigate}
        colors={colors}
        isDark={isDark}
        t={t}
        error={error}
      />
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Map canvas fills the full screen */}
      <div className="h-full w-full">
        <Suspense
          fallback={
            <div
              className="h-full w-full animate-pulse"
              style={{ backgroundColor: colors.card }}
            />
          }
        >
          <MapCanvas
            viewState={viewState}
            onMove={(e) => setViewState(e.viewState)}
            onMapClick={handleMapPress}
            mapboxToken={MAPBOX_TOKEN}
            isDark={isDark}
            cities={mapCities}
            selectedCity={null}
            liteMode={state.preferences?.liteMode ?? false}
          />
        </Suspense>
      </div>

      {/* ── Top chrome overlay — mirrors mobile topChrome ── */}
      <div
        className="absolute left-4 right-4 z-20 flex flex-col gap-[10px]"
        style={{ top: "calc(12px + env(safe-area-inset-top))" }}
      >
        {/* Search bar */}
        <div
          className="flex items-center gap-[10px] rounded-xl px-[14px] py-3"
          style={{
            backgroundColor: chromeBg,
            boxShadow: chromeShadow,
          }}
        >
          <Search size={16} color={colors.subtext} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder={t("search.city_placeholder")}
            autoCorrect="off"
            autoCapitalize="words"
            className="flex-1 bg-transparent text-[0.9375rem] outline-none"
            style={{ color: colors.text }}
          />
          {search.length > 0 ? (
            <button
              type="button"
              onClick={() => { setSearch(""); setSuggestions([]); }}
              aria-label={t("search.clear") ?? "Clear"}
              className="active:opacity-60"
              style={{ padding: 8, margin: -8 }}
            >
              <X size={18} color={colors.subtext} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            aria-label={t("search.locate")}
            className="active:opacity-60 disabled:opacity-50"
            style={{ padding: 8, margin: -8 }}
          >
            {locating ? (
              <span
                className="block h-5 w-5 animate-spin rounded-full border-2"
                style={{ borderColor: Colors.brandGreen, borderTopColor: "transparent" }}
              />
            ) : (
              <Navigation size={20} color={Colors.brandGreen} />
            )}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {searchFocused && suggestions.length > 0 ? (
          <div
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: chromeBg,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            {suggestions.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
                className="flex w-full items-center gap-[10px] px-[14px] py-3 text-left active:bg-black/5"
                style={{
                  borderBottom:
                    idx < suggestions.length - 1
                      ? "1px solid rgba(128,128,128,0.18)"
                      : "none",
                }}
              >
                <MapPin size={16} color={colors.subtext} style={{ flexShrink: 0 }} />
                <span
                  className="flex-1 truncate text-[0.875rem]"
                  style={{ color: colors.text }}
                >
                  {s.placeName}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Inline feedback chips */}
        {error ? (
          <div
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(229,57,53,0.15)",
              color: "#ef9a9a",
              border: "1px solid rgba(229,57,53,0.4)",
            }}
          >
            {error}
          </div>
        ) : null}

        {!isOnline ? (
          <div
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(245,196,24,0.12)",
              color: "#ffd54f",
              border: "1px solid rgba(245,196,24,0.3)",
            }}
          >
            {t("offline.banner")} — {t("offline.cached_data")}
          </div>
        ) : null}

        {cityPackLoading ? (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
            style={{
              backgroundColor: colors.card,
              color: colors.subtext,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Loader2 size={12} className="animate-spin" color={Colors.brandGreen} />
            {t("map.loading")}
          </div>
        ) : null}

        {/* Zoom controls — mirrors mobile zoomStack (alignSelf: flex-end) */}
        <div
          className="self-end overflow-hidden rounded-[10px]"
          style={{
            backgroundColor: chromeBg,
            boxShadow: chromeShadow,
          }}
        >
          <button
            type="button"
            onClick={() =>
              setViewState((v) => ({ ...v, zoom: Math.min((v.zoom ?? 2) + 1, 20) }))
            }
            className="flex h-10 w-10 items-center justify-center active:opacity-60"
            style={{ borderBottom: "1px solid rgba(128,128,128,0.25)" }}
            aria-label={t("map.zoom_in")}
          >
            <Plus size={20} color={colors.text} />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewState((v) => ({ ...v, zoom: Math.max((v.zoom ?? 2) - 1, 1) }))
            }
            className="flex h-10 w-10 items-center justify-center active:opacity-60"
            aria-label={t("map.zoom_out")}
          >
            <Minus size={20} color={colors.text} />
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {loading ? (
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
        >
          <span
            className="block h-10 w-10 animate-spin rounded-full border-[3px]"
            style={{ borderColor: Colors.brandGreen, borderTopColor: "transparent" }}
          />
        </div>
      ) : null}
    </div>
  );
}

// ── City list fallback (no Mapbox token) ─────────────────────────────────────
function NoCityListFallback({ cities, loading, onSelectCity, colors, isDark, t, error }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return cities.slice(0, 40);
    return cities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(text) ||
          (c.country ?? "").toLowerCase().includes(text)
      )
      .slice(0, 40);
  }, [cities, query]);

  return (
    <div
      className="min-h-[100dvh] overflow-y-auto"
      style={{
        backgroundColor: colors.bg,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)",
      }}
    >
      <div className="px-4 pt-3">
        <div
          className="rounded-xl px-3 py-2 text-[0.8125rem] leading-snug"
          style={{
            backgroundColor: "rgba(245,196,24,0.12)",
            color: isDark ? "#ffd54f" : "#8a6d00",
            border: "1px solid rgba(245,196,24,0.35)",
          }}
        >
          {t("core.map_token")}
        </div>
      </div>
      {/* Search bar */}
      <div className="px-4 py-3">
        <div
          className="flex items-center gap-[10px] rounded-xl border px-[14px] py-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Search size={16} color={colors.subtext} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.city_placeholder")}
            autoCorrect="off"
            autoCapitalize="words"
            className="flex-1 bg-transparent text-[0.9375rem] outline-none"
            style={{ color: colors.text }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="active:opacity-60"
              style={{ padding: 8, margin: -8 }}
            >
              <X size={16} color={colors.subtext} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Section label */}
      <p
        className="px-4 pb-1 text-[0.8125rem] font-semibold uppercase tracking-wide"
        style={{ color: colors.subtext }}
      >
        {t("map.recent")}
      </p>

      {/* Error */}
      {error ? (
        <div
          className="mx-4 mb-3 rounded-xl px-3 py-2 text-xs font-semibold"
          style={{
            backgroundColor: "rgba(229,57,53,0.12)",
            color: "#ef9a9a",
            border: "1px solid rgba(229,57,53,0.3)",
          }}
        >
          {error}
        </div>
      ) : null}

      {/* City tiles */}
      {loading ? (
        <div className="flex justify-center py-10">
          <span
            className="block h-7 w-7 animate-spin rounded-full border-2"
            style={{ borderColor: Colors.brandGreen, borderTopColor: "transparent" }}
          />
        </div>
      ) : (
        <ul>
          {filtered.map((city) => (
            <li key={`${city.name}-${city.lat}`}>
              <button
                type="button"
                onClick={() => onSelectCity(city)}
                className="flex w-full items-center gap-3 px-4 py-[14px] text-left active:opacity-60"
                style={{ borderBottom: `1px solid ${colors.border}` }}
              >
                <MapPin size={18} color={Colors.brandGreen} style={{ flexShrink: 0 }} />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[1rem] font-bold"
                    style={{ color: colors.text }}
                  >
                    {city.name}
                  </p>
                  {city.country ? (
                    <p className="mt-0.5 text-[0.8125rem]" style={{ color: colors.subtext }}>
                      {city.country}
                    </p>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
