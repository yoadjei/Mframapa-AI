import { Download, Share, X } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { Colors, getColors, liquidGlass } from "../../utils/colors.js";

/**
 * Auto-shown home-screen install sheet.
 * Chrome/Android: CTA fires the native beforeinstallprompt sheet.
 * iOS Safari: shows Share → Add to Home Screen steps (no native API).
 */
export function InstallHomeScreenPrompt({
  open,
  onInstall,
  onDismiss,
  isIos = false,
  isDark = true,
}) {
  const { t } = useTranslation();
  const colors = getColors(isDark);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col justify-end"
      style={{
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onDismiss}
      role="presentation"
    >
      <div
        className="relative mx-auto w-full max-w-md px-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mf-install-title"
      >
        <div
          className="overflow-hidden rounded-[24px] px-5 pb-5 pt-4"
          style={liquidGlass(isDark)}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px]"
                style={{ backgroundColor: `${Colors.brandGreen}22` }}
              >
                <Download size={22} color={Colors.brandGreen} />
              </div>
              <div>
                <h2
                  id="mf-install-title"
                  className="text-[1.0625rem] font-bold leading-tight"
                  style={{ color: colors.text }}
                >
                  {t("install.title", "Add Mframapa to your home screen")}
                </h2>
                <p className="mt-1 text-[0.8125rem] leading-snug" style={{ color: colors.subtext }}>
                  {t(
                    "install.subtitle",
                    "Install for one-tap access, offline checks, and air quality alerts."
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 active:opacity-60"
              aria-label={t("common.close", "Close")}
            >
              <X size={18} color={colors.subtext} />
            </button>
          </div>

          {isIos ? (
            <ol className="mb-4 space-y-2.5 text-[0.875rem]" style={{ color: colors.text }}>
              <li className="flex items-start gap-2">
                <span style={{ color: Colors.brandGreen, fontWeight: 700 }}>1.</span>
                <span>
                  {t("install.ios_step1_prefix", "Tap")}{" "}
                  <Share size={14} color={Colors.brandGreen} className="inline align-[-2px]" />{" "}
                  {t("install.ios_step1_suffix", "Share in Safari")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: Colors.brandGreen, fontWeight: 700 }}>2.</span>
                <span>{t("install.ios_step2", "Scroll and tap Add to Home Screen")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: Colors.brandGreen, fontWeight: 700 }}>3.</span>
                <span>{t("install.ios_step3", "Tap Add — Mframapa appears on your home screen")}</span>
              </li>
            </ol>
          ) : null}

          <div className="flex flex-col gap-2">
            {!isIos ? (
              <button
                type="button"
                onClick={() => onInstall?.()}
                className="w-full rounded-full py-3.5 text-[0.9375rem] font-semibold text-white active:opacity-90"
                style={{
                  background: "linear-gradient(145deg, #00E5A8 0%, #00C896 60%, #00A87E 100%)",
                }}
              >
                {t("install.cta", "Install on home screen")}
              </button>
            ) : (
              <button
                type="button"
                onClick={onDismiss}
                className="w-full rounded-full py-3.5 text-[0.9375rem] font-semibold text-white active:opacity-90"
                style={{
                  background: "linear-gradient(145deg, #00E5A8 0%, #00C896 60%, #00A87E 100%)",
                }}
              >
                {t("install.ios_got_it", "Got it")}
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-2 text-[0.8125rem] font-medium active:opacity-70"
              style={{ color: colors.subtext }}
            >
              {t("install.not_now", "Not now")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
