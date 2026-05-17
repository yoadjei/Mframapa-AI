import { Download, Moon, Sun, User } from "lucide-react";
import { BottomNav } from "../navigation/BottomNav.jsx";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

export function MobileShell({ children, canInstall, onInstall }) {
  const {
    state: { session, ui, preferences, notifications },
    dispatch,
  } = useAppState();
  const { t } = useTranslation();
  const desktopTabs = [
    { key: "home", label: t("pwa.nav.home") },
    { key: "core", label: t("pwa.nav.check") },
    { key: "search", label: t("pwa.nav.search") },
    { key: "notifications", label: t("pwa.nav.alerts") },
    { key: "activity", label: t("pwa.quick.activity") },
    { key: "profile", label: t("pwa.tab.profile") },
    { key: "settings", label: t("pwa.nav.settings") },
  ];
  const unreadCount = notifications.filter((item) => !item.read).length;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark =
    preferences.theme === "dark" || (preferences.theme === "system" && prefersDark);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-tight text-emerald-600">{t("pwa.home.badge")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session.user?.email ?? t("pwa.shell.signed_in")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canInstall ? (
              <button
                type="button"
                onClick={onInstall}
                className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700"
              >
                <span className="inline-flex items-center gap-1">
                  <Download size={14} /> {t("pwa.shell.install")}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "profile" })}
              className="rounded-xl border border-slate-300 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              <User size={16} />
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: "UPDATE_PREFERENCES",
                  payload: { theme: isDark ? "light" : "dark" },
                })
              }
              className="rounded-xl border border-slate-300 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
        <div className="mx-auto mt-3 hidden max-w-7xl gap-2 md:flex">
          {desktopTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: tab.key })}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                ui.activeScreen === tab.key
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {tab.label}
              {tab.key === "notifications" && unreadCount > 0
                ? ` (${unreadCount > 9 ? "9+" : unreadCount})`
                : ""}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:pb-10">{children}</main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
