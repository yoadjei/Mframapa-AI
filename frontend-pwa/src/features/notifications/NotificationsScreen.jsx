import { useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Settings, AlertTriangle, FileText, Satellite, Lightbulb, CheckCheck, X } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors, liquidGlass } from "../../utils/colors.js";
import { StackTitle } from "../../components/navigation/StackTitle.jsx";
import { Switch } from "../../components/ui/Switch.jsx";
import { useStackChrome, stackTopPad } from "../../hooks/useStackChrome.js";
import { getNotificationPermission } from "../../services/browserNotifications.js";
import {
  NotificationPermissionSheet,
  hasSeenPushPrompt,
} from "../../components/pwa/NotificationPermissionSheet.jsx";

// ─── Notification Settings Sheet ────────────────────────────────────────────

const CATEGORIES = [
  { key: "alert",   labelKey: "notif_prefs.air_quality_alerts",  Icon: AlertTriangle },
  { key: "summary", labelKey: "notif_prefs.daily_summaries",     Icon: FileText },
  { key: "update",  labelKey: "notif_prefs.air_quality_updates", Icon: Satellite },
  { key: "tip",     labelKey: "notif_prefs.tips_and_guidance",   Icon: Lightbulb },
];

function NotificationSettingsSheet({
  visible,
  onClose,
  onMarkAllRead,
  isDark,
  unreadCount,
  onRequestPushPermission,
}) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const colors = getColors(isDark);

  const alertsEnabled = state.preferences.notificationsEnabled ?? true;
  const notifPrefs = {
    alert: true,
    summary: true,
    update: true,
    tip: true,
    ...(state.preferences.notifPrefs ?? {}),
  };

  function setAlertsEnabled(val) {
    dispatch({ type: "UPDATE_PREFERENCES", payload: { notificationsEnabled: val } });
    if (val) onRequestPushPermission?.();
  }

  function setNotifPref(key, val) {
    dispatch({
      type: "UPDATE_PREFERENCES",
      payload: { notifPrefs: { ...notifPrefs, [key]: val } },
    });
  }

  if (!visible) return null;

  return createPortal(
    /* overlay — z-[90] above GlassTabBar (z-50) and install prompt (z-80) */
    <div
      className="fixed inset-0 z-[90] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* liquid glass sheet */}
      <div
        className="relative flex flex-col rounded-t-[24px] px-4 pt-2"
        style={{
          ...liquidGlass(isDark),
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          maxHeight: "80dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full"
          style={{ backgroundColor: colors.border }}
        />

        {/* header */}
        <div className="flex items-center justify-between pb-3">
          <span className="text-[1.125rem] font-bold" style={{ color: colors.text }}>
            {t("notif_prefs.title")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 active:opacity-60"
            aria-label={t("common.close")}
          >
            <X size={20} color={colors.subtext} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* master switch */}
          <div
            className="flex items-center gap-3 py-[14px]"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <div className="flex-1">
              <p className="text-[0.9375rem] font-medium" style={{ color: colors.text }}>
                {t("notif_prefs.all_notifications")}
              </p>
              <p className="mt-0.5 text-[0.75rem]" style={{ color: colors.subtext }}>
                {t("notif_prefs.all_notifications_explainer")}
              </p>
            </div>
            <Switch
              checked={alertsEnabled}
              onChange={setAlertsEnabled}
              trackOff={colors.border}
              ariaLabel={t("notif_prefs.all_notifications")}
            />
          </div>

          {/* per-category section label */}
          <p
            className="mt-4 mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.5px]"
            style={{ color: colors.muted }}
          >
            {t("notif_prefs.categories")}
          </p>

          {CATEGORIES.map(({ key, labelKey, Icon }) => {
            const on = Boolean(notifPrefs[key]);
            return (
              <div
                key={key}
                className="flex items-center gap-3 py-[14px]"
                style={{
                  borderBottom: `1px solid ${colors.border}`,
                  opacity: alertsEnabled ? 1 : 0.5,
                }}
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: Colors.brandGreen + "22" }}
                >
                  <Icon size={18} color={Colors.brandGreen} />
                </div>
                <p className="flex-1 text-[0.9375rem] font-medium" style={{ color: colors.text }}>
                  {t(labelKey)}
                </p>
                <Switch
                  checked={alertsEnabled && on}
                  disabled={!alertsEnabled}
                  onChange={(val) => setNotifPref(key, val)}
                  trackOff={colors.border}
                  ariaLabel={t(labelKey)}
                />
              </div>
            );
          })}

          {/* mark all read action */}
          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={() => { onMarkAllRead(); onClose(); }}
            className="mt-5 mb-2 flex w-full items-center gap-[10px] rounded-xl border px-[14px] py-[14px] active:opacity-70 disabled:opacity-50"
            style={{ borderColor: colors.border }}
          >
            <CheckCheck size={18} color={Colors.brandGreen} />
            <span className="text-[0.9375rem] font-medium" style={{ color: colors.text }}>
              {unreadCount > 0
                ? t("notif_prefs.mark_count_as_read", { count: String(unreadCount) })
                : t("notif_prefs.nothing_unread")}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Helper: icon for notification type ────────────────────────────────────

function iconForType(type) {
  if (type === "alert")   return AlertTriangle;
  if (type === "summary") return FileText;
  if (type === "update")  return Satellite;
  if (type === "tip")     return Lightbulb;
  return Bell;
}

function shouldOfferPushPrompt() {
  const perm = getNotificationPermission();
  if (perm === "granted" || perm === "unsupported" || perm === "denied") return false;
  return !hasSeenPushPrompt();
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export function NotificationsScreen({ isOnline, isDark }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const inStack = useStackChrome();
  const colors = getColors(isDark);

  const notifications = state.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pushPromptOpen, setPushPromptOpen] = useState(false);
  const [reopenSettingsAfterPrompt, setReopenSettingsAfterPrompt] = useState(false);

  function offerPushPromptIfNeeded() {
    if (!shouldOfferPushPrompt()) return;
    // Settings sheet is z-90; close it so this z-85 prompt is interactive.
    setSettingsOpen(false);
    setPushPromptOpen(true);
  }

  function openSettings() {
    // Soft prompt the first time Alerts settings opens (if master on / default).
    const masterOn = state.preferences.notificationsEnabled !== false;
    if (masterOn && shouldOfferPushPrompt()) {
      setReopenSettingsAfterPrompt(true);
      setPushPromptOpen(true);
      return;
    }
    setSettingsOpen(true);
  }

  function handlePushPromptClose() {
    setPushPromptOpen(false);
    if (reopenSettingsAfterPrompt) {
      setReopenSettingsAfterPrompt(false);
      setSettingsOpen(true);
    }
  }

  function handleMarkAll() {
    if (unreadCount === 0) return;
    dispatch({ type: "MARK_ALL_READ" });
  }

  function handleMarkRead(id) {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: id });
  }

  return (
    <div
      className={inStack ? "" : "min-h-[100dvh]"}
      style={{
        paddingTop: stackTopPad(inStack),
      }}
    >
      <div
        className={inStack ? "" : "overflow-y-auto"}
        style={{
          paddingBottom: inStack
            ? "calc(24px + env(safe-area-inset-bottom))"
            : "calc(env(safe-area-inset-bottom) + 100px)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* title + unread pill — StackTitle clears fixed back when opened from profile */}
          <div className="flex flex-1 min-w-0 items-center gap-[10px]">
            <StackTitle
              as="h1"
              className="text-[1.75rem] font-extrabold leading-tight"
              style={{ color: colors.text }}
            >
              {t("alerts.title")}
            </StackTitle>
            {unreadCount > 0 ? (
              <span
                className="flex h-[22px] min-w-[24px] items-center justify-center rounded-full px-2 text-[0.75rem] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: Colors.brandGreen }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>

          {/* right controls */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className="text-[0.8125rem] font-semibold active:opacity-60 disabled:opacity-40"
              style={{ color: Colors.brandGreen }}
            >
              {t("alerts.mark_all_action", "Mark all as read")}
            </button>
            <button
              type="button"
              aria-label={t("alerts.open_settings")}
              onClick={openSettings}
              className="active:opacity-60"
            >
              <Settings size={20} color={colors.subtext} />
            </button>
          </div>
        </div>

        {/* ── List or empty state ── */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-8 pt-20">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surface }}
            >
              <Bell size={28} color={colors.subtext} />
            </div>
            <p className="text-[1.0625rem] font-bold" style={{ color: colors.text }}>
              {t("alerts.empty_title")}
            </p>
            <p className="text-center text-[0.875rem] leading-relaxed" style={{ color: colors.subtext }}>
              {t("alerts.empty_on")}
            </p>
          </div>
        ) : (
          <ul>
            {notifications.map((item, idx) => {
              const isUnread = !item.read;
              const Icon = iconForType(item.type);

              // resolve display text (supports titleKey/subtitleKey pattern from mobile store)
              const title = item.title ?? "";
              const subtitle = item.subtitle ?? item.body ?? item.message ?? "";
              const timestamp = item.createdAt
                ? new Date(item.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : item.timestamp ?? "";

              return (
                <li key={item.id}>
                  {/* hairline separator above (except first row) */}
                  {idx > 0 ? (
                    <div
                      className="ml-[68px]"
                      style={{ height: 1, backgroundColor: colors.border }}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleMarkRead(item.id)}
                    className="relative z-0 flex w-full items-center gap-3 px-4 py-[14px] text-left active:opacity-70"
                    style={{
                      backgroundColor: isUnread ? Colors.brandGreen + "12" : "transparent",
                      borderLeft: isUnread
                        ? `3px solid ${Colors.brandGreen}`
                        : "3px solid transparent",
                    }}
                  >
                    {/* icon bubble */}
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isUnread ? Colors.brandGreen + "22" : colors.surface,
                      }}
                    >
                      <Icon
                        size={22}
                        color={isUnread ? Colors.brandGreen : colors.subtext}
                      />
                    </div>

                    {/* text block */}
                    <div className="flex-1 min-w-0" style={{ gap: 2 }}>
                      <p
                        className="text-[0.9375rem] leading-snug"
                        style={{
                          color: colors.text,
                          fontWeight: isUnread ? "700" : "500",
                        }}
                      >
                        {title}
                      </p>
                      {subtitle ? (
                        <p className="mt-0.5 text-[0.8125rem] leading-snug" style={{ color: colors.subtext }}>
                          {subtitle}
                        </p>
                      ) : null}
                      {timestamp ? (
                        <p className="mt-1 text-[0.75rem]" style={{ color: colors.muted }}>
                          {timestamp}
                        </p>
                      ) : null}
                    </div>

                    {/* Type icon only — no redundant trailing bell */}
                    {isUnread ? (
                      <span className="text-sm font-semibold flex-shrink-0" style={{ color: Colors.brandGreen }}>
                        {t("alerts.mark_read_hint", "Tap to mark read")}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Notification Settings Sheet (portaled) ── */}
      <NotificationSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onMarkAllRead={handleMarkAll}
        isDark={isDark}
        unreadCount={unreadCount}
        onRequestPushPermission={offerPushPromptIfNeeded}
      />

      <NotificationPermissionSheet
        open={pushPromptOpen}
        onClose={handlePushPromptClose}
        isDark={isDark}
      />
    </div>
  );
}
