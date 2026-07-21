import { useState, useEffect } from "react";
import { MapPin, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors, getAQIColor } from "../../utils/colors.js";
import { getForecast } from "../../services/api.js";



function SparklineBar({ values, color, height = 80 }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: "2px 2px 0 0",
            height: `${Math.max(4, (v / max) * 100)}%`,
            backgroundColor:
              i === values.length - 1 ? color : color + "88",
          }}
        />
      ))}
    </div>
  );
}

function UncertaintyBar({ low, mid, high, color, colors }) {
  const range = high - low || 1;
  const midPct = ((mid - low) / range) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.6875rem",
          color: colors.muted,
        }}
      >
        <span>{low} μg/m³</span>
        <span>{high} μg/m³</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.border,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: 8,
            borderRadius: 999,
            backgroundColor: color + "44",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 6,
            height: 16,
            borderRadius: 999,
            top: -4,
            left: `${midPct}%`,
            transform: "translateX(-50%)",
            backgroundColor: color,
          }}
        />
      </div>
      <p
        style={{
          textAlign: "center",
          fontSize: "0.75rem",
          fontWeight: 600,
          color,
          margin: 0,
        }}
      >
        {mid} μg/m³ current
      </p>
    </div>
  );
}

const FACTORS_COLORS = [
  Colors.brandGreen,
  "#2196F3",
  "#F5C518",
  "#FF8C00",
  "#9C27B0",
  "#E53935",
];

 
export function PredictionDashboardScreen({ isOnline, isDark, params }) {
  const { state } = useAppState();
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  const [range, setRange] = useState(0);

  // params.prediction is a PredictionResult passed when navigating here.
  // Fall back to homeSummary when no explicit prediction is provided.
  const homeSummary = state.homeSummary ?? {};
  const pred =
    params?.prediction ??
    (homeSummary.pm25
      ? {
          pm25: homeSummary.pm25,
          aqi_category: homeSummary.aqiCategory ?? "unknown",
          location: { name: homeSummary.city ?? "—" },
          uncertainty: {
            pm25_lower: homeSummary.pm25 * 0.8,
            pm25_upper: homeSummary.pm25 * 1.2,
          },
          factors: [
            "Aerosol optical depth",
            "Wind speed",
            "Humidity",
            "Elevation",
            "Nighttime lights",
          ],
        }
      : null);

  // real multi-day outlook from the api. the horizon is whatever our inputs
  // genuinely cover, so there is nothing to synthesise here.
  const [forecast, setForecast] = useState([]);
  const lat = pred?.location?.lat;
  const lon = pred?.location?.lon;

  useEffect(() => {
    if (lat == null || lon == null) { setForecast([]); return; }
    let cancelled = false;
    getForecast(lat, lon, pred?.location?.name ?? "Unknown")
      .then((days) => { if (!cancelled) setForecast(days); })
      .catch(() => { if (!cancelled) setForecast([]); });
    return () => { cancelled = true; };
  }, [lat, lon, pred?.location?.name]);

  // the selected day drives the numbers; index 0 is today
  const dayIndex = Math.min(range, Math.max(0, forecast.length - 1));
  const selected = forecast[dayIndex] ?? null;

  const derivedBand = (() => {
    const source = selected ?? pred;
    if (!source) return null;
    const u = source.uncertainty ?? {};
    return {
      high: Math.max(0, Math.round(u.pm25_upper ?? source.pm25)),
      low: Math.max(0, Math.round(u.pm25_lower ?? source.pm25)),
      mid: Math.round(source.pm25),
    };
  })();

  const series = forecast.map((d) => Math.round(d.pm25));
  const aqiColor = getAQIColor((selected ?? pred)?.aqi_category, isDark);
  const factors = pred?.factors ?? [];

  // labels reflect the real days we can forecast, not fixed 24h/48h/7d claims
  const rangeLabels = forecast.map((d, i) =>
    i === 0 ? t("common.today") : new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })
  );
  const reducedConfidence = selected?.inputs === "reduced";

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Safe area top spacer */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={goBack}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.text}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            letterSpacing: 1,
            color: colors.text,
          }}
        >
          {t("screen.prediction_dashboard.title").toUpperCase()}
        </span>
        <div style={{ width: 22 }} />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          overflowY: "auto",
        }}
      >
        {!pred ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 80,
              gap: 14,
            }}
          >
            <BarChart3 size={48} color={colors.subtext} />
            <p
              style={{
                fontSize: "0.9375rem",
                textAlign: "center",
                paddingLeft: 32,
                paddingRight: 32,
                color: colors.subtext,
                margin: 0,
              }}
            >
              {t("screen.prediction_dashboard.no_data_yet")}
            </p>
            <button
              type="button"
              onClick={() => navigate("home")}
              style={{
                paddingLeft: 18,
                paddingRight: 18,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: 999,
                fontSize: "0.875rem",
                fontWeight: 600,
                backgroundColor: Colors.brandGreen + "22",
                color: Colors.brandGreen,
                border: "none",
                cursor: "pointer",
              }}
            >
              {t("screen.prediction_dashboard.check_a_city")}
            </button>
          </div>
        ) : (
          <>
            {/* Location row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={16} color={colors.subtext} />
              <span
                style={{ fontSize: "0.875rem", fontWeight: 600, color: colors.text }}
              >
                {pred.location?.name ?? "—"}
              </span>
            </div>

            {/* Range selector */}
            <div
              style={{
                display: "flex",
                borderRadius: 12,
                padding: 4,
                gap: 4,
                backgroundColor: colors.surface,
              }}
            >
              {rangeLabels.map((label, i) => (
                <button
                  key={label + i}
                  type="button"
                  onClick={() => setRange(i)}
                  style={{
                    flex: 1,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderRadius: 8,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor:
                      dayIndex === i ? Colors.brandGreen : "transparent",
                    color: dayIndex === i ? "#000" : colors.subtext,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {reducedConfidence && (
              <p style={{ fontSize: "0.75rem", color: colors.muted, marginTop: 8, marginBottom: 0 }}>
{t("screen.prediction_dashboard.reduced_confidence")}.
              </p>
            )}

            {/* Sparkline chart */}
            <div
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: colors.border,
                backgroundColor: colors.card,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: colors.muted,
                  margin: 0,
                }}
              >
                PM2.5 Forecast Trend
              </p>
              <SparklineBar values={series} color={aqiColor} height={96} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.6875rem",
                  color: colors.muted,
                }}
              >
                <span>{series.length ? `${series.length} days` : ""}</span>
                <span>now</span>
              </div>
            </div>

            {/* High / Low stat boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: "0.75rem", color: colors.subtext }}>
                  {t("screen.prediction_dashboard.predicted_high")}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: colors.text,
                    }}
                  >
                    {derivedBand.high}
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: colors.subtext }}>
                    {t("unit.ug_m3")}
                  </span>
                </div>
              </div>
              <div
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: "0.75rem", color: colors.subtext }}>
                  {t("screen.prediction_dashboard.predicted_low")}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: colors.text,
                    }}
                  >
                    {derivedBand.low}
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: colors.subtext }}>
                    {t("unit.ug_m3")}
                  </span>
                </div>
              </div>
            </div>

            {/* AQI category badge */}
            <div
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: colors.border,
                backgroundColor: colors.card,
                padding: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.75rem", color: colors.muted }}>
                  AQI Category
                </span>
                <span
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    textTransform: "capitalize",
                    color: aqiColor,
                  }}
                >
                  {pred.aqi_category}
                </span>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: aqiColor + "22",
                }}
              >
                <span
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 900,
                    color: aqiColor,
                  }}
                >
                  {derivedBand.mid}
                </span>
              </div>
            </div>

            {/* Confidence range */}
            <div
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: colors.border,
                backgroundColor: colors.card,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: colors.text,
                  margin: 0,
                }}
              >
                Confidence Range ({range})
              </p>
              <UncertaintyBar
                low={derivedBand.low}
                mid={derivedBand.mid}
                high={derivedBand.high}
                color={aqiColor}
                colors={colors}
              />
            </div>

            {/* Contributing factors */}
            {factors.length > 0 && (
              <div
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: colors.text,
                    margin: 0,
                  }}
                >
                  Contributing Factors
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {factors.slice(0, 6).map((f, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flexShrink: 0,
                          backgroundColor:
                            FACTORS_COLORS[i % FACTORS_COLORS.length],
                        }}
                      />
                      <span style={{ fontSize: "0.8125rem", color: colors.subtext }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
