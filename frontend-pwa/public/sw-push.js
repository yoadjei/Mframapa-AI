/* Web Push handlers imported by the Workbox-generated service worker. */

self.addEventListener("push", (event) => {
  let payload = { title: "Mframapa", body: "", data: {} };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || "Mframapa",
        body: parsed.body || "",
        data: parsed.data || {},
      };
    }
  } catch {
    try {
      payload.body = event.data ? event.data.text() : "";
    } catch {
      /* ignore */
    }
  }

  const tag =
    (payload.data && (payload.data.id || payload.data.type)) ||
    `mframapa-${Date.now()}`;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: String(tag),
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      data: payload.data,
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate?.(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
