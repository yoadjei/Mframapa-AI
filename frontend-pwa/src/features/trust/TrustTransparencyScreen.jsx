import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";

const SECTION_IDS = ["calc", "sources", "model", "disclaimers"];

const DATA_SOURCES = ["ERA5", "Sentinel-5P", "MODIS"];

export function TrustTransparencyScreen({ isOnline, isDark, params }) {
  const { state, dispatch } = useAppState();
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  const [open, setOpen] = useState({
    calc: true,
    sources: true,
    model: false,
    disclaimers: false,
  });

  function toggle(id) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Map section id to translation key suffix
  function titleKey(id) {
    if (id === "disclaimers") return "screen.trust.disclaim_title";
    return `screen.trust.${id}_title`;
  }

  function bodyKey(id) {
    if (id === "calc") return "screen.trust.calc_body";
    if (id === "model") return "screen.trust.model_body";
    if (id === "disclaimers") return "screen.trust.disclaim_body";
    return null;
  }

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
        <button
          type="button"
          onClick={goBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
          {t("screen.trust.title")}
        </span>
        <div style={{ width: 30 }} />
      </div>

      {/* Accordion sections */}
      <div
        style={{
          padding: "4px 16px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
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
              <span style={{ fontSize: 15, fontWeight: 700, flex: 1, color: colors.text }}>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {DATA_SOURCES.map((src) => (
                      <div
                        key={src}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: Colors.brandGreen,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{ fontSize: 14, fontWeight: 600, color: colors.text }}
                        >
                          {src}
                        </span>
                        <CheckCircle2 size={14} color={Colors.brandGreen} />
                        <span style={{ fontSize: 14, color: Colors.brandGreen }}>
                          {t("screen.trust.source_active")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: 14,
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
