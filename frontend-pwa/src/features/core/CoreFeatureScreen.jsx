import { lazy, Suspense, useMemo, useState } from "react";
import { Crosshair, Loader2, Search, X } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { fetchCityPrediction } from "../../services/predictionService.js";
import { StateMessage } from "../../components/feedback/StateMessage.jsx";
import { useCityPack } from "../../hooks/useCityPack.js";

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoieW9hZGplaSIsImEiOiJjbWprcjI4b3QyNHBpM2Nxem4xM2VwNWF4In0.z6NbrlGRmQdT-vlYk5bjMw";
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

function getAQITone(pm25) {
  if (pm25 <= 12) return { label: "Good", className: "text-emerald-600 bg-emerald-100" };
  if (pm25 <= 35) return { label: "Moderate", className: "text-yellow-700 bg-yellow-100" };
  if (pm25 <= 55) return { label: "Sensitive", className: "text-orange-700 bg-orange-100" };
  if (pm25 <= 150) return { label: "Unhealthy", className: "text-red-700 bg-red-100" };
  return { label: "Hazardous", className: "text-purple-700 bg-purple-100" };
}

export function CoreFeatureScreen({ isOnline }) {
  const {
    state: { ui, homeSummary, preferences },
    dispatch,
  } = useAppState();

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
        message: `Checked ${prediction.city.name}: ${prediction.pm25} ug/m3`,
        createdAt: prediction.timestamp,
      },
    });
    if (preferences.notificationsEnabled) {
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: crypto.randomUUID(),
          title: `New reading for ${prediction.city.name}`,
          message: `PM2.5 is ${Math.round(prediction.pm25)} ug/m3 (${prediction.category}).`,
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
      const prediction = await fetchCityPrediction(cityName);
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
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const runCheckByCoords = async (lat, lon) => {
    const candidate = nearestCity(lat, lon, cities);
    if (!candidate) {
      setError("No cached city pack available yet");
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
        runCheckByCoords(latitude, longitude);
      },
      () => setError("Unable to access your location")
    );
  };

  if (!MAPBOX_TOKEN) {
    return (
      <StateMessage
        tone="error"
        title="Map is not configured"
        message="Set VITE_MAPBOX_TOKEN to enable map rendering."
      />
    );
  }

  const tone = result ? getAQITone(result.pm25) : null;

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
                placeholder="Search African cities..."
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
            <StatusCard title="Satellite feed" value={isOnline ? "Active" : "Offline"} />
            <StatusCard title="Ground truth" value="29 reference nations" />
            <StatusCard title="Today's prediction" value="1,257 checks" />
          </div>
        </div>

        {result ? (
          <aside className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 md:bottom-auto md:left-auto md:right-6 md:top-28 md:w-[28rem]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-3xl font-black">{Math.round(result.pm25)}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">PM2.5 ug/m3</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone?.className || ""}`}>
                {tone?.label || result.category}
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold">{result.city.name}</p>
            <p className="text-xs text-slate-500">
              {result.city.lat.toFixed(4)}, {result.city.lon.toFixed(4)}
            </p>
            <p className="mt-4 rounded-xl bg-slate-100 px-3 py-3 text-sm dark:bg-slate-800">
              {result.category === "Good"
                ? "Air quality is good for most people."
                : "Sensitive groups should reduce prolonged outdoor exposure."}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Updated {new Date(result.timestamp).toLocaleString()}
            </p>
            {result.degraded ? (
              <p className="mt-2 rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                Degraded data mode
              </p>
            ) : null}
          </aside>
        ) : (
          <div className="absolute right-6 top-28 z-20 hidden max-w-sm rounded-2xl border border-white/20 bg-slate-900/75 p-5 text-white backdrop-blur md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Start here</p>
            <h3 className="mt-2 text-xl font-bold">Search a city or tap the map</h3>
            <p className="mt-2 text-sm text-slate-200">
              We will return PM2.5 status and update your dashboard summary.
            </p>
          </div>
        )}
      </div>

      {!isOnline ? (
        <StateMessage
          tone="warning"
          title="Offline mode"
          message="Map interactions are limited while offline. Reconnect to fetch fresh city readings."
        />
      ) : null}
      {cityPackLoading ? (
        <StateMessage title="Preparing offline city pack" message="Syncing top city list for search and offline use." />
      ) : null}
      {error ? <StateMessage tone="error" title="Prediction failed" message={error} /> : null}
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
