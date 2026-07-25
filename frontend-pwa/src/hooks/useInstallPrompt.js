import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "mframapa:install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Delay before the install sheet auto-appears once the browser allows install. */
const AUTO_SHOW_MS = 1800;

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  // iOS Safari home-screen launch
  if (window.navigator.standalone === true) return true;
  return false;
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const notCriOS = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && notCriOS;
}

function wasDismissedRecently() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export function useInstallPrompt({ autoPrompt = true } = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(() => isStandaloneDisplay());

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setInstalled(true);
      return undefined;
    }

    const ios = isIosSafari();
    setIsIos(ios);

    const handleBeforeInstallPrompt = (event) => {
      // Capture so we can trigger the native home-screen sheet from our CTA.
      event.preventDefault();
      setDeferredPrompt(event);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setShowBanner(false);
      setInstalled(true);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // iOS has no beforeinstallprompt — still offer Add to Home Screen guidance.
    if (ios && !wasDismissedRecently()) {
      setCanInstall(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Auto-open the install sheet shortly after the app becomes installable.
  useEffect(() => {
    if (!autoPrompt || installed || !canInstall || wasDismissedRecently()) return undefined;
    const timer = window.setTimeout(() => setShowBanner(true), AUTO_SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [autoPrompt, canInstall, installed]);

  const dismiss = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, []);

  const openBanner = useCallback(() => {
    if (!installed && canInstall) setShowBanner(true);
  }, [canInstall, installed]);

  const promptInstall = useCallback(async () => {
    if (isIos) {
      // Native prompt unavailable — keep the banner open with Share steps.
      setShowBanner(true);
      return false;
    }
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    setShowBanner(false);
    if (choice.outcome === "accepted") {
      setInstalled(true);
      return true;
    }
    dismiss();
    return false;
  }, [deferredPrompt, dismiss, isIos]);

  return {
    canInstall: canInstall && !installed,
    promptInstall,
    showBanner: showBanner && !installed,
    dismiss,
    openBanner,
    isIos,
    installed,
  };
}
