import { X, Check } from "lucide-react";
import { getColors, Colors, liquidGlass } from "../../utils/colors.js";

const SEEDS = [
  "amara", "kofi", "zuri", "kwame", "abena", "efua", "adjoa", "yaw",
  "akosua", "fiifi", "nana", "esi", "baaba", "araba", "adwoa", "akua",
  "sena", "edem", "dela", "mawuli", "dzifa", "selorm", "eyram", "kafui",
];

export function naviiUrl(seed, size = 96) {
  return `https://api.navii.dev/avatar/${encodeURIComponent(seed)}.png?size=${size}&background=none`;
}

// everyone gets an avatar without having to pick one. the same key always maps to
// the same face, so it stays stable across sessions and devices.
export function defaultSeedFor(key = "") {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return SEEDS[hash % SEEDS.length];
}

export function AvatarPickerSheet({ visible, selected, onSelect, onClose, isDark }) {
  const colors = getColors(isDark ?? true);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* Sheet */}
      <div
        className="relative flex flex-col rounded-t-[24px] px-4 pt-3"
        style={{
          ...liquidGlass(isDark ?? true),
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          maxHeight: "72dvh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[17px] font-bold" style={{ color: colors.text }}>
            Choose your avatar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 active:opacity-60"
          >
            <X size={20} color={colors.subtext} />
          </button>
        </div>

        {/* Grid — 4 columns matching mobile NUM_COLS=4 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            paddingBottom: 8,
          }}
        >
          {SEEDS.map((seed) => {
            const active = seed === selected;
            return (
              <button
                key={seed}
                type="button"
                onClick={() => { onSelect(seed); onClose(); }}
                className="relative flex items-center justify-center overflow-hidden active:opacity-70"
                style={{
                  aspectRatio: "1",
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  border: active ? `2.5px solid ${Colors.brandGreen}` : "2.5px solid transparent",
                }}
              >
                <img
                  src={naviiUrl(seed)}
                  alt={seed}
                  style={{ width: "85%", height: "85%", objectFit: "contain" }}
                  loading="lazy"
                />
                {active && (
                  <div
                    className="absolute bottom-1 right-1 flex items-center justify-center rounded-full"
                    style={{ width: 18, height: 18, backgroundColor: Colors.brandGreen }}
                  >
                    <Check size={11} color="#fff" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
