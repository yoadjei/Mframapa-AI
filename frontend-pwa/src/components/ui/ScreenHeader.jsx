import { ChevronLeft } from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation.js";

export function ScreenHeader({ title, right, onBack, colors }) {
  const nav = useNavigation();
  const handleBack = onBack ?? nav.goBack;

  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <button
        type="button"
        onClick={handleBack}
        className="flex h-9 w-9 items-center justify-center rounded-full active:opacity-60"
        style={{ backgroundColor: colors?.surface ?? "transparent" }}
      >
        <ChevronLeft size={22} color={colors?.text ?? "#FFFFFF"} />
      </button>

      <span className="text-[17px] font-bold" style={{ color: colors?.text ?? "#FFFFFF" }}>
        {title}
      </span>

      <div className="flex h-9 w-9 items-center justify-center">
        {right ?? null}
      </div>
    </div>
  );
}
