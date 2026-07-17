export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // Reload once when a new service worker takes control (new build deployed).
  // Guard prevents infinite reload if controllerchange fires more than once.
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
    return;
  } catch {
    // Fallback for environments without the virtual module (e.g. plain preview).
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
