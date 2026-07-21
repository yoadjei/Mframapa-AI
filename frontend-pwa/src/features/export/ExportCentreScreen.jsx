import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { getColors, Colors } from "../../utils/colors.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

// ─── Format builders ──────────────────────────────────────────────────────────

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(savedCities, predictionHistory) {
  const rows = ["source,name,country,lat,lon,pm25,aqi_category,checked_at"];
  for (const loc of savedCities) {
    rows.push(
      [
        escapeCsv("saved"),
        escapeCsv(loc.name),
        escapeCsv(loc.country ?? ""),
        escapeCsv(loc.lat ?? ""),
        escapeCsv(loc.lon ?? ""),
        escapeCsv(loc.lastPm25 ?? ""),
        escapeCsv(loc.lastAqiCategory ?? ""),
        escapeCsv(loc.lastChecked ?? ""),
      ].join(",")
    );
  }
  for (const p of predictionHistory ?? []) {
    rows.push(
      [
        escapeCsv("history"),
        escapeCsv(p.location?.name ?? ""),
        escapeCsv(""),
        escapeCsv(p.location?.lat ?? ""),
        escapeCsv(p.location?.lon ?? ""),
        escapeCsv(typeof p.pm25 === "number" ? p.pm25.toFixed(1) : ""),
        escapeCsv(p.aqi_category ?? ""),
        escapeCsv(p.timestamp ?? ""),
      ].join(",")
    );
  }
  return rows.join("\n");
}

function buildGeoJson(savedCities, predictionHistory) {
  const features = [];
  for (const loc of savedCities) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [loc.lon, loc.lat] },
      properties: {
        source: "saved",
        name: loc.name,
        country: loc.country ?? null,
        pm25: loc.lastPm25 ?? null,
        aqi_category: loc.lastAqiCategory ?? null,
        checked_at: loc.lastChecked ?? null,
      },
    });
  }
  for (const p of predictionHistory ?? []) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [p.location?.lon, p.location?.lat],
      },
      properties: {
        source: "history",
        name: p.location?.name,
        pm25: p.pm25,
        aqi_category: p.aqi_category,
        uncertainty: p.uncertainty,
        weather: p.weather,
        timestamp: p.timestamp,
      },
    });
  }
  return JSON.stringify({ type: "FeatureCollection", features }, null, 2);
}

function buildHtml(savedCities, predictionHistory) {
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  const savedRows = savedCities
    .map(
      (l) =>
        `<tr><td>${esc(l.name)}</td><td>${esc(l.country)}</td><td>${l.lastPm25 ?? "-"}</td><td>${esc(l.lastAqiCategory ?? "-")}</td></tr>`
    )
    .join("");
  const historyRows = (predictionHistory ?? [])
    .map(
      (p) =>
        `<tr><td>${esc(p.location?.name)}</td><td>${typeof p.pm25 === "number" ? p.pm25.toFixed(1) : "-"}</td><td>${esc(p.aqi_category)}</td><td>${esc(p.timestamp)}</td></tr>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mframapa Export</title>
    <style>body{font-family:-apple-system,system-ui,sans-serif;padding:24px;color:#111}
    h1{font-size:22px} h2{font-size:16px;margin-top:24px}
    table{border-collapse:collapse;width:100%;font-size:13px}
    th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#f5f5f5}</style></head><body>
    <h1>Mframapa Air Quality Export</h1>
    <p>Generated ${new Date().toLocaleString()}</p>
    <h2>Saved locations (${savedCities.length})</h2>
    <table><tr><th>Name</th><th>Country</th><th>PM2.5</th><th>Category</th></tr>${savedRows}</table>
    <h2>Recent checks (${(predictionHistory ?? []).length})</h2>
    <table><tr><th>City</th><th>PM2.5</th><th>Category</th><th>Time</th></tr>${historyRows}</table>
  </body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────

const FORMATS = [
  { key: "CSV",     labelKey: "screen.export.format_csv",     mime: "text/csv",              ext: "csv"     },
  { key: "GeoJSON", labelKey: "screen.export.format_geojson", mime: "application/geo+json",  ext: "geojson" },
  { key: "PDF",     labelKey: "screen.export.format_pdf",     mime: "text/html",             ext: "html"    },
];

export function ExportCentreScreen({ params, isOnline, isDark }) {
  const colors = getColors(isDark ?? true);
  const { goBack } = useNavigation();
  const { state } = useAppState();
  const { t } = useTranslation();

  const [format, setFormat] = useState("CSV");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const savedCities       = state.savedCities ?? [];
  const predictionHistory = state.predictionHistory ?? [];
  const totalRecords      = savedCities.length + predictionHistory.length;

  async function handleGenerate() {
    if (generating) return;
    if (totalRecords === 0) {
      setError(t("screen.export.nothing_to_export"));
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      let body, mime, filename;

      if (format === "CSV") {
        body     = buildCsv(savedCities, predictionHistory);
        mime     = "text/csv";
        filename = `mframapa-${stamp}.csv`;
      } else if (format === "GeoJSON") {
        body     = buildGeoJson(savedCities, predictionHistory);
        mime     = "application/geo+json";
        filename = `mframapa-${stamp}.geojson`;
      } else {
        body     = buildHtml(savedCities, predictionHistory);
        mime     = "text/html";
        filename = `mframapa-${stamp}.html`;
      }

      const blob = new Blob([body], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(t("screen.export.could_not_generate") + " " + (err?.message ?? ""));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 4px" }}>
        <button
          type="button"
          onClick={goBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </button>
        <div style={{ width: 22 }} />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          overflowY: "auto",
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 40,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <span style={{ fontSize: "1.625rem", fontWeight: 800, color: colors.text }}>
          {t("screen.export.title")}
        </span>

        {/* Summary card */}
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.card,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: colors.subtext }}>
              {t("screen.export.saved_locations_count")}
            </span>
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.text }}>
              {savedCities.length}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: colors.subtext }}>
              {t("screen.export.recent_checks_count")}
            </span>
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.text }}>
              {predictionHistory.length}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: colors.subtext }}>
              {t("screen.export.total_records_count")}
            </span>
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: Colors.brandGreen }}>
              {totalRecords}
            </span>
          </div>
        </div>

        {/* Format picker */}
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: colors.subtext, marginBottom: 8 }}>
            {t("screen.export.format")}
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            {FORMATS.map((f) => (
              <label
                key={f.key}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    border: `2px solid ${f.key === format ? Colors.brandGreen : colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {f.key === format && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: Colors.brandGreen,
                      }}
                    />
                  )}
                </div>
                <input
                  type="radio"
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                  checked={f.key === format}
                  onChange={() => setFormat(f.key)}
                />
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: colors.text }}>
                  {t(f.labelKey)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || totalRecords === 0}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            backgroundColor: Colors.brandGreen,
            border: "none",
            cursor: generating || totalRecords === 0 ? "not-allowed" : "pointer",
            opacity: generating || totalRecords === 0 ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 700,
          }}
        >
          <Download size={18} />
          {generating ? "Generating…" : t("screen.export.generate")}
        </button>

        {error ? (
          <p style={{ fontSize: "0.75rem", textAlign: "center", color: Colors.danger }}>
            {error}
          </p>
        ) : (
          <p style={{ fontSize: "0.75rem", textAlign: "center", color: colors.muted }}>
            {format === "PDF"
              ? t("screen.export.pdf_format_explainer")
              : t("screen.export.share_sheet_explainer")}
          </p>
        )}
      </div>
    </div>
  );
}
