import { useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import { getColors, Colors } from "../../utils/colors.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { sendFeedback } from "../../services/api.js";
import { StackBackButton } from "../../components/navigation/StackBackButton.jsx";

const CATEGORY_SLUGS = ["bug", "feature", "data", "general"];

const CATEGORY_KEYS = [
  "screen.feedback.cat_bug",
  "screen.feedback.cat_feature",
  "screen.feedback.cat_data",
  "screen.feedback.cat_general",
];

export function FeedbackFormScreen({ params, isOnline, isDark }) {
  const colors = getColors(isDark ?? true);
  const { goBack } = useNavigation();
  const { t } = useTranslation();

  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (submitting) return;
    if (!message.trim()) {
      setError(t("screen.feedback.message_required"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await sendFeedback({
        category: CATEGORY_SLUGS.includes(category) ? category : "general",
        message,
        email,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.message ?? t("screen.feedback.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
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
          backgroundColor: colors.bg,
        }}
      >
        <CheckCircle2 size={64} color={Colors.brandGreen} />
        <p style={{ fontSize: "1.5rem", fontWeight: 800, color: colors.text }}>
          {t("screen.feedback.title")}
        </p>
        <p style={{ fontSize: "0.875rem", color: colors.subtext }}>
          {t("screen.feedback.privacy_note")}
        </p>
        <button
          type="button"
          onClick={goBack}
          style={{
            marginTop: 16,
            padding: "12px 32px",
            borderRadius: 999,
            backgroundColor: Colors.brandGreen,
            border: "none",
            cursor: "pointer",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 700,
          }}
        >
          {t("common.done") !== "common.done" ? t("common.done") : "Done"}
        </button>
      </div>
    );
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
          backgroundColor: colors.card,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <StackBackButton
          onClick={goBack}
          color={colors.text}
          variant="arrow"
          ariaLabel={t("common.go_back")}
        />
        <span style={{ fontSize: "1.0625rem", fontWeight: 600, color: colors.text }}>
          {t("screen.feedback.nav_title")}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 600,
            color: Colors.brandGreen,
          }}
        >
          {t("screen.feedback.submit")}
        </button>
      </div>

      <div
        style={{
          overflowY: "auto",
          padding: "20px 16px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span style={{ fontSize: "1.375rem", fontWeight: 800, color: colors.text }}>
          {t("screen.feedback.title")}
        </span>

        <div>
          <label
            htmlFor="feedback-category"
            style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: colors.subtext,
              marginBottom: 8,
            }}
          >
            {t("screen.feedback.category")}
          </label>
          <select
            id="feedback-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              padding: 14,
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: colors.text,
              fontFamily: "inherit",
              appearance: "auto",
              cursor: "pointer",
            }}
          >
            {CATEGORY_SLUGS.map((slug, i) => (
              <option key={slug} value={slug}>
                {t(CATEGORY_KEYS[i])}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.card,
            padding: 14,
            minHeight: 140,
          }}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("screen.feedback.message_placeholder")}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: "0.9375rem",
              color: colors.text,
              minHeight: 120,
              fontFamily: "inherit",
            }}
          />
        </div>

        <button
          type="button"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 999,
            border: `1.5px solid ${Colors.brandGreen}`,
            backgroundColor: "transparent",
            padding: "14px 0",
            cursor: "pointer",
          }}
        >
          <Camera size={18} color={Colors.brandGreen} />
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: Colors.brandGreen }}>
            {t("screen.feedback.attach")}
          </span>
        </button>

        <div>
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: colors.subtext,
              marginBottom: 8,
            }}
          >
            {t("screen.feedback.your_email")}
          </p>
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              padding: 14,
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("screen.feedback.email_placeholder")}
              autoCapitalize="none"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "0.9375rem",
                color: colors.text,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              fontSize: "0.8125rem",
              color: Colors.danger,
              backgroundColor: "rgba(229,57,53,0.08)",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            backgroundColor: Colors.brandGreen,
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1,
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 700,
          }}
        >
          {submitting ? "Submitting…" : t("screen.feedback.submit_btn")}
        </button>

        <p style={{ fontSize: "0.75rem", textAlign: "center", color: colors.muted }}>
          {t("screen.feedback.privacy_note")}
        </p>
      </div>
    </div>
  );
}
