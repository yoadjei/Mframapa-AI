import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";

/**
 * A blocking confirm for irreversible or surprising actions (sign out, delete
 * account). Native `confirm()` is inconsistent across mobile browsers and
 * unstyled, so this is a small in-app modal that matches the theme and is
 * reachable by keyboard and screen reader.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
  isDark = true,
}) {
  const { t } = useTranslation();
  const colors = getColors(isDark);
  if (!open) return null;

  const accent = destructive ? Colors.danger : Colors.brandGreen;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mf-glass"
        style={{ width: "100%", maxWidth: 340, borderRadius: 18, padding: 24 }}
      >
        <p style={{ fontSize: "1.0625rem", fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>
          {title}
        </p>
        <p style={{ fontSize: "0.9375rem", lineHeight: 1.5, color: colors.subtext, margin: "0 0 22px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: "transparent",
              color: colors.text,
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {cancelLabel ?? t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 12,
              border: "none",
              background: accent,
              color: destructive ? "#FFFFFF" : "#00110B",
              fontSize: "0.9375rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
