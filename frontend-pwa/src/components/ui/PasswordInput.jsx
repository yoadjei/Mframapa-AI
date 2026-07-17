import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation.js";

const defaultInputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none ring-emerald-400 focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400";

export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={className ?? defaultInputClass}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        aria-label={visible ? t("pwa.auth.hide_password") : t("pwa.auth.show_password")}
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
