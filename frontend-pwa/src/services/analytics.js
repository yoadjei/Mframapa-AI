// first-party analytics: an anonymous, locally-generated device id and coarse
// events (no coordinates, no identity). sends are best-effort and never block or
// throw into the ui. see backend/analytics for what is stored and why.
import { httpClient } from "./httpClient.js";

const DEVICE_KEY = "mframapa:analytics:device-id";

function deviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto?.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function track(event, { country } = {}) {
  try {
    httpClient
      .post("/api/v1/events", {
        events: [{ device_id: deviceId(), event, platform: "web", country }],
      })
      .catch(() => undefined);        // analytics must never surface an error to the user
  } catch {
    /* storage/crypto unavailable — skip silently */
  }
}

// call once on app start; drives installs, WAU and retention.
export function trackAppOpen() {
  track("app_open");
}
