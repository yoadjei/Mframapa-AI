import { useState } from "react";
import { HomeScreen } from "../home/HomeScreen.jsx";
import { CoreFeatureScreen } from "../core/CoreFeatureScreen.jsx";
import { ActivityScreen } from "../activity/ActivityScreen.jsx";
import { SearchScreen } from "../search/SearchScreen.jsx";
import { NotificationsScreen } from "../notifications/NotificationsScreen.jsx";
import { ProfileScreen } from "../profile/ProfileScreen.jsx";
import { SettingsScreen } from "../settings/SettingsScreen.jsx";
import { OnboardingScreen } from "../onboarding/OnboardingScreen.jsx";
import { AuthScreen } from "../auth/AuthScreen.jsx";

const SCREENS = [
  { key: "onboarding", label: "Onboarding", component: OnboardingScreen },
  { key: "auth", label: "Auth / Login", component: AuthScreen },
  { key: "home", label: "Home Dashboard", component: HomeScreen },
  { key: "core", label: "Africa Explorer", component: CoreFeatureScreen },
  { key: "search", label: "Search Cities", component: SearchScreen },
  { key: "activity", label: "Activity History", component: ActivityScreen },
  { key: "notifications", label: "Notifications", component: NotificationsScreen },
  { key: "profile", label: "Profile", component: ProfileScreen },
  { key: "settings", label: "Settings", component: SettingsScreen },
];

export function PreviewGallery({ isOnline }) {
  const [activeKey, setActiveKey] = useState("home");
  const [theme, setTheme] = useState("dark");

  const active = SCREENS.find((s) => s.key === activeKey) ?? SCREENS[2];
  const ActiveScreen = active.component;

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Mframapa Preview
          </p>
          <p className="text-xs text-gray-500 mt-0.5">9 screens</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {SCREENS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeKey === s.key
                  ? "bg-[#00FFB3]/15 text-[#00a876] font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 rounded px-2 py-0.5">
            Dev Only
          </span>
          <p className="text-[10px] text-gray-400 mt-1">Visit /?preview to open</p>
        </div>
      </aside>

      {/* Preview area */}
      <main className="flex-1 flex flex-col items-center justify-start pt-10 pb-16 px-8 gap-8">
        {/* Toolbar */}
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-3">
          <span className="text-sm font-semibold text-gray-700">{active.label}</span>
          <div className="w-px h-5 bg-gray-200" />
          <span className="text-sm text-gray-500">Theme:</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {["dark", "light"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex gap-1">
            {SCREENS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveKey(s.key)}
                title={s.label}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeKey === s.key
                    ? "bg-[#00FFB3] scale-125"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Phone frame */}
        <div
          className={`${theme} relative overflow-hidden shadow-2xl`}
          style={{
            width: 390,
            height: 844,
            borderRadius: "2.75rem",
            boxShadow:
              theme === "dark"
                ? "0 0 0 10px #111, 0 0 0 11px #333, 0 40px 80px rgba(0,0,0,0.6)"
                : "0 0 0 10px #e5e7eb, 0 0 0 11px #d1d5db, 0 40px 80px rgba(0,0,0,0.15)",
          }}
        >
          {/* Status bar */}
          <div
            className={`flex items-center justify-between px-7 pt-3 pb-1 text-[11px] font-semibold z-50 relative ${
              theme === "dark" ? "bg-[#0A0F1C] text-white" : "bg-white text-gray-900"
            }`}
          >
            <span>9:41</span>
            <div className="w-[92px] h-[25px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1" />
            <span>100%</span>
          </div>

          {/* Screen content */}
          <div
            className={`w-full overflow-y-auto overflow-x-hidden ${
              theme === "dark" ? "bg-[#0A0F1C] text-white" : "bg-slate-50 text-slate-900"
            }`}
            style={{ height: "calc(844px - 44px)" }}
          >
            <ActiveScreen isOnline={isOnline} />
          </div>
        </div>

        {/* Navigation hint */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <button
            type="button"
            onClick={() => {
              const idx = SCREENS.findIndex((s) => s.key === activeKey);
              setActiveKey(SCREENS[(idx - 1 + SCREENS.length) % SCREENS.length].key);
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-medium text-gray-600"
          >
            ← Prev
          </button>
          <span>
            {SCREENS.findIndex((s) => s.key === activeKey) + 1} / {SCREENS.length}
          </span>
          <button
            type="button"
            onClick={() => {
              const idx = SCREENS.findIndex((s) => s.key === activeKey);
              setActiveKey(SCREENS[(idx + 1) % SCREENS.length].key);
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-medium text-gray-600"
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  );
}
