import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getColors, Colors } from "../../utils/colors.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";

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

  const spikeTitle  = alert?.title       ?? t("screen.anomaly.spike_title");
  const spikeDesc   = alert?.description ?? t("screen.anomaly.spike_desc");
  const detectedAgo = alert?.detectedAgo ?? t("screen.anomaly.detected_ago");

  return (
    <div style={{ minHeight: "100dvh", position: "relative" }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Glow orb */}
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

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px 12px",
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
          {t("screen.anomaly.title")}
        </span>
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
          gap: 14,
        }}
      >
        {/* Alert banner */}
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
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
              {spikeTitle}
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: "20px", color: colors.subtext }}>
            {spikeDesc}
          </p>
          <p style={{ fontSize: 12, color: colors.muted }}>
            {detectedAgo}
          </p>
        </div>

        {/* Severity section */}
        <p style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
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
              <p style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
                {t(item.labelKey)}
              </p>
              <p style={{ fontSize: 12, marginTop: 2, color: colors.subtext }}>
                {t(item.infoKey)}
              </p>
            </div>
          </div>
        ))}

        {/* Recommended actions (from params) */}
        {alert?.actions && (
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
            <p style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
              Recommended Actions
            </p>
            {alert.actions.map((action, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: "20px", color: colors.subtext }}>
                • {action}
              </p>
            ))}
          </div>
        )}

        {/* Affected area & time (from params) */}
        {(alert?.area || alert?.time) && (
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
                <span style={{ fontSize: 12, color: colors.subtext }}>Affected area</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{alert.area}</span>
              </div>
            )}
            {alert.time && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: colors.subtext }}>Time</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{alert.time}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
