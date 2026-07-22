import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  MapPin,
  Search,
  X,
  RefreshCw,
  BarChart3,
  Plus,
} from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors, getAQIColor } from "../../utils/colors.js";
import { getPrediction, getHistory } from "../../services/api.js";

/** days of real history behind each sparkline */
const TREND_DAYS = 7;

const CITY_COLORS = [Colors.brandGreen, "#2196F3", "#F5C518", "#E53935"];

// Quick-search list of African cities
const SEARCH_CITIES = [
  { name: "Accra", country: "Ghana", lat: 5.6037, lon: -0.187 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lon: 3.3792 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lon: 36.8219 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lon: 31.2357 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lon: 28.0473 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lon: 18.4241 },
  { name: "Addis Ababa", country: "Ethiopia", lat: 9.0247, lon: 38.7468 },
  { name: "Kinshasa", country: "DRC", lat: -4.3217, lon: 15.3125 },
  { name: "Dar es Salaam", country: "Tanzania", lat: -6.7924, lon: 39.2083 },
  { name: "Kumasi", country: "Ghana", lat: 6.6885, lon: -1.6244 },
  { name: "Kampala", country: "Uganda", lat: 0.3476, lon: 32.5825 },
  { name: "Dakar", country: "Senegal", lat: 14.6928, lon: -17.4467 },
  { name: "Abidjan", country: "Côte d'Ivoire", lat: 5.3599, lon: -4.0083 },
  { name: "Kano", country: "Nigeria", lat: 12.0022, lon: 8.5919 },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lon: -7.5898 },
  { name: "Douala", country: "Cameroon", lat: 4.0511, lon: 9.7679 },
  { name: "Luanda", country: "Angola", lat: -8.8383, lon: 13.2344 },
  { name: "Kigali", country: "Rwanda", lat: -1.9403, lon: 29.8739 },
  { name: "Lusaka", country: "Zambia", lat: -15.4166, lon: 28.2833 },
  { name: "Harare", country: "Zimbabwe", lat: -17.8252, lon: 31.0335 },
  { name: "Maputo", country: "Mozambique", lat: -25.9692, lon: 32.5732 },
  { name: "Mogadishu", country: "Somalia", lat: 2.0469, lon: 45.3182 },
];

function MiniSparkline({ values, color, height = 44 }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: "2px 2px 0 0",
            height: `${Math.max(5, (v / max) * 100)}%`,
            backgroundColor: i === values.length - 1 ? color : color + "88",
          }}
        />
      ))}
    </div>
  );
}

function CityPicker({ slot, colors, onSelect, onClear, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const results =
    query.length >= 1
      ? SEARCH_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.country.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6)
      : [];

  function pick(city) {
    onSelect(city);
    setQuery("");
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          padding: "11px 14px",
        }}
      >
        <Search size={15} color={colors.muted} />
        <input
          ref={inputRef}
          type="text"
          value={slot ? `${slot.name}, ${slot.country}` : query}
          onChange={(e) => {
            if (slot) onClear();
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (!slot) setOpen(true); }}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "transparent",
            outline: "none",
            border: "none",
            fontSize: "0.875rem",
            color: colors.text,
          }}
        />
        {(slot || query) && (
          <button
            type="button"
            onClick={() => { onClear(); setQuery(""); setOpen(false); }}
            style={{ padding: 4 }}
          >
            <X size={14} color={colors.muted} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.card,
            overflow: "hidden",
            zIndex: 20,
          }}
        >
          {results.map((city) => (
            <button
              key={`${city.name}-${city.lat}`}
              type="button"
              onClick={() => pick(city)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 16px",
                textAlign: "left",
                background: "none",
                border: "none",
                borderTop: `1px solid ${colors.border}`,
                cursor: "pointer",
              }}
            >
              <MapPin size={13} color={colors.muted} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: colors.text }}>
                {city.name}
              </span>
              <span style={{ fontSize: "0.75rem", color: colors.muted }}>{city.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CityCard({ city, prediction, series, color, loading, index, colors, t }) {
  if (!city) {
    return (
      <div
        style={{
          flex: 1,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "40px 16px",
        }}
      >
        <MapPin size={24} color={colors.muted} />
        <p style={{ fontSize: "0.75rem", textAlign: "center", color: colors.muted, margin: 0 }}>
          {t("screen.compare.pick_two_cities")} {index + 1}
        </p>
      </div>
    );
  }

  const pm25 = prediction?.pm25 ?? null;
  const cat = prediction?.aqi_category ?? "—";
  const aqiColor = prediction ? getAQIColor(cat) : color;
  const lower = prediction?.uncertainty?.pm25_lower?.toFixed(0) ?? "—";
  const upper = prediction?.uncertainty?.pm25_upper?.toFixed(0) ?? "—";

  return (
    <div
      style={{
        flex: 1,
        borderRadius: 16,
        border: `1px solid ${color}55`,
        backgroundColor: colors.card,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
      }}
    >
      <div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color, margin: 0 }}>{city.name}</p>
        <p style={{ fontSize: "0.6875rem", color: colors.muted, margin: 0 }}>{city.country}</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
          <RefreshCw size={18} color={color} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : pm25 !== null ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: "1.875rem", fontWeight: 900, color: aqiColor }}>
              {Number(pm25).toFixed(0)}
            </span>
            <span style={{ fontSize: "0.6875rem", color: colors.muted }}>μg/m³</span>
          </div>

          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 999,
              textTransform: "capitalize",
              alignSelf: "flex-start",
              backgroundColor: aqiColor + "22",
              color: aqiColor,
            }}
          >
            {cat}
          </span>

          <MiniSparkline values={series} color={color} height={44} />

          <p style={{ fontSize: "0.625rem", color: colors.muted, margin: 0 }}>
            Range: {lower}–{upper} μg/m³
          </p>
        </>
      ) : (
        <p style={{ fontSize: "0.75rem", color: colors.muted, margin: 0 }}>
          {t("screen.compare.fetching_readings")}
        </p>
      )}
    </div>
  );
}

