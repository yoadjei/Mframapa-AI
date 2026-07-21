import { useState } from "react";
import { Bell, Settings, AlertTriangle, FileText, Cloud, Lightbulb, CheckCheck, X } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors, liquidGlass } from "../../utils/colors.js";

// ─── Notification Settings Sheet ────────────────────────────────────────────

const CATEGORIES = [
  { key: "alert",   labelKey: "notif_prefs.air_quality_alerts",  Icon: AlertTriangle },
  { key: "summary", labelKey: "notif_prefs.daily_summaries",     Icon: FileText },
  { key: "update",  labelKey: "notif_prefs.air_quality_updates", Icon: Cloud },
  { key: "tip",     labelKey: "notif_prefs.tips_and_guidance",   Icon: Lightbulb },
];

function NotificationSettingsSheet({ visible, onClose, onMarkAllRead, isDark, unreadCount }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const colors = getColors(isDark);

  const alertsEnabled = state.preferences.notificationsEnabled ?? true;

  function setAlertsEnabled(val) {
    dispatch({ type: "UPDATE_PREFERENCES", payload: { notificationsEnabled: val } });
  }

  if (!visible) return null;

  return (
    /* overlay */
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
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
            {/* toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={alertsEnabled}
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className="relative h-[28px] w-[48px] flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
              style={{ backgroundColor: alertsEnabled ? Colors.brandGreen : colors.border }}
            >
              <span
                className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: alertsEnabled ? "translateX(23px)" : "translateX(3px)" }}
              />
            </button>
          </div>

          {/* per-category section label */}
          <p
            className="mt-4 mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.5px]"
            style={{ color: colors.muted }}
          >
            {t("notif_prefs.categories")}
          </p>

          {CATEGORIES.map(({ key, labelKey, Icon }) => (
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
              {/* category toggles are display-only in PWA (no per-category state yet) */}
              <button
                type="button"
                role="switch"
                aria-checked={alertsEnabled}
                disabled={!alertsEnabled}
                onClick={() => {}}
                className="relative h-[28px] w-[48px] flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed"
                style={{ backgroundColor: alertsEnabled ? Colors.brandGreen : colors.border }}
              >
                <span
                  className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: alertsEnabled ? "translateX(23px)" : "translateX(3px)" }}
                />
              </button>
            </div>
          ))}

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
    </div>
  );
}

// ─── Helper: icon for notification type ────────────────────────────────────

function iconForType(type) {
  if (type === "alert")   return AlertTriangle;
  if (type === "summary") return FileText;
  if (type === "update")  return Cloud;
  if (type === "tip")     return Lightbulb;
  return Bell;
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export function NotificationsScreen({ isOnline, isDark }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const colors = getColors(isDark);

  const notifications = state.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleMarkAll() {
    if (unreadCount === 0) return;
    dispatch({ type: "MARK_ALL_READ" });
  }

  function handleMarkRead(id) {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: id });
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Safe-area spacer — needed when rendered as stack screen outside MobileShell */}
      <div style={{ height: "env(safe-area-inset-top)" }} />
      <div
        className="overflow-y-auto"
        style={{
          paddingTop: 12,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 100px)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ paddingHorizontal: 16 }}
        >
          {/* title + unread pill */}
          <div className="flex flex-1 min-w-0 items-center gap-[10px]">
            <h1 className="text-[1.75rem] font-extrabold leading-tight" style={{ color: colors.text }}>
              {t("alerts.title")}
            </h1>
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
              {t("alerts.mark_all")}
            </button>
            <button
              type="button"
              aria-label={t("alerts.open_settings")}
              onClick={() => setSettingsOpen(true)}
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
                    className="flex w-full items-center gap-3 px-4 py-[14px] text-left active:opacity-70"
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
                        size={18}
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

                    {/* trailing bell — matches mobile chevron/bell */}
                    <Bell size={16} color={colors.subtext} style={{ flexShrink: 0 }} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Notification Settings Sheet ── */}
      <NotificationSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onMarkAllRead={handleMarkAll}
        isDark={isDark}
        unreadCount={unreadCount}
      />
    </div>
  );
}
