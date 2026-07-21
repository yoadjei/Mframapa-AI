import { useMemo, useRef, useState } from "react";
import { Search, MapPin, X, ChevronRight, Clock } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useCityPack } from "../../hooks/useCityPack.js";
import { getColors, Colors, getAQIColor, aqiSymbol } from "../../utils/colors.js";
import { getPrediction, generateInsight } from "../../services/api.js";

// ── AQI dot indicator ────────────────────────────────────────────
function StatusDot({ category, size = 10, isDark }) {
  const color = getAQIColor(category, isDark);
  // colour alone cannot carry meaning: the symbol keeps this readable for
  // anyone with colour vision deficiency, and the label for a screen reader.
  return (
    <span
      role="img"
      aria-label={category ?? "unknown"}
      title={category ?? ""}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size * 1.6,
        height: size * 1.6,
        fontSize: `${size * 1.1}px`,
        lineHeight: 1,
        color,
        flexShrink: 0,
      }}
    >
      {aqiSymbol(category)}
    </span>
  );
}

export function SearchScreen({ isOnline, isDark }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { cities } = useCityPack(isOnline);
  const colors = getColors(isDark);

  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const inputRef = useRef(null);

  // Recent searches come from state.activity (prediction type) or state.homeSummary
  const recentSearches = useMemo(() => {
    return (state.activity ?? [])
      .filter((a) => a.type === "prediction" && a.cityName)
      .slice(0, 10);
  }, [state.activity]);

  // Filter cities for suggestions
  const suggestions = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (text.length < 2) return [];
    return cities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(text) ||
          (c.country ?? "").toLowerCase().includes(text)
      )
      .slice(0, 12);
  }, [query, cities]);

  async function handleSelect(city) {
    if (loadingId) return;
    const cityId = `${city.lat.toFixed(3)}-${city.lon.toFixed(3)}`;
    setLoadingId(cityId);

    try {
      const response = await getPrediction(city.lat, city.lon, city.name);

      let insight;
      try {
        insight = await generateInsight({
          pm25: response.pm25,
          aqi_category: response.aqi_category,
          weather: response.weather ?? {},
          language: state.preferences?.language ?? "en",
        });
      } catch {
        insight = undefined;
      }

      const prediction = {
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

      // Add to activity
      dispatch({
        type: "ADD_ACTIVITY",
        payload: {
          id: crypto.randomUUID(),
          type: "prediction",
          cityName: city.name,
          pm25: response.pm25,
          category: response.aqi_category,
          message: `Checked ${city.name}: ${Math.round(response.pm25)} μg/m³`,
          createdAt: prediction.timestamp,
        },
      });

      // Update home summary
      dispatch({
        type: "SET_HOME_SUMMARY",
        payload: {
          city: city.name,
          pm25: response.pm25,
          aqiCategory: response.aqi_category,
        },
      });

      setQuery("");

      // Navigate to cityDetail stack screen
      dispatch({
        type: "NAVIGATE",
        payload: { name: "cityDetail", params: { city: prediction.city, prediction } },
      });
    } catch {
      // swallow error silently for now
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRecentSelect(item) {
    // Find the city object from the city pack
    const cityObj = cities.find(
      (c) => c.name.toLowerCase() === (item.cityName ?? "").toLowerCase()
    );
    if (cityObj) {
      handleSelect(cityObj);
    }
  }

  const isSearching = query.trim().length >= 2;

  return (
    <div
      className="min-h-[100dvh] overflow-y-auto mf-tab-gap"
      style={{ backgroundColor: colors.bg }}
    >
      {/* ── Search bar ── */}
      <div className="px-4 py-3">
        <div
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Search size={16} color={colors.subtext} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
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
              className="flex-shrink-0 active:opacity-60"
            >
              <X size={16} color={colors.subtext} />
            </button>
          ) : null}
        </div>
      </div>

      {isSearching ? (
        // ── Active search: suggestions list ──
        suggestions.length === 0 ? (
          <p
            className="pt-12 text-center text-sm"
            style={{ color: colors.subtext }}
          >
            {t("search.no_results")}
          </p>
        ) : (
          <ul>
            {suggestions.map((city) => {
              const cityId = `${city.lat.toFixed(3)}-${city.lon.toFixed(3)}`;
              const isLoading = loadingId === cityId;
              return (
                <li key={cityId}>
                  <button
                    type="button"
                    onClick={() => handleSelect(city)}
                    disabled={Boolean(loadingId)}
                    className="flex w-full items-center gap-3 px-4 py-[14px] text-left active:opacity-60"
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    <MapPin size={18} color={colors.subtext} style={{ flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[1rem] font-bold truncate"
                        style={{ color: colors.text }}
                      >
                        {city.name}
                      </p>
                      <p
                        className="text-[0.8125rem] mt-0.5 truncate"
                        style={{ color: colors.subtext }}
                      >
                        {city.name}{city.country ? `, ${city.country}` : ""}
                      </p>
                    </div>
                    {isLoading ? (
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent flex-shrink-0"
                        style={{ borderColor: Colors.brandGreen, borderTopColor: "transparent" }}
                      />
                    ) : (
                      <ChevronRight size={16} color={colors.subtext} style={{ flexShrink: 0 }} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        // ── Default state: recent searches or empty hint ──
        <>
          {recentSearches.length > 0 ? (
            <>
              <p
                className="px-4 pb-1 pt-2 text-[0.8125rem] font-semibold uppercase tracking-wide"
                style={{ color: colors.subtext }}
              >
                {t("search.recent")}
              </p>
              <ul>
                {recentSearches.map((item, idx) => (
                  <li key={`${item.cityName}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => handleRecentSelect(item)}
                      disabled={Boolean(loadingId)}
                      className="flex w-full items-center gap-3 px-4 py-[14px] text-left active:opacity-60"
                      style={{ borderBottom: `1px solid ${colors.border}` }}
                    >
                      <Clock size={16} color={colors.subtext} style={{ flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[1rem] font-bold"
                          style={{ color: colors.text }}
                        >
                          {item.cityName}
                        </p>
                        {item.pm25 != null ? (
                          <p
                            className="text-[0.8125rem] mt-0.5"
                            style={{ color: colors.subtext }}
                          >
                            PM2.5 {Math.round(item.pm25)} μg/m³
                          </p>
                        ) : null}
                      </div>
                      {item.category ? (
                        <StatusDot isDark={isDark} category={item.category} size={12} />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            // Empty hint
            <div
              className="flex flex-col items-center gap-3 px-8 pt-20"
            >
              <Search size={44} color={colors.subtext} />
              <p
                className="text-[1.125rem] font-bold text-center"
                style={{ color: colors.text }}
              >
                {t("search.prompt")}
              </p>
              <p
                className="text-[0.875rem] text-center leading-relaxed"
                style={{ color: colors.subtext }}
              >
                {t("search.helper")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
