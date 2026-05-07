export function StateMessage({ title, message, tone = "default" }) {
  const toneClasses =
    tone === "error"
      ? "border-red-300 bg-red-50 text-red-800"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}
