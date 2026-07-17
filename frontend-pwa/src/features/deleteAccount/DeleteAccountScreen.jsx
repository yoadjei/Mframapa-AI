import { useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getColors, Colors } from "../../utils/colors.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

export function DeleteAccountScreen({ params, isOnline, isDark }) {
  const colors = getColors(isDark ?? true);
  const { goBack } = useNavigation();
  const { dispatch } = useAppState();
  const { t } = useTranslation();

  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const canDelete = confirm === "DELETE";

  async function handleDelete() {
    if (!canDelete || deleting) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setDeleting(false);
    setDone(true);
    setTimeout(() => {
      dispatch({ type: "LOGOUT" });
      goBack();
    }, 1500);
  }

  if (done) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.danger + "22",
          }}
        >
          <AlertTriangle size={36} color={Colors.danger} />
        </div>
        <p style={{ fontSize: 21, fontWeight: 800, color: colors.text }}>
          {t("delete.title")}
        </p>
        <p style={{ fontSize: 14, color: colors.subtext }}>
          {t("delete.note_body")}
        </p>
      </div>
    );
  }

  const checklistItems = [
    t("delete.item.erase"),
    t("delete.item.saved_cities"),
    t("delete.item.subscriptions"),
    t("delete.item.api_keys"),
  ];

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
          paddingTop: 8,
          paddingBottom: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Warning icon */}
        <div style={{ marginBottom: 8 }}>
          <AlertTriangle size={64} color={Colors.danger} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, textAlign: "center", margin: 0 }}>
          {t("delete.title")}
        </h1>

        <p style={{ fontSize: 16, textAlign: "center", color: colors.subtext, margin: 0 }}>
          {t("delete.warning_prefix")}{" "}
          <span style={{ fontWeight: 800, color: colors.text }}>{t("delete.warning_strong")}</span>
        </p>

        {/* Checklist */}
        <div
          style={{
            width: "100%",
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {checklistItems.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: Colors.danger,
                  width: 20,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                ✕
              </span>
              <span style={{ fontSize: 15, color: colors.subtext }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Note */}
        <p style={{ fontSize: 13, lineHeight: "18px", textAlign: "center", color: colors.muted, margin: 0 }}>
          <span style={{ fontWeight: 600, color: colors.subtext }}>{t("delete.note_label")}</span>{" "}
          {t("delete.note_body")}
        </p>

        {/* Confirm input */}
        <div style={{ width: "100%" }}>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t("delete.placeholder")}
            style={{
              width: "100%",
              borderRadius: 12,
              border: `1px solid ${confirm === "DELETE" ? Colors.danger : colors.border}`,
              backgroundColor: colors.card,
              padding: "14px",
              fontSize: 14,
              color: colors.text,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            backgroundColor: Colors.danger,
            border: "none",
            cursor: canDelete && !deleting ? "pointer" : "not-allowed",
            opacity: canDelete && !deleting ? 1 : 0.5,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {deleting ? "Deleting…" : t("delete.confirm_button")}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={goBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            color: colors.muted,
            marginTop: 4,
          }}
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
