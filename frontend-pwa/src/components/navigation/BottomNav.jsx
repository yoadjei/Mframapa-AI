import { Bell, Home, Search, Settings, Wind } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

const items = [
  { key: "home", labelKey: "pwa.nav.home", icon: Home },
  { key: "core", labelKey: "pwa.nav.check", icon: Wind },
  { key: "search", labelKey: "pwa.nav.search", icon: Search },
  { key: "notifications", labelKey: "pwa.nav.alerts", icon: Bell },
  { key: "settings", labelKey: "pwa.nav.settings", icon: Settings },
];

export function BottomNav() {
  const { t } = useTranslation();
  const {
    state: {
      ui: { activeScreen },
      notifications,
    },
    dispatch,
  } = useAppState();
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.key;
          return (
            <li key={item.key}>
              <button
                type="button"
                className={`flex w-full flex-col items-center gap-1 px-2 py-3 text-xs font-medium ${
                  active ? "text-emerald-600" : "text-slate-500"
                }`}
                onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: item.key })}
              >
                <Icon size={18} />
                <span>{t(item.labelKey)}</span>
                {item.key === "notifications" && unread > 0 ? (
                  <span className="rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-emerald-950">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
