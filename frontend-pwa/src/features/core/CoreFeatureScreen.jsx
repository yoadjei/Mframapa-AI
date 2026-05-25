import { lazy, Suspense, useMemo, useState } from "react";
import { Crosshair, Loader2, Search, X } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { fetchCityPrediction } from "../../services/predictionService.js";
import { translateError } from "../../utils/translateError.js";
import { aqiCategoryKey } from "../../utils/i18nHelpers.js";
import { StateMessage } from "../../components/feedback/StateMessage.jsx";
import { useCityPack } from "../../hooks/useCityPack.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";
const MapCanvas = lazy(() => import("./MapCanvas.jsx").then((module) => ({ default: module.MapCanvas })));

const INITIAL_VIEW = {
  longitude: 17.5,
  latitude: 4.5,
  zoom: 2.2,
  pitch: 22,
  bearing: 0,
};

function squaredDistance(lat1, lon1, lat2, lon2) {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return dLat * dLat + dLon * dLon;
}

function nearestCity(lat, lon, cities) {
  if (!cities.length) return null;
  let best = cities[0];
  let min = Infinity;
  for (const city of cities) {
    const dist = squaredDistance(lat, lon, city.lat, city.lon);
    if (dist < min) {
      min = dist;
      best = city;
    }
  }
  return best;
}

function getAQITone(pm25, t) {
  let key = "aqi.hazardous";
  if (pm25 <= 12) key = "aqi.good";
  else if (pm25 <= 35) key = "aqi.moderate";
  else if (pm25 <= 55) key = "aqi.sensitive";
  else if (pm25 <= 150) key = "aqi.unhealthy";
  const className =
    key === "aqi.good"
      ? "text-emerald-600 bg-emerald-100"
      : key === "aqi.moderate"
        ? "text-yellow-700 bg-yellow-100"
        : key === "aqi.sensitive"
          ? "text-orange-700 bg-orange-100"
          : key === "aqi.unhealthy"
            ? "text-red-700 bg-red-100"
            : "text-purple-700 bg-purple-100";
  return { label: t(key), className };
}

