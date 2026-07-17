import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  secure = false,
  icon: Icon,
  colors,
  error,
  autoComplete,
}) {
  const [showPwd, setShowPwd] = useState(false);
  const inputType = secure ? (showPwd ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-semibold" style={{ color: colors?.subtext ?? "#9AA7B5" }}>
          {label}
        </label>
      )}
      <div
        className="flex items-center gap-2.5 rounded-2xl border px-4 py-3.5"
        style={{
          backgroundColor: colors?.surface ?? "#1E2733",
          borderColor: error ? "#E53935" : colors?.border ?? "#25303C",
        }}
      >
        {Icon && <Icon size={18} color={colors?.muted ?? "#647182"} />}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:opacity-50"
          style={{ color: colors?.text ?? "#FFFFFF" }}
        />
        {secure && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd((v) => !v)}
            className="opacity-60 active:opacity-100"
          >
            {showPwd ? <EyeOff size={18} color={colors?.muted ?? "#647182"} /> : <Eye size={18} color={colors?.muted ?? "#647182"} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs" style={{ color: "#E53935" }}>{error}</p>}
    </div>
  );
}