export function CompareCitiesScreen({ isOnline, isDark, params }) {
  const { state } = useAppState();
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  // no tiered limits for individuals — the product is free for everyone (scope §5)
  const maxCities = 4;

  // Seed from predictionHistory (first two entries)
  const history = state.predictionHistory ?? [];
  const seedA = history[0]
    ? { name: history[0].city ?? history[0].name, country: "", lat: history[0].lat, lon: history[0].lon }
    : null;
  const seedB = history[1]
    ? { name: history[1].city ?? history[1].name, country: "", lat: history[1].lat, lon: history[1].lon }
    : null;

  const [cities, setCities] = useState([seedA, seedB]);
  const [predictions, setPredictions] = useState([null, null]);
  // real last-week pm2.5 per slot — the sparklines are measured, not drawn
  const [trends, setTrends] = useState([[], []]);
  const [loadingSlots, setLoadingSlots] = useState([false, false]);

  function replaceAt(setter, index, value) {
    setter((prev) => { const next = [...prev]; next[index] = value; return next; });
  }

  // Fetch predictions for any seeded cities on mount
  useEffect(() => {
    cities.forEach((city, i) => {
      if (city) fetchForSlot(i, city);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCity(index, city) {
    setCities((prev) => {
      const next = [...prev];
      next[index] = city;
      return next;
    });
    if (city) {
      fetchForSlot(index, city);
    } else {
      replaceAt(setPredictions, index, null);
      replaceAt(setTrends, index, []);
    }
  }

  function clearCity(index) {
    replaceAt(setCities, index, null);
    replaceAt(setPredictions, index, null);
    replaceAt(setTrends, index, []);
  }

  async function fetchForSlot(index, city) {
    replaceAt(setLoadingSlots, index, true);
    try {
      const data = await getPrediction(city.lat, city.lon, city.name);
      replaceAt(setPredictions, index, data);
    } catch {
      // leave null on transient failure
    } finally {
      replaceAt(setLoadingSlots, index, false);
    }
    // the trend is secondary to the reading, so it loads separately and an
    // empty result just hides the sparkline rather than blocking the card.
    try {
      const days = await getHistory(city.lat, city.lon, city.name, TREND_DAYS);
      replaceAt(setTrends, index, days.map((d) => Math.round(d.pm25)));
    } catch {
      replaceAt(setTrends, index, []);
    }
  }

  function addSlot() {
    if (cities.length >= maxCities) return;
    setCities((prev) => [...prev, null]);
    setPredictions((prev) => [...prev, null]);
    setTrends((prev) => [...prev, []]);
    setLoadingSlots((prev) => [...prev, false]);
  }

  function removeSlot(index) {
    if (cities.length <= 2) return;
    setCities((prev) => prev.filter((_, i) => i !== index));
    setPredictions((prev) => prev.filter((_, i) => i !== index));
    setTrends((prev) => prev.filter((_, i) => i !== index));
    setLoadingSlots((prev) => prev.filter((_, i) => i !== index));
  }

  // Ranked comparison (all slots with data)
  const ranked = cities
    .map((c, i) => ({ city: c, pred: predictions[i], index: i }))
    .filter((x) => x.city && x.pred)
    .sort((a, b) => a.pred.pm25 - b.pred.pm25);

  const anyLoading = loadingSlots.some(Boolean);

  return (
    <div style={{ minHeight: "100dvh" }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}
      >
        <button type="button" onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={22} color={colors.text} />
        </button>
        <span style={{ fontSize: "1.0625rem", fontWeight: 700, color: colors.text }}>
          {t("screen.compare.title")}
        </span>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 16px 40px" }}>
        {/* City pickers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cities.map((city, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <CityPicker
                  slot={city}
                  colors={colors}
                  onSelect={(c) => setCity(i, c)}
                  onClear={() => clearCity(i)}
                  placeholder={t("search.city_placeholder")}
                />
              </div>
              {i > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.surface,
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <X size={14} color={colors.muted} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add city button (premium only) */}
        {cities.length < maxCities && (
          <button
            type="button"
            onClick={addSlot}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: "0.8125rem",
              fontWeight: 600,
              backgroundColor: colors.surface,
              color: colors.subtext,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={14} color={colors.subtext} />
            {t("common.add_city")}
          </button>
        )}

        {/* Loading indicator */}
        {anyLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <RefreshCw size={16} color={Colors.brandGreen} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.8125rem", color: colors.subtext }}>
              {t("screen.compare.fetching_readings")}
            </span>
          </div>
        )}

        {/* City cards */}
        {cities.length <= 2 ? (
          <div style={{ display: "flex", gap: 12 }}>
            {cities.map((city, i) => (
              <CityCard
                key={i}
                city={city}
                prediction={predictions[i]}
                series={trends[i] ?? []}
                color={CITY_COLORS[i % CITY_COLORS.length]}
                loading={loadingSlots[i]}
                index={i}
                colors={colors}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {cities.map((city, i) => (
              <CityCard
                key={i}
                city={city}
                prediction={predictions[i]}
                series={trends[i] ?? []}
                color={CITY_COLORS[i % CITY_COLORS.length]}
                loading={loadingSlots[i]}
                index={i}
                colors={colors}
                t={t}
              />
            ))}
          </div>
        )}

        {/* VS bar (2-city mode, both loaded) */}
        {cities.length === 2 && predictions[0] && predictions[1] && (
          <div
            style={{
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: CITY_COLORS[0] }}>
                {cities[0]?.name ?? "—"}
              </span>
              <span style={{ fontSize: "0.8125rem", color: CITY_COLORS[0] }}>
                {t("screen.compare.avg", { value: predictions[0]?.pm25?.toFixed(0) })}
              </span>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surface,
              }}
            >
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: colors.subtext }}>
                {t("screen.compare.vs")}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: CITY_COLORS[1] }}>
                {cities[1]?.name ?? "—"}
              </span>
              <span style={{ fontSize: "0.8125rem", color: CITY_COLORS[1] }}>
                {t("screen.compare.avg", { value: predictions[1]?.pm25?.toFixed(0) })}
              </span>
            </div>
          </div>
        )}

        {/* Rankings section (2+ results) */}
        {ranked.length >= 2 && (
          <div
            style={{
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={16} color={Colors.brandGreen} />
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: colors.text, margin: 0 }}>
                Air Quality Ranking (cleanest first)
              </p>
            </div>
            {ranked.map((item, rank) => {
              const color = CITY_COLORS[item.index % CITY_COLORS.length];
              const aqiColor = getAQIColor(item.pred.aqi_category, isDark);
              const barWidth = Math.max(5, Math.min(100, (1 - item.pred.pm25 / 200) * 100));
              return (
                <div key={item.city.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 900,
                      width: 20,
                      textAlign: "center",
                      color: rank === 0 ? Colors.brandGreen : colors.muted,
                    }}
                  >
                    #{rank + 1}
                  </span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color }}>{item.city.name}</span>
                      <span style={{ fontSize: "0.75rem", color: aqiColor }}>
                        {item.pred.pm25.toFixed(0)} μg/m³
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        overflow: "hidden",
                        backgroundColor: colors.border,
                      }}
                    >
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          width: `${barWidth}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {cities.every((c) => !c) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "40px 0",
            }}
          >
            <MapPin size={40} color={colors.muted} />
            <p style={{ fontSize: "0.875rem", textAlign: "center", color: colors.subtext, margin: 0 }}>
              {t("screen.compare.pick_two_cities")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
