import { useState, useEffect, useRef } from "react";
import { Home, Map, User, Plus, X, Search, Bell, Activity, Settings, Download } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

const MAIN_TABS = [
  { key: "home",    icon: Home,  labelKey: "tab.home" },
  { key: "core",    icon: Map,   labelKey: "tab.map"  },
  { key: "profile", icon: User,  labelKey: "tab.profile" },
];

const MORE_ITEMS = [
  { key: "search",        icon: Search,   labelKey: "pwa.nav.search" },
  { key: "notifications", icon: Bell,     labelKey: "pwa.nav.alerts" },
  { key: "activity",      icon: Activity, labelKey: "pwa.quick.activity" },
  { key: "settings",      icon: Settings, labelKey: "pwa.nav.settings" },
];

// iOS 26 Liquid Glass — minimal shadow
function liquidGlass(isDark) {
  return isDark
    ? {
        background: "rgba(12,18,26,0.30)",
        backdropFilter: "blur(52px) saturate(210%) brightness(1.06)",
        WebkitBackdropFilter: "blur(52px) saturate(210%) brightness(1.06)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.12)",
      }
    : {
        background: "rgba(255,255,255,0.38)",
        backdropFilter: "blur(52px) saturate(180%) brightness(1.14)",
        WebkitBackdropFilter: "blur(52px) saturate(180%) brightness(1.14)",
        border: "1px solid rgba(255,255,255,0.70)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.88)",
      };
}

export function GlassTabBar({ isDark, canInstall, onInstall }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const active = state.ui.activeScreen;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const fabRef  = useRef(null);

  async function handleInstall() {
    setMenuOpen(false);
    // Chrome/Android: native home-screen sheet. iOS: opens Add-to-Home steps.
    await onInstall?.();
  }

  function navigate(key) {
    dispatch({ type: "SET_ACTIVE_SCREEN", payload: key });
    setMenuOpen(false);
  }

  // "+" more-menu items navigate as stack screens so the global back button appears
  function navigateToStack(key) {
    dispatch({ type: "NAVIGATE", payload: { name: key, params: {} } });
    setMenuOpen(false);
  }


  // Close on outside click — exclude the FAB so the toggle works correctly
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e) {
      const inMenu = menuRef.current && menuRef.current.contains(e.target);
      const inFab  = fabRef.current  && fabRef.current.contains(e.target);
      if (!inMenu && !inFab) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  const glass   = liquidGlass(isDark);
  const textSub = isDark ? "#9AA7B5" : "#5C6B7A";
  const pillBg  = isDark ? "rgba(0,200,150,0.22)" : "#D6F5EC";

  return (
    <>
      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.30)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
          onPointerDown={() => setMenuOpen(false)}
        />
      )}

      {/* More menu panel */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 w-64 overflow-hidden rounded-2xl"
          style={{
            bottom: `calc(${80 + 16}px + env(safe-area-inset-bottom))`,
            right: 16,
            ...glass,
          }}
        >
          {MORE_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const last = i === MORE_ITEMS.length - 1 && !canInstall;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigateToStack(item.key)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:opacity-70"
                style={{
                  borderBottom: !last
                    ? `0.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                    : "none",
                  color: isDark ? "#FFFFFF" : "#0F1419",
                }}
              >
                <Icon size={18} color="#00C896" />
                <span className="text-[0.9375rem] font-medium">{t(item.labelKey)}</span>
              </button>
            );
          })}
          {canInstall ? (
            <button
              type="button"
              onClick={handleInstall}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:opacity-70"
              style={{ color: isDark ? "#FFFFFF" : "#0F1419" }}
            >
              <Download size={18} color="#00C896" />
              <span className="text-[0.9375rem] font-medium">
                {t("install.menu", "Install app")}
              </span>
            </button>
          ) : null}
        </div>
      )}

      {/* Tab bar row */}
      <div
        className="fixed left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ bottom: `calc(16px + env(safe-area-inset-bottom))` }}
      >
        {/* Liquid glass capsule */}
        <div
          className="flex h-14 items-center overflow-hidden rounded-full px-1"
          style={glass}
        >
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const focused = active === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate(tab.key)}
                className="flex h-14 items-center justify-center px-1.5"
              >
                <span
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 transition-all duration-200"
                  style={focused ? { backgroundColor: pillBg } : {}}
                >
                  <Icon size={22} color={focused ? "#00C896" : textSub} fill={focused ? "#00C896" : "none"} />
                  {focused && (
                    <span className="text-xs font-semibold" style={{ color: "#00C896" }}>
                      {t(tab.labelKey)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAB — explicit open/close, not toggle, to prevent double-fire with outside-click handler */}
        <button
          ref={fabRef}
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-14 w-14 items-center justify-center rounded-full active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(145deg, #00E5A8 0%, #00C896 60%, #00A87E 100%)",
            boxShadow: "0 4px 16px rgba(0,200,150,0.38), inset 0 1px 0 rgba(255,255,255,0.28)",
          }}
        >
          {menuOpen ? <X size={26} color="#fff" /> : <Plus size={26} color="#fff" />}
        </button>
      </div>
    </>
  );
}
