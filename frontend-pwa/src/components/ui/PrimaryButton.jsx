export function PrimaryButton({ label, onClick, loading, disabled, className = "", style, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`mf-press flex w-full items-center justify-center rounded-2xl py-4 text-[1rem] font-bold text-white disabled:opacity-50 ${className}`}
      style={{ backgroundColor: "#00C896", ...style }}
    >
      {loading
        ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        : label}
    </button>
  );
}
