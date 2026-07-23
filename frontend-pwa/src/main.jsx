import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.jsx";
import { AppErrorBoundary } from "./components/feedback/AppErrorBoundary.jsx";
import { AppStateProvider } from "./state/appState.jsx";
import { I18nProvider } from "./i18n/I18nProvider.jsx";
import { registerServiceWorker } from "./pwa/registerServiceWorker.js";
import "./index.css";
import { initSentry } from "./services/sentry.js";

// error tracking first, so anything below is captured
initSentry();

// a rejected promise nobody handled used to disappear silently: nothing in the
// console for the user to report and nothing sent to sentry. this is how most
// network and storage failures surface, so they are worth seeing.
window.addEventListener("unhandledrejection", (event) => {
  console.error("unhandled promise rejection", event.reason);
  window.Sentry?.captureException?.(event.reason);
});

window.addEventListener("error", (event) => {
  // resource failures (a dropped chunk, a missing image) arrive here with no
  // error object; only report the real ones.
  if (event.error) {
    console.error("uncaught error", event.error);
    window.Sentry?.captureException?.(event.error);
  }
});

// the boundary wraps the providers as well as the app: a failure while reading
// persisted state or loading a locale would otherwise escape it and leave a
// blank page with no way back.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppStateProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </AppStateProvider>
    </AppErrorBoundary>
  </StrictMode>
);

registerServiceWorker();
