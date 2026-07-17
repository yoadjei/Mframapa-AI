export function StateMessage({ title, message, tone = "default" }) {
  const toneClasses =
    tone === "error"
      ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
      : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}
