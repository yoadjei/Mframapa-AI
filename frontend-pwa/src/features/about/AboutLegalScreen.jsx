import { ArrowLeft, ChevronRight, Leaf } from "lucide-react";
import { getColors, Colors } from "../../utils/colors.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";

const LINK_KEYS = [
  { key: "settings.about.privacy",  href: "https://mframapa.ai/privacy"  },
  { key: "settings.about.terms",    href: "https://mframapa.ai/terms"    },
  { key: "settings.about.licenses", href: "https://mframapa.ai/licenses" },
  { key: "settings.about.contact",  href: "mailto:hello@mframapa.ai"     },
  { key: "settings.about.credits",  href: "https://mframapa.ai/credits"  },
];

export function AboutLegalScreen({ params, isOnline, isDark }) {
  const colors = getColors(isDark ?? true);
  const { goBack } = useNavigation();
  const { t } = useTranslation();

  function handleLinkClick(href) {
    if (href.startsWith("http") || href.startsWith("mailto")) {
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
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
          style={{ width: 36, height: 36 }}
          aria-label="Go back"
        >
          <ArrowLeft size={22} color={colors.text} />
        </button>
        <div style={{ width: 36 }} />
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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Leaf size={28} color={Colors.brandGreen} />
            <span
              style={{
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "-0.5px",
                color: Colors.brandGreen,
              }}
            >
              mframapa
            </span>
          </div>
          <p style={{ fontSize: 13, color: colors.muted }}>
            {t("about.version_build")}
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
              <span style={{ fontSize: 15, color: colors.text }}>
                {t(link.key)}
              </span>
              <ChevronRight size={16} color={colors.muted} />
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, marginTop: 32, color: colors.muted }}>
          {t("settings.made_with")}
        </p>
      </div>
    </div>
  );
}
