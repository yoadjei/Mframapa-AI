import { Bell, Home, Search, Settings, Wind } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";

const items = [
  { key: "home", label: "Home", icon: Home },
  { key: "core", label: "Check", icon: Wind },
  { key: "search", label: "Search", icon: Search },
  { key: "notifications", label: "Alerts", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
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
                <span>{item.label}</span>
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
