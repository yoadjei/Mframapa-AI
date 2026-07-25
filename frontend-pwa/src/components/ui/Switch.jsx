import { Colors } from "../../utils/colors.js";

/**
 * Compact iOS-style switch. Avoids <button> so the global 44px min touch
 * target rule cannot stretch the track into a green circle on Safari.
 */
export function Switch({ checked, onChange, disabled = false, ariaLabel, trackOff }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange?.(!checked);
      }}
      className="mf-switch relative isolate flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        width: 48,
        height: 28,
        minWidth: 48,
        minHeight: 28,
        padding: 0,
        border: "none",
        backgroundColor: checked ? Colors.brandGreen : trackOff,
        WebkitAppearance: "none",
        appearance: "none",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none block rounded-full bg-white shadow"
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 22,
          height: 22,
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "transform 200ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      />
    </button>
  );
}
