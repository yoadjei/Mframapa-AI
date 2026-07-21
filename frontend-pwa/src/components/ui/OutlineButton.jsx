export function OutlineButton({ label, onClick, color, disabled, className = "", style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center rounded-2xl border py-4 text-[1rem] font-semibold active:opacity-70 disabled:opacity-40 ${className}`}
      style={{ borderColor: color ?? "#25303C", color: color ?? "#9AA7B5", ...style }}
    >
      {label}
    </button>
  );
}
