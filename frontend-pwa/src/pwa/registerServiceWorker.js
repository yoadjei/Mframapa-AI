export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
    return;
  } catch {
    // Fallback for environments without the virtual module.
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
