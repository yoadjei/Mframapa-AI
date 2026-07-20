export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // controllerchange fires in two very different situations: a new build taking
  // over from an old one, and the very first worker claiming a page that never
  // had one. reloading is right for the first and wrong for the second — on a
  // first visit it throws the user back to the start mid-flow. the page only had
  // a previous controller in the update case, so that is what we key on.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
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
