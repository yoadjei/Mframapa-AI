import { ChevronRight } from "lucide-react";
import { MframapaLogo } from "../../components/brand/MframapaLogo.jsx";
import { getColors } from "../../utils/colors.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { StackBackButton } from "../../components/navigation/StackBackButton.jsx";
import { BUILD_INFO } from "../../buildInfo.js";

// Store listing / TWA / Expo ship as 1.0.0. Keep About in lockstep.
const APP_VERSION = BUILD_INFO?.version ?? "1.0.0";

const LINK_KEYS = [
  { key: "settings.about.privacy",  href: "/privacy.html"  },
  { key: "settings.about.terms",    href: "/terms.html"    },
  { key: "settings.about.licenses", href: "/licenses.html" },
  { key: "settings.about.contact",  href: "mailto:hello@mframapa.live"     },
];

export function AboutLegalScreen({ params, isOnline, isDark }) {
  const colors = getColors(isDark ?? true);
  const { goBack } = useNavigation();
  const { t } = useTranslation();

  function handleLinkClick(href) {
    if (href.startsWith("http") || href.startsWith("mailto") || href.startsWith("/")) {
      window.open(href, "_blank", "noopener noreferrer");
    }
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
          padding: "8px 16px 4px",
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

      {/* Scrollable content */}
      <div
        style={{
          overflowY: "auto",
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 40,
            paddingBottom: 40,
            gap: 8,
          }}
        >
          <MframapaLogo size="xl" isDark={isDark} markOnly />
          <p style={{ fontSize: "0.8125rem", color: colors.muted }}>
            {`Version ${APP_VERSION}`}
          </p>
        </div>

        {/* Link list */}
        <div
          style={{
            width: "100%",
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          {LINK_KEYS.map((link, i) => (
            <button
              key={link.key}
              type="button"
              onClick={() => handleLinkClick(link.href)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "15px 16px",
                backgroundColor: colors.card,
                border: "none",
                borderBottom:
                  i < LINK_KEYS.length - 1 ? `1px solid ${colors.border}` : "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "0.9375rem", color: colors.text }}>
                {t(link.key)}
              </span>
              <ChevronRight size={16} color={colors.muted} />
            </button>
          ))}
        </div>

        <p style={{ fontSize: "0.8125rem", marginTop: 32, color: colors.muted }}>
        </p>
      </div>
    </div>
  );
}
