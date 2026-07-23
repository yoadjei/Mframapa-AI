import * as Sentry from "@sentry/react";

/**
 * Initialise error tracking. The DSN comes from VITE_SENTRY_DSN so it can differ
 * per environment; a Sentry DSN is safe to ship in client code by design (it
 * only allows sending events, not reading them).
 *
 * We deliberately do not capture PII: no IP, no request bodies. This is a
 * privacy-first app and a stray coordinate or email in a crash report is not
 * worth the exposure. `window.Sentry` is exposed so the plain error boundary
 * and the global handlers can report without importing the SDK.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE === "production" ? "production" : "development",
    sendDefaultPii: false,
    // sample a fraction of transactions for performance data; errors are always sent
    tracesSampleRate: 0.1,
    // drop obvious noise: extensions, cancelled requests
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "AbortError",
    ],
    beforeSend(event) {
      // strip the query string, which can carry coordinates, from any captured url
      if (event.request?.url) {
        event.request.url = event.request.url.split("?")[0];
      }
      return event;
    },
  });

  window.Sentry = Sentry;
}
