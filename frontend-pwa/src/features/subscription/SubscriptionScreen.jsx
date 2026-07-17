import { useState } from "react";
import { ChevronLeft, CheckCircle2, FlaskConical, Building2, Leaf, Check } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { OutlineButton } from "../../components/ui/OutlineButton.jsx";

const MANAGE_SUB_URL = "https://billing.stripe.com/p/login/";

const PLAN_COMPARE_KEYS = [
  {
    nameKey: "screen.subscription.plan_free",
    colorKey: "subtext",
    borderKey: "border",
    features: [
      "screen.pricing.feat.basic_aqi",
      "screen.pricing.feat.search",
      "screen.pricing.feat.saved_3",
    ],
  },
  {
    nameKey: "screen.subscription.plan_researcher",
    colorKey: "brandGreen",
    borderKey: "brandGreen",
    features: [
      "screen.pricing.feat.saved_unlimited",
      "screen.pricing.feat.ai_insights",
      "screen.pricing.feat.predictions",
      "screen.pricing.feat.health_risk",
      "screen.pricing.feat.historical",
      "screen.pricing.feat.compare",
      "screen.pricing.feat.exports",
    ],
  },
  {
    nameKey: "screen.subscription.plan_institutional",
    colorKey: "enterprise",
    borderKey: "enterprise",
    features: [
      "screen.pricing.feat.anomaly",
      "screen.pricing.feat.heatmap",
      "screen.pricing.feat.batch",
      "screen.pricing.feat.api",
      "screen.pricing.feat.country",
    ],
  },
];

function renderPlanCard({ mode, colors, t, trialEndsDate, daysLeft, progressPct, subscriptionPlan, subscriptionExpiresAt }) {
  if (mode === "trial") {
    return (
      <div
        className="mb-4 flex flex-col gap-2 rounded-2xl p-4"
        style={{ backgroundColor: colors.card, border: `1.5px solid ${Colors.brandGreen}` }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} color={Colors.brandGreen} />
          <span className="text-[16px] font-bold" style={{ color: Colors.brandGreen }}>
            {t("screen.subscription.pro_trial")}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: colors.border }}
        >
          <div
            className="h-1.5 rounded-full"
            style={{ width: progressPct, backgroundColor: Colors.brandGreen }}
          />
        </div>
        <p className="text-[15px] font-semibold" style={{ color: colors.text }}>
          {t("screen.subscription.days_remaining", { count: String(daysLeft) })}
        </p>
        <p className="text-[13px]" style={{ color: colors.subtext }}>
          {t("screen.subscription.trial_ends_date", { date: trialEndsDate })}
        </p>
      </div>
    );
  }
  if (mode === "researcher") {
    const planLabel =
      subscriptionPlan === "researcher_annual"
        ? t("screen.subscription.plan_researcher_annual")
        : subscriptionPlan === "researcher_monthly"
        ? t("screen.subscription.plan_researcher_monthly")
        : t("screen.subscription.plan_researcher");
    const renewsOn = subscriptionExpiresAt
      ? new Date(subscriptionExpiresAt).toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";
    return (
      <div
        className="mb-4 flex flex-col gap-2 rounded-2xl p-4"
        style={{ backgroundColor: colors.card, border: `1.5px solid ${Colors.brandGreen}` }}
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={16} color={Colors.brandGreen} />
          <span className="text-[16px] font-bold" style={{ color: Colors.brandGreen }}>
            {planLabel}
          </span>
        </div>
        <p className="text-[15px] font-semibold" style={{ color: colors.text }}>
          {t("screen.subscription.subscription_active")}
        </p>
        {renewsOn ? (
          <p className="text-[13px]" style={{ color: colors.subtext }}>
            {t("screen.subscription.renews_on", { date: renewsOn })}
          </p>
        ) : null}
      </div>
    );
  }
  if (mode === "institutional") {
    return (
      <div
        className="mb-4 flex flex-col gap-2 rounded-2xl p-4"
        style={{ backgroundColor: colors.card, border: `1.5px solid ${Colors.enterprise}` }}
      >
        <div className="flex items-center gap-2">
          <Building2 size={16} color={Colors.enterprise} />
          <span className="text-[16px] font-bold" style={{ color: Colors.enterprise }}>
            {t("screen.subscription.plan_institutional")}
          </span>
        </div>
        <p className="text-[15px] font-semibold" style={{ color: colors.text }}>
          {t("screen.subscription.enterprise_active")}
        </p>
      </div>
    );
  }
  // Free
  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-2xl p-4"
      style={{ backgroundColor: colors.card, border: `1.5px solid ${colors.border}` }}
    >
      <div className="flex items-center gap-2">
        <Leaf size={16} color={colors.subtext} />
        <span className="text-[16px] font-bold" style={{ color: colors.text }}>
          {t("screen.subscription.plan_free")}
        </span>
      </div>
      <p className="text-[13px]" style={{ color: colors.subtext }}>
        {t("screen.subscription.free_plan_blurb")}
      </p>
    </div>
  );
}

