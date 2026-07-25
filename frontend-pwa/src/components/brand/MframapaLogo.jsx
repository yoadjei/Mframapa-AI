// Raindrop mark on brand green — matches app icons (white tile + drop).
// `markOnly` drops the wordmark for in-app headers.
export function MframapaLogo({ size = "md", isDark = true, markOnly = false }) {
  const dims = {
    sm: { icon: 18, text: 15 },
    md: { icon: 24, text: 20 },
    lg: { icon: 32, text: 26 },
    xl: { icon: 44, text: 30 },
  };
  const { icon, text } = dims[size] ?? dims.md;
  const restColor = isDark ? "#FFFFFF" : "#0F1419";

  return (
    <div className="flex select-none items-center" style={{ gap: 8 }}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="#00C896"
        aria-hidden="true"
      >
        {/* Lucide droplet (filled) */}
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
      {markOnly ? null : (
        <span style={{ fontSize: text, fontWeight: 700, letterSpacing: "0.2px" }}>
          <span style={{ color: "#00C896", fontWeight: 800 }}>M</span>
          <span style={{ color: restColor, fontWeight: 700 }}>framapa</span>
        </span>
      )}
    </div>
  );
}
