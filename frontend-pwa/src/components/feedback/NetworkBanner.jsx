import { useEffect, useRef, useState } from "react";

export function NetworkBanner({ isOnline }) {
  const previous = useRef(isOnline);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (!previous.current && isOnline) {
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
      {isRecovery
        ? "Back online: refreshing with latest data"
        : "Offline mode: showing cached data when available"}
    </div>
  );
}
