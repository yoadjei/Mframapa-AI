import { useEffect, useRef, useState } from "react";

// Ping a local resource instead of trusting navigator.onLine.
// Safari returns onLine=false on local networks without internet, so we always
// verify reachability ourselves.
async function pingServer() {
  try {
    const r = await fetch("/manifest.json", { method: "HEAD", cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true); // optimistic default
  const timer = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function check() {
      // Always ping — never short-circuit on navigator.onLine because Safari
      // returns false for local-network-only connections (no internet) even when
      // the dev server is reachable on the LAN.
      const up = await pingServer();
      if (mountedRef.current) setIsOnline(up);
    }

    check();
    timer.current = setInterval(check, 30_000);

    // Browser connectivity events are hints to re-check, not final answers
    const onConnectivityChange = () => check();
    window.addEventListener("online", onConnectivityChange);
    window.addEventListener("offline", onConnectivityChange);

    return () => {
      mountedRef.current = false;
      clearInterval(timer.current);
      window.removeEventListener("online", onConnectivityChange);
      window.removeEventListener("offline", onConnectivityChange);
    };
  }, []);

  return isOnline;
}
