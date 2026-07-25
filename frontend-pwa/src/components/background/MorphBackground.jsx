import { useEffect, useState } from "react";

/**
 * Slow morphing colour field behind marketing and first-run screens.
 *
 * Built for iOS Safari first. The soft edges come from radial gradients rather
 * than `filter: blur()`: WebKit re-rasterises a blurred layer as it animates,
 * which is the main cause of stutter in effects like this. A gradient is painted
 * once into a layer and then only transformed, which the compositor does on the
 * GPU without touching the main thread.
 *
 * Switches itself off entirely under Lite mode or when the system asks for
 * reduced motion, since many of our users are on low end Android devices.
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
  const base = isDark ? "#0A0D12" : "#E8ECF2";
  const strength = isDark ? 0.22 : 0.14;

  const blobs = [
    { rgb: "0, 200, 150", size: 460, top: "-14%", left: "-20%", duration: 28, delay: 0 },
    { rgb: "33, 150, 243", size: 400, top: "34%", left: "56%", duration: 34, delay: -9 },
    { rgb: "0, 200, 150", size: 340, top: "70%", left: "-12%", duration: 40, delay: -18 },
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
        // keeps the whole field on its own compositor layer
        transform: "translateZ(0)",
      }}
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className="mf-blob"
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            // the soft edge is baked into the paint, so nothing is re-blurred
            background: `radial-gradient(closest-side, rgba(${b.rgb}, ${strength}), rgba(${b.rgb}, 0))`,
            willChange: still ? "auto" : "transform",
            animation: still
              ? "none"
              : `mf-morph-${i} ${b.duration}s cubic-bezier(0.4, 0.0, 0.2, 1) ${b.delay}s infinite`,
          }}
        />
      ))}

      <style>{`
        .mf-blob {
          /* stops WebKit flickering the layer mid animation */
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
        }
        @keyframes mf-morph-0 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(14vw, 10vh, 0) scale(1.28); }
        }
        @keyframes mf-morph-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.12); }
          50%      { transform: translate3d(-18vw, -8vh, 0) scale(0.84); }
        }
        @keyframes mf-morph-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.9); }
          50%      { transform: translate3d(12vw, -14vh, 0) scale(1.22); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-blob { animation: none !important; }
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
