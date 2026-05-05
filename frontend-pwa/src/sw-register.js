/**
 * Service worker registration.
 * vite-plugin-pwa (autoUpdate mode) registers its generated SW automatically.
 * This module registers a manual sw.js fallback for environments where the
 * Vite plugin is not active (e.g. custom server, static hosting without build step).
 */

export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            console.info('[SW] New content available — reload to update.');
          }
        });
      });
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  });
}

export function unregisterSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) reg.unregister();
  });
}
