/**
 * Local in-session browser notifications (PWA).
 * Remote Web Push uses VAPID via webPush.js + sw-push.js; this helper only
 * shows OS banners while the tab/app is open (Did you know, episode tips).
 */

/** Current permission without prompting the OS. */
export function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function ensureNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function showBrowserNotification({ title, body, tag } = {}) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  try {
    // Prefer service worker when available so the banner works while backgrounded.
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title || "Mframapa", {
            body: body || "",
            tag: tag || undefined,
            icon: "/favicon-192.png",
            badge: "/favicon.png",
          });
        })
        .catch(() => {
          // fallback below
          new Notification(title || "Mframapa", { body: body || "", tag });
        });
      return true;
    }
    new Notification(title || "Mframapa", { body: body || "", tag });
    return true;
  } catch {
    return false;
  }
}
