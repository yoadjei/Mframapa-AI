import { AlertTriangle } from "lucide-react";
import { getColors } from "../../utils/colors.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { StackBackButton } from "../../components/navigation/StackBackButton.jsx";
import { PrimaryButton } from "../../components/ui/PrimaryButton.jsx";

const AQI_HIGH = "#FF8C00";

const ITEM_KEYS = [
  { labelKey: "screen.anomaly.item1_label", infoKey: "screen.anomaly.item1_info", color: "#00C896" },
  { labelKey: "screen.anomaly.item2_label", infoKey: "screen.anomaly.item2_info", color: "#F5C518" },
  { labelKey: "screen.anomaly.item3_label", infoKey: "screen.anomaly.item3_info", color: "#E53935" },
  { labelKey: "screen.anomaly.item4_label", infoKey: "screen.anomaly.item4_info", color: "#00C896" },
];

export function AnomalyAlertScreen({ params, isOnline, isDark }) {
  const colors = getColors(isDark ?? true);
  const { goBack } = useNavigation();
  const { t } = useTranslation();

  const alert = params?.alert ?? null;

  return (
    <div style={{ minHeight: "100dvh", position: "relative" }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {alert ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: AQI_HIGH,
            opacity: 0.12,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px 12px",
        }}
      >
        <StackBackButton
          onClick={goBack}
          color={colors.text}
          variant="arrow"
          ariaLabel={t("common.go_back")}
        />
        <span style={{ fontSize: "1rem", fontWeight: 700, color: colors.text }}>
          {t("screen.anomaly.title")}
        </span>
        <div style={{ width: 44 }} />
      </div>

      {!alert ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "48px 24px",
          }}
        >
          <p
            style={{
              fontSize: "0.9375rem",
              textAlign: "center",
              color: colors.subtext,
              margin: 0,
            }}
          >
            {t("screen.anomaly.empty")}
          </p>
          <PrimaryButton label={t("common.back")} onClick={goBack} />
        </div>
      ) : (
        <div
          style={{
            overflowY: "auto",
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 40,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              backgroundColor: AQI_HIGH + "15",
              border: `1px solid ${AQI_HIGH + "60"}`,
              borderRadius: 16,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={22} color={AQI_HIGH} />
              <span style={{ fontSize: "1rem", fontWeight: 700, color: colors.text }}>
                {alert.title ?? t("screen.anomaly.spike_title")}
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: "20px", color: colors.subtext }}>
              {alert.description ?? t("screen.anomaly.spike_desc")}
            </p>
            {alert.detectedAgo ? (
              <p style={{ fontSize: "0.75rem", color: colors.muted }}>
                {alert.detectedAgo}
              </p>
            ) : null}
          </div>

          <p style={{ fontSize: "1rem", fontWeight: 700, color: colors.text }}>
            {t("screen.anomaly.severity")}
          </p>

          {ITEM_KEYS.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "6px 0" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: item.color,
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: colors.text }}>
                  {t(item.labelKey)}
                </p>
                <p style={{ fontSize: "0.75rem", marginTop: 2, color: colors.subtext }}>
                  {t(item.infoKey)}
                </p>
              </div>
            </div>
          ))}

          {alert.actions && (
            <div
              style={{
                marginTop: 8,
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: colors.text }}>
                {t("anomaly.recommended_actions")}
              </p>
              {alert.actions.map((action, i) => (
                <p key={i} style={{ fontSize: "0.875rem", lineHeight: "20px", color: colors.subtext }}>
                  • {action}
                </p>
              ))}
            </div>
          )}

          {(alert.area || alert.time) && (
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {alert.area && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: colors.subtext }}>{t("anomaly.affected_area")}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: colors.text }}>{alert.area}</span>
                </div>
              )}
              {alert.time && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: colors.subtext }}>Time</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: colors.text }}>{alert.time}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
