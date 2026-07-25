import { useState } from "react";
import { Download } from "lucide-react";
import { getColors, Colors } from "../../utils/colors.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useStackChrome, stackTitlePad } from "../../hooks/useStackChrome.js";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { StackBackButton } from "../../components/navigation/StackBackButton.jsx";
import { buildCsv, buildGeoJson, buildHtml } from "../../utils/exportBuilders.js";

const FORMATS = [
  { key: "CSV", labelKey: "screen.export.format_csv", mime: "text/csv", ext: "csv" },
  { key: "GeoJSON", labelKey: "screen.export.format_geojson", mime: "application/geo+json", ext: "geojson" },
  { key: "PDF", labelKey: "screen.export.format_pdf", mime: "text/html", ext: "html" },
];

export function ExportCentreScreen({ params, isOnline, isDark }) {
  const colors = getColors(isDark ?? true);
  const { goBack } = useNavigation();
  const inStack = useStackChrome();
  const { state } = useAppState();
  const { t } = useTranslation();

  const [format, setFormat] = useState("CSV");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const savedCities = state.savedCities ?? [];
  const predictionHistory = state.predictionHistory ?? [];
  const totalRecords = savedCities.length + predictionHistory.length;

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
      let body;
      let mime;
      let filename;

      if (format === "CSV") {
        body = buildCsv(savedCities, predictionHistory);
        mime = "text/csv";
        filename = `mframapa-${stamp}.csv`;
      } else if (format === "GeoJSON") {
        body = buildGeoJson(savedCities, predictionHistory);
        mime = "application/geo+json";
        filename = `mframapa-${stamp}.geojson`;
      } else {
        body = buildHtml(savedCities, predictionHistory);
        mime = "text/html";
        filename = `mframapa-${stamp}.html`;
      }

      const blob = new Blob([body], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
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
    <div style={{ minHeight: "100dvh", backgroundColor: colors.bg }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 4px",
        }}
      >
        <StackBackButton
          onClick={goBack}
          color={colors.text}
          variant="arrow"
          ariaLabel={t("common.go_back")}
        />
        <div style={{ width: 44 }} />
      </div>

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
        <span
          style={{
            fontSize: "1.625rem",
            fontWeight: 800,
            color: colors.text,
            paddingLeft: stackTitlePad(inStack),
          }}
        >
          {t("screen.export.title")}
        </span>

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
