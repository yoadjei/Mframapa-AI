import { ArrowLeft, ChevronLeft } from "lucide-react";
import { useStackChrome } from "../../hooks/useStackChrome.js";

/**
 * Local back control that yields to App.jsx's fixed stack back when present.
 * Keeps a spacer so centered titles stay balanced.
 */
export function StackBackButton({
  onClick,
  color = "#FFFFFF",
  ariaLabel = "Go back",
  variant = "arrow", // "arrow" | "chevron"
  size = 22,
}) {
  const inStack = useStackChrome();
  const Icon = variant === "chevron" ? ChevronLeft : ArrowLeft;

  if (inStack) {
    return <div aria-hidden style={{ width: 44, height: 44, flexShrink: 0 }} />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center justify-center active:opacity-60"
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <Icon size={size} color={color} />
    </button>
  );
}
