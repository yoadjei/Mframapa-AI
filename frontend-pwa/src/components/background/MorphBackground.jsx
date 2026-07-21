import { useEffect, useState } from "react";

/**
 * Slow morphing colour field behind marketing and first-run screens.
 *
 * Deliberately cheap: three blurred blobs animated only via `transform`, which
 * the compositor handles without repainting. Many of our users are on low end
 * Android devices, so this switches itself off entirely under Lite mode or when
 * the system asks for reduced motion, leaving a flat gradient.
 */
export function MorphBackground({ isDark = true, liteMode = false }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    setReduceMotion(query.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  const still = liteMode || reduceMotion;
  const base = isDark ? "#0A0D12" : "#F8FAFC";

  const blobs = [
    { color: "#00C896", size: 420, top: "-12%", left: "-18%", duration: 26, delay: 0 },
    { color: "#2196F3", size: 360, top: "38%", left: "58%", duration: 32, delay: -8 },
    { color: "#00C896", size: 300, top: "72%", left: "-10%", duration: 38, delay: -16 },
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        backgroundColor: base,
        pointerEvents: "none",
      }}
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            backgroundColor: b.color,
            opacity: isDark ? 0.16 : 0.1,
            filter: "blur(70px)",
            willChange: still ? undefined : "transform",
            animation: still
              ? undefined
              : `mf-morph-${i} ${b.duration}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes mf-morph-0 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(14vw, 10vh, 0) scale(1.25); }
        }
        @keyframes mf-morph-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.1); }
          50%      { transform: translate3d(-18vw, -8vh, 0) scale(0.85); }
        }
        @keyframes mf-morph-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.9); }
          50%      { transform: translate3d(12vw, -14vh, 0) scale(1.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden="true"] > div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/** Staggered entrance for a list of blocks, skipped when motion is unwanted. */
export function useStaggeredEntrance(count, { disabled = false } = {}) {
  const [shown, setShown] = useState(disabled ? count : 0);

  useEffect(() => {
    if (disabled) { setShown(count); return; }
    let cancelled = false;
    const timers = [];
    for (let i = 0; i < count; i += 1) {
      timers.push(setTimeout(() => { if (!cancelled) setShown((n) => Math.max(n, i + 1)); }, 90 * i));
    }
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [count, disabled]);

  return shown;
}
