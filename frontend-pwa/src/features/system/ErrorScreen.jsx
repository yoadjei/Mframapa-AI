import { ArrowLeft, CloudOff, Leaf, X } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";

export function ErrorScreen({ params, isOnline, isDark }) {
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);
  const { dispatch } = useAppState();
  const { goBack } = useNavigation();

  const message = params?.message ?? "No Connection";
  const subtitle =
    params?.subtitle ?? "Check your internet connection and try again.";
  const onRetry = params?.onRetry ?? null;

  function handleRetry() {
    if (typeof onRetry === "function") {
      onRetry();
    } else {
      dispatch({ type: "GO_BACK" });
    }
  }

  function handleGoHome() {
    dispatch({ type: "RESET_STACK" });
    dispatch({ type: "SET_ACTIVE_SCREEN", payload: "home" });
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col px-6"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Safe area top spacer */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
          style={{ width: 36, height: 36 }}
          aria-label={t("common.go_back")}
        >
          <ArrowLeft size={22} color={colors.text} />
        </button>
        <div style={{ width: 36 }} />
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        {/* Icon stack */}
        <div className="relative mb-2">
          <CloudOff size={80} color={Colors.brandGreen} />
          <div
            className="absolute -bottom-1 -right-1 rounded-full p-0.5"
            style={{ backgroundColor: colors.card }}
          >
            <X size={28} color={Colors.brandGreen} />
          </div>
        </div>

        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
          {message}
        </h1>
        <p className="text-sm leading-6" style={{ color: colors.subtext }}>
          {subtitle}
        </p>

        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            onClick={handleRetry}
            className="w-full py-3.5 rounded-full text-white font-bold text-base"
            style={{ backgroundColor: Colors.brandGreen }}
          >
            {t("common.try_again")}
          </button>
          <button
            onClick={handleGoHome}
            className="w-full py-3.5 rounded-full font-bold text-base border"
            style={{
              backgroundColor: "transparent",
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            {t("common.go_home")}
          </button>
        </div>
      </div>

      {/* Bottom wordmark */}
      <div className="flex items-center justify-center gap-1.5 pb-6">
        <Leaf size={14} color={Colors.brandGreen} />
        <span className="text-base font-bold" style={{ color: Colors.brandGreen }}>
          mframapa
        </span>
      </div>
    </div>
  );
}
