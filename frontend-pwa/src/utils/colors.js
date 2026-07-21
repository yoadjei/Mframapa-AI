export const Colors = {
  brandGreen: "#00C896",
  enterprise: "#F59E0B",
  programme: "#8B5CF6",
  danger: "#E53935",
  warning: "#F5C518",
};

/** which band a category falls in, independent of colour. */
export function aqiBand(category) {
  const c = (category ?? "").toLowerCase();
  if (c === "good") return "good";
  if (c === "moderate") return "moderate";
  if (c.includes("sensitive") || c.includes("unhealthy for")) return "sensitive";
  if (c === "unhealthy") return "unhealthy";
  if (c.includes("very") || c.includes("hazardous")) return "hazardous";
  return "moderate";
}

// measured against the page background: every one of these clears WCAG AA
// (4.5:1) for normal text. the previous single palette failed on four of five
// categories in light mode, and worst of all on hazardous in dark mode, which
// is the one that matters most.
const AQI_DARK = {
  good: "#00C896", moderate: "#F5C518", sensitive: "#FF8C00",
  unhealthy: "#E53935", hazardous: "#C043D5",
};
const AQI_LIGHT = {
  good: "#008060", moderate: "#8B6E06", sensitive: "#AB5E00",
  unhealthy: "#DD211C", hazardous: "#9C27B0",
};

export function getAQIColor(category, isDark = true) {
  return (isDark ? AQI_DARK : AQI_LIGHT)[aqiBand(category)];
}

/** a shape for each band, so severity is legible without seeing colour.
 *  around one in twelve men has some colour vision deficiency. */
export function aqiSymbol(category) {
  return {
    good: "●", moderate: "◐", sensitive: "◑",
    unhealthy: "◕", hazardous: "■",
  }[aqiBand(category)];
}

/**
 * iOS 26 Liquid Glass surface — returns inline style object.
 * Apply as: <div style={{ ...liquidGlass(isDark), borderRadius: 20 }}>
 */
export function liquidGlass(isDark) {
  return isDark
    ? {
        background: "rgba(12,18,26,0.30)",
        backdropFilter: "blur(52px) saturate(210%) brightness(1.06)",
        WebkitBackdropFilter: "blur(52px) saturate(210%) brightness(1.06)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
      }
    : {
        background: "rgba(255,255,255,0.38)",
        backdropFilter: "blur(52px) saturate(180%) brightness(1.14)",
        WebkitBackdropFilter: "blur(52px) saturate(180%) brightness(1.14)",
        border: "1px solid rgba(255,255,255,0.70)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.88)",
      };
}

export function getColors(isDark) {
  return isDark
    ? {
        bg:       "#0A0D12",
        card:     "#171E28",
        cardAlt:  "#10161F",
        surface:  "#1E2733",
        border:   "#25303C",
        text:     "#FFFFFF",
        subtext:  "#9AA7B5",
        muted:    "#647182",
        accentDim: "rgba(0,200,150,0.12)",
      }
    : {
        bg:       "#F8FAFC",
        card:     "#FFFFFF",
        cardAlt:  "#F1F5F9",
        surface:  "#E9EEF4",
        border:   "#D4DAE3",
        text:     "#0F1419",
        subtext:  "#5C6B7A",
        muted:    "#7B8A99",
        accentDim: "rgba(0,200,150,0.10)",
      };
}
