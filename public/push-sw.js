// Dedicated Web Push service worker (messaging only — no app-shell caching).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = { title: "Task Gifts", message: "Você tem uma nova notificação." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    try { payload.message = event.data.text(); } catch {}
  }
  const { title, message, url, data } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body: message,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url, ...(data ?? {}) },
      vibrate: [80, 40, 80],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = all.find((c) => c.url.includes(target));
    if (existing) return existing.focus();
    return self.clients.openWindow(target);
  })());
});