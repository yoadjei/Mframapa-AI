import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation.js";

export function NetworkBanner({ isOnline }) {
  const { t } = useTranslation();
  const previous = useRef(isOnline);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (!previous.current && isOnline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowBackOnline(true);
      const timeout = setTimeout(() => setShowBackOnline(false), 2600);
      previous.current = isOnline;
      return () => clearTimeout(timeout);
    }
    previous.current = isOnline;
  }, [isOnline]);

  if (isOnline && !showBackOnline) return null;

  const isRecovery = isOnline && showBackOnline;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-50 px-4 py-2 text-center text-sm font-semibold ${
        isRecovery ? "bg-emerald-500 text-emerald-950" : "bg-amber-500 text-amber-950"
      }`}
    >
      {isRecovery ? t("pwa.network.online") : t("pwa.network.offline")}
    </div>
  );
}
