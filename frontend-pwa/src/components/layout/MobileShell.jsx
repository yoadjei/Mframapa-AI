import { GlassTabBar } from "../navigation/GlassTabBar.jsx";

export function MobileShell({ children, canInstall, onInstall, isDark }) {
  return (
    <>
      {/* Screen content scrolls at page level — no nested scroll container */}
      <div
        style={{
          minHeight: "100dvh",
          paddingTop: "env(safe-area-inset-top)",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>

      {/* Floating tab bar — fixed to viewport bottom */}
      <GlassTabBar isDark={isDark} canInstall={canInstall} onInstall={onInstall} />
    </>
  );
}
