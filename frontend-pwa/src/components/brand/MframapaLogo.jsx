import { CloudRain } from "lucide-react";

export function MframapaLogo({ size = "md" }) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  return (
    <div className={`flex items-center select-none ${isSm ? "gap-1.5" : isLg ? "gap-3" : "gap-2"}`}>
      <div className="relative flex items-center justify-center">
        <CloudRain
          size={isSm ? 18 : isLg ? 48 : 24}
          className="text-emerald-500 dark:text-emerald-400"
        />
      </div>
      <span
        className={`font-black tracking-tight ${
          isSm ? "text-base" : isLg ? "text-4xl" : "text-xl"
        }`}
      >
        <span className="text-emerald-500 dark:text-emerald-400">M</span>
        <span className="text-slate-900 dark:text-slate-100">framapa</span>
      </span>
    </div>
  );
}
