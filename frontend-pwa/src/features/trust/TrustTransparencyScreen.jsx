import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { StackBackButton } from "../../components/navigation/StackBackButton.jsx";

const SECTION_IDS = ["calc", "sources", "disclaimers"];

const DATA_SOURCES = [
  { name: "ERA5", noteKey: "screen.trust.source_era5" },
  { name: "Sentinel-5P", noteKey: "screen.trust.source_s5p" },
  { name: "MODIS", noteKey: "screen.trust.source_modis" },
  { name: "Open-Meteo", noteKey: "screen.trust.source_openmeteo" },
  { name: "WorldPop", noteKey: "screen.trust.source_worldpop" },
  { name: "OpenAQ", noteKey: "screen.trust.source_openaq" },
];

export function TrustTransparencyScreen({ isOnline, isDark, params }) {
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  const [open, setOpen] = useState({
    calc: true,
    sources: true,
    disclaimers: false,
  });

  function toggle(id) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function titleKey(id) {
    if (id === "disclaimers") return "screen.trust.disclaim_title";
    return `screen.trust.${id}_title`;
  }

  function bodyKey(id) {
    if (id === "calc") return "screen.trust.calc_body";
    if (id === "disclaimers") return "screen.trust.disclaim_body";
    return null;
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: colors.bg }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}
      >
        <StackBackButton
          onClick={goBack}
          color={colors.text}
          variant="arrow"
          ariaLabel={t("common.go_back")}
        />
        <span style={{ fontSize: "1rem", fontWeight: 700, color: colors.text }}>
          {t("screen.trust.title")}
        </span>
        <div style={{ width: 44 }} />
      </div>

      <div
        style={{
          padding: "4px 16px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            lineHeight: "20px",
            color: colors.subtext,
            margin: "0 0 4px",
          }}
        >
          {t("screen.trust.intro")}
        </p>

        {SECTION_IDS.map((id) => (
          <div
            key={id}
            style={{
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => toggle(id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, flex: 1, color: colors.text }}>
                {t(titleKey(id))}
              </span>
              {open[id] ? (
                <ChevronUp size={18} color={colors.subtext} />
              ) : (
                <ChevronDown size={18} color={colors.subtext} />
              )}
            </button>

            {open[id] && (
              <div
                style={{
                  padding: "0 16px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginBottom: 8,
                  }}
                />
                {id === "sources" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {DATA_SOURCES.map((src) => (
                      <div
                        key={src.name}
                        style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                      >
                        <CheckCircle2
                          size={16}
                          color={Colors.brandGreen}
                          style={{ marginTop: 2, flexShrink: 0 }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{ fontSize: "0.875rem", fontWeight: 600, color: colors.text }}
                            >
                              {src.name}
                            </span>
                            <span
                              style={{
                                fontSize: "0.6875rem",
                                fontWeight: 600,
                                color: Colors.brandGreen,
                              }}
                            >
                              {t("screen.trust.source_active")}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: colors.muted, lineHeight: "16px" }}>
                            {t(src.noteKey)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: "20px",
                      color: colors.subtext,
                      margin: 0,
                    }}
                  >
                    {t(bodyKey(id))}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
