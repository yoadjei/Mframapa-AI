import { Cloud, CloudRain, CloudLightning, CloudDrizzle, Cloudy } from "lucide-react";

const ICONS = [Cloud, CloudRain, CloudLightning, CloudDrizzle, Cloudy];
const CELL = 120;
// Virtual canvas — large enough to fill any viewport via percentage positioning.
const VIRTUAL_W = 1600;
const VIRTUAL_H = 1200;

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Computed once at module load — positions never change, only colours/opacity.
const CLUSTER = (() => {
  const cols = Math.ceil(VIRTUAL_W / CELL) + 1;
  const rows = Math.ceil(VIRTUAL_H / CELL) + 2;
  const items = [];
  let seed = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Higher skip → fewer DOM nodes so tab scroll stays smooth on low-end phones.
      if (hash(row * 113 + col * 17) < 0.58) continue;

      const h0 = hash(seed++);
      const h1 = hash(seed++);
      const h2 = hash(seed++);
      const h3 = hash(seed++);
      const h4 = hash(seed++);

      const leftPx = col * CELL + (h0 - 0.5) * CELL * 0.55;
      const topPx  = row * CELL + (h1 - 0.5) * CELL * 0.55;

      items.push({
        key:          `${row}-${col}`,
        Icon:         ICONS[Math.floor(h4 * ICONS.length)],
        leftPct:      (leftPx / VIRTUAL_W) * 100,
        topPct:       (topPx  / VIRTUAL_H) * 100,
        size:         34 + Math.floor(h2 * 18),
        rotate:       Math.floor(h2 * 360),
        opacityBase:  h3,
      });
    }
  }
  return items;
})();

export function CloudRainBackground({ isDark }) {
  const bgColor    = isDark ? "#0A0D12" : "#E8ECF2";
  const iconColor  = isDark ? "#4A5668" : "#8A9AAD";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        backgroundColor: bgColor,
        overflow: "hidden",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {CLUSTER.map((item) => {
        const { key, Icon: ItemIcon, leftPct, topPct, size, rotate, opacityBase } = item;
        return (
          <div
            key={key}
            style={{
              position: "absolute",
              left:     `${leftPct}%`,
              top:      `${topPct}%`,
              opacity:  isDark ? 0.14 + opacityBase * 0.06 : 0.12 + opacityBase * 0.06,
              transform: `rotate(${rotate}deg)`,
              color:    iconColor,
            }}
          >
            <ItemIcon size={size} strokeWidth={1.2} />
          </div>
        );
      })}
    </div>
  );
}