export function SubscriptionScreen({ isDark, isOnline, params }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { goBack, navigate } = useNavigation();
  const colors = getColors(isDark);

  const tier                  = state.session?.tier ?? "free";
  const trialStartedAt        = state.session?.trialStartedAt ?? null;
  const trialEndsAt           = state.session?.trialEndsAt ?? null;
  const subscriptionPlan      = state.session?.subscriptionPlan ?? null;
  const subscriptionExpiresAt = state.session?.subscriptionExpiresAt ?? null;

  const [restoring, setRestoring]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Derived trial state
  const trialActive = !!trialEndsAt && new Date(trialEndsAt) > new Date();
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialProgress =
    trialStartedAt && trialEndsAt
      ? Math.min(
          1,
          (new Date() - new Date(trialStartedAt)) /
            (new Date(trialEndsAt) - new Date(trialStartedAt))
        )
      : 0;
  const progressPct = `${Math.round(trialProgress * 100)}%`;
  const trialEndsDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const mode =
    tier === "institutional"             ? "institutional" :
    tier === "researcher" && trialActive ? "trial"         :
    tier === "researcher"                ? "researcher"    :
                                           "free";

  function handleUpgrade() {
    navigate("pricing");
  }

  function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      window.alert(t("screen.paywall.nothing_to_restore"));
    }, 800);
  }

  function handleManage() {
    window.open(MANAGE_SUB_URL, "_blank", "noopener,noreferrer");
  }

  function handleCancel() {
    if (cancelling || mode === "free") return;

    if (mode === "trial") {
      const confirmed = window.confirm(
        `${t("screen.subscription.cancel_trial_heading")}\n\n${t("screen.subscription.cancel_trial_warning")}`
      );
      if (confirmed) {
        setCancelling(true);
        dispatch({ type: "UPDATE_TIER", payload: "free" });
        setCancelling(false);
        window.alert(t("screen.subscription.trial_cancelled_message"));
      }
      return;
    }

    // Paid — redirect to manage page
    handleManage();
  }

  // Billing history derived from trial start
  const billingEntries = trialStartedAt
    ? [
        {
          id: "trial-start",
          label: t("screen.subscription.entry_trial_started"),
          date: new Date(trialStartedAt).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          amount: t("screen.subscription.amount_free"),
        },
      ]
    : [];

  const planCardProps = {
    mode,
    colors,
    t,
    trialEndsDate,
    daysLeft,
    progressPct,
    subscriptionPlan,
    subscriptionExpiresAt,
  };

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Safe area top spacer */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ paddingTop: 8 }}>
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
        >
          <ChevronLeft size={22} color={colors.text} />
        </button>

        <span className="text-[17px] font-semibold" style={{ color: colors.text }}>
          {t("screen.subscription.title")}
        </span>

        <div style={{ width: 22 }} />
      </div>

      {/* Scrollable content */}
      <div
        className="flex flex-col px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)" }}
      >
        {/* Current plan section */}
        <p className="mb-3 text-[20px] font-bold" style={{ color: colors.text }}>
          {t("screen.subscription.current_plan")}
        </p>

        {renderPlanCard(planCardProps)}

        {/* Free tier upgrade nudge */}
        {mode === "free" ? (
          <div className="mb-4">
            <OutlineButton
              label={t("screen.subscription.see_all_plans")}
              onClick={handleUpgrade}
              color={Colors.brandGreen}
            />
          </div>
        ) : null}

        {/* Plan comparison — horizontal scroll */}
        <div className="mb-6 flex gap-2.5 overflow-x-auto pb-1">
          {PLAN_COMPARE_KEYS.map((plan) => {
            const color =
              plan.colorKey === "brandGreen"
                ? Colors.brandGreen
                : plan.colorKey === "enterprise"
                ? Colors.enterprise
                : colors.subtext;
            const borderColor =
              plan.borderKey === "brandGreen"
                ? Colors.brandGreen
                : plan.borderKey === "enterprise"
                ? Colors.enterprise
                : colors.border;
            return (
              <div
                key={plan.nameKey}
                className="flex min-w-[160px] flex-shrink-0 flex-col gap-1.5 rounded-xl p-3.5"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <p className="mb-1 text-[15px] font-bold" style={{ color }}>
                  {t(plan.nameKey)}
                </p>
                {plan.features.map((fk) => (
                  <div key={fk} className="flex items-start gap-1.5">
                    <Check size={13} color={color} className="mt-0.5 flex-shrink-0" />
                    <span
                      className="flex-1 text-[12px] leading-4"
                      style={{ color: colors.subtext }}
                    >
                      {t(fk)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Restore purchases */}
        <OutlineButton
          label={restoring ? t("screen.paywall.restoring") : t("screen.subscription.restore")}
          onClick={handleRestore}
          className="mb-3"
        />

        {/* Cancel — only when something is cancellable */}
        {mode !== "free" ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="mb-6 py-2 text-[14px] font-semibold active:opacity-70"
            style={{ color: Colors.danger }}
          >
            {mode === "trial"
              ? t("screen.subscription.cancel_trial")
              : t("screen.subscription.cancel")}
          </button>
        ) : null}

        {/* Billing history */}
        <p
          className="mb-3 mt-6 text-[20px] font-bold"
          style={{ color: colors.text }}
        >
          {t("screen.subscription.billing_history")}
        </p>

        {billingEntries.length === 0 ? (
          <p className="mb-4 text-[14px]" style={{ color: colors.subtext }}>
            {t("screen.subscription.no_charges")}
          </p>
        ) : (
          billingEntries.map((entry) => (
            <div
              key={entry.id}
              className="mb-2 flex items-center rounded-xl border p-3.5"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <div className="flex-1">
                <p className="text-[14px] font-semibold" style={{ color: colors.text }}>
                  {entry.label}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: colors.subtext }}>
                  {entry.date}
                </p>
              </div>
              <span className="text-[14px] font-bold" style={{ color: Colors.brandGreen }}>
                {entry.amount}
              </span>
            </div>
          ))
        )}

        {/* Manage subscription */}
        <button
          type="button"
          onClick={handleManage}
          className="mt-2 py-2 text-[13px] font-semibold active:opacity-70"
          style={{ color: Colors.brandGreen }}
        >
          {t("screen.subscription.manage_android")}
        </button>
      </div>
    </div>
  );
}
