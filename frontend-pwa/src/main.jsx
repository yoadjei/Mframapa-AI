import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.jsx";
import { AppStateProvider } from "./state/appState.jsx";
import { registerServiceWorker } from "./pwa/registerServiceWorker.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </StrictMode>
);

registerServiceWorker();
