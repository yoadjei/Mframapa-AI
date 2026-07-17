export const Colors = {
  brandGreen: "#00C896",
  enterprise: "#F59E0B",
  programme: "#8B5CF6",
  danger: "#E53935",
  warning: "#F5C518",
};

export function getAQIColor(category) {
  const c = (category ?? "").toLowerCase();
  if (c === "good")                                           return "#00C896";
  if (c === "moderate")                                       return "#F5C518";
  if (c.includes("sensitive") || c.includes("unhealthy for")) return "#FF8C00";
  if (c === "unhealthy")                                      return "#E53935";
  if (c.includes("very") || c.includes("hazardous"))         return "#9C27B0";
  return "#F5C518";
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
