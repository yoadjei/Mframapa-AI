// Matches MframapaLogo.tsx exactly — cloud SVG + "Mframapa" wordmark
export function MframapaLogo({ size = "md", isDark = true }) {
  const dims = { sm: { icon: 18, text: 15 }, md: { icon: 24, text: 20 }, lg: { icon: 32, text: 26 } };
  const { icon, text } = dims[size] ?? dims.md;
  const restColor = isDark ? "#FFFFFF" : "#0F1419";

  return (
    <div className="flex select-none items-center" style={{ gap: 8 }}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#00C896"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M8 14v7" />
        <path d="M12 16v7" />
        <path d="M16 14v7" />
      </svg>
      <span style={{ fontSize: text, fontWeight: 700, letterSpacing: "0.2px" }}>
        <span style={{ color: "#00C896", fontWeight: 800 }}>M</span>
        <span style={{ color: restColor, fontWeight: 700 }}>framapa</span>
      </span>
    </div>
  );
}
