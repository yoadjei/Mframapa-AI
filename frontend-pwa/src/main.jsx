import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.jsx";
import { AppStateProvider } from "./state/appState.jsx";
import { I18nProvider } from "./i18n/I18nProvider.jsx";
import { registerServiceWorker } from "./pwa/registerServiceWorker.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppStateProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AppStateProvider>
  </StrictMode>
);

registerServiceWorker();