export function CoreFeatureScreen({ isOnline }) {
  const {
    state: { ui, homeSummary, preferences },
    dispatch,
  } = useAppState();
  const { t } = useTranslation();
  const language = preferences.language ?? "en";

  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [query, setQuery] = useState(ui.selectedCity?.name ?? homeSummary.city ?? "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { cities, loading: cityPackLoading } = useCityPack(isOnline);

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark =
    preferences.theme === "dark" || (preferences.theme === "system" && prefersDark);

  const candidates = useMemo(() => {
    if (!query.trim()) return cities.slice(0, 10);
    const text = query.trim().toLowerCase();
    return cities
      .filter((city) => city.name.toLowerCase().includes(text))
      .slice(0, 10);
  }, [cities, query]);

  const syncPredictionToState = (prediction) => {
    dispatch({ type: "SELECT_CITY", payload: prediction.city });
    dispatch({ type: "SAVE_CITY", payload: prediction.city });
    dispatch({
      type: "SET_HOME_SUMMARY",
      payload: {
        city: prediction.city.name,
        pm25: prediction.pm25,
        aqiCategory: prediction.category,
        degraded: prediction.degraded,
        lastUpdated: prediction.timestamp,
      },
    });
    dispatch({
      type: "ADD_ACTIVITY",
      payload: {
        id: crypto.randomUUID(),
        type: "prediction",
        message: t("pwa.activity.checked", {
          city: prediction.city.name,
          pm25: Math.round(prediction.pm25),
        }),
        createdAt: prediction.timestamp,
      },
    });
    if (preferences.notificationsEnabled) {
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: crypto.randomUUID(),
          title: t("pwa.notification.reading_title", { city: prediction.city.name }),
          message: t("pwa.notification.reading_message", {
            pm25: Math.round(prediction.pm25),
            category: t(aqiCategoryKey(prediction.category)),
          }),
          read: false,
          createdAt: prediction.timestamp,
        },
      });
    }
  };

  const runCheckByCity = async (cityName) => {
    setError("");
    setLoading(true);
    try {
      const prediction = await fetchCityPrediction(cityName, language);
      setResult(prediction);
      setQuery(prediction.city.name);
      setViewState((current) => ({
        ...current,
        longitude: prediction.city.lon,
        latitude: prediction.city.lat,
        zoom: 11.5,
        pitch: 40,
      }));
      syncPredictionToState(prediction);
    } catch (requestError) {
      setError(translateError(t, requestError.message));
    } finally {
      setLoading(false);
    }
  };

  const runCheckByCoords = async (lat, lon) => {
    const candidate = nearestCity(lat, lon, cities);
    if (!candidate) {
      setError(t("pwa.core.no_city_pack"));
      return;
    }
    await runCheckByCity(candidate.name);
  };

  const onMapClick = (event) => {
    if (!isOnline) return;
    runCheckByCoords(event.lngLat.lat, event.lngLat.lng);
  };

  const onLocateMe = () => {
    if (!navigator.geolocation || !isOnline) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setViewState((prev) => ({
          ...prev,
          latitude,
          longitude,
          zoom: 15,
          pitch: 50,
          transitionDuration: 1400,
        }));
        runCheckByCoords(latitude, longitude);
      },
      () => setError(t("pwa.core.location_error"))
    );
  };

  if (!MAPBOX_TOKEN) {
    return (
      <StateMessage
        tone="error"
        title={t("pwa.core.map_missing")}
        message={t("pwa.core.map_token")}
      />
    );
  }

  const tone = result ? getAQITone(result.pm25, t) : null;

  return (
    <section className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl dark:border-slate-700">
        <div className="absolute left-4 right-4 top-4 z-30 md:left-6 md:right-auto md:w-[34rem]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (query && isOnline) runCheckByCity(query);
            }}
            className="rounded-2xl border border-emerald-400/70 bg-slate-900/90 p-2 backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <Search size={18} className="text-emerald-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 140)}
                placeholder={t("search.placeholder")}
                className="h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
              {loading ? <Loader2 size={16} className="animate-spin text-emerald-300" /> : null}
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onLocateMe}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <Crosshair size={16} />
              </button>
            </div>
          </form>

          {searchFocused && candidates.length > 0 ? (
            <div className="mt-2 rounded-2xl border border-slate-700 bg-slate-900/95 p-1 shadow-2xl backdrop-blur">
              {candidates.map((city) => (
                <button
                  key={`${city.name}-${city.country}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    runCheckByCity(city.name);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white/10"
                >
                  <span className="text-sm font-medium text-white">{city.name}</span>
                  <span className="text-xs text-slate-400">{city.country}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Suspense fallback={<div className="h-[76vh] w-full animate-pulse bg-slate-900" />}>
          <MapCanvas
            viewState={viewState}
            onMove={(event) => setViewState(event.viewState)}
            onMapClick={onMapClick}
            mapboxToken={MAPBOX_TOKEN}
            isDark={isDark}
            cities={cities}
            selectedCity={result?.city ?? null}
            liteMode={preferences.liteMode ?? false}
          />
        </Suspense>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950/95 to-transparent p-4 md:p-6">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <StatusCard
              title={t("pwa.core.status_satellite")}
              value={isOnline ? t("pwa.core.status_active") : t("pwa.core.status_offline")}
            />
            <StatusCard title={t("pwa.core.status_ground")} value={t("pwa.core.status_ground_value")} />
            <StatusCard title={t("pwa.core.status_prediction")} value={t("pwa.core.status_prediction_value")} />
          </div>
        </div>

        {result ? (
          <aside className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 md:bottom-auto md:left-auto md:right-6 md:top-28 md:w-[28rem]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-3xl font-black">{Math.round(result.pm25)}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {t("card.pm25_label")} {t("card.unit")}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone?.className || ""}`}>
                {tone?.label || result.category}
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold">{result.city.name}</p>
            <p className="text-xs text-slate-500">
              {result.city.lat.toFixed(4)}, {result.city.lon.toFixed(4)}
            </p>
            {result.insight ? (
              <div className="mt-4 rounded-xl bg-slate-100 px-3 py-3 text-sm dark:bg-slate-800">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {t("pwa.core.insight_title")}
                </p>
                <p className="mt-1">{result.insight}</p>
              </div>
            ) : null}
            <p className="mt-3 text-xs text-slate-500">
              {t("pwa.core.updated", { time: new Date(result.timestamp).toLocaleString() })}
            </p>
            {result.degraded ? (
              <p className="mt-2 rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                {t("pwa.core.degraded")}
              </p>
            ) : null}
          </aside>
        ) : (
          <div className="absolute right-6 top-28 z-20 hidden max-w-sm rounded-2xl border border-white/20 bg-slate-900/75 p-5 text-white backdrop-blur md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
              {t("pwa.core.start_badge")}
            </p>
            <h3 className="mt-2 text-xl font-bold">{t("pwa.core.start_title")}</h3>
            <p className="mt-2 text-sm text-slate-200">{t("pwa.core.start_body")}</p>
          </div>
        )}
      </div>

      {!isOnline ? (
        <StateMessage
          tone="warning"
          title={t("pwa.core.offline_title")}
          message={t("pwa.core.offline_message")}
        />
      ) : null}
      {cityPackLoading ? (
        <StateMessage title={t("pwa.core.city_pack_title")} message={t("pwa.core.city_pack_message")} />
      ) : null}
      {error ? (
        <StateMessage tone="error" title={t("pwa.core.prediction_failed")} message={error} />
      ) : null}
    </section>
  );
}

function StatusCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-slate-900/75 px-3 py-2 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">{title}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
