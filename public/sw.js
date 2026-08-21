const CACHE_NAME = "rsvp-offline-v8";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/images/brand/webserbisyo-logo.jpeg",
  "/manifest.webmanifest",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = readPushPayload(event.data);
  const title = typeof data.title === "string" ? data.title : "WebSerbisyo RSVP";
  const url = typeof data.url === "string" && data.url.startsWith("/dashboard")
    ? data.url
    : "/dashboard";

  event.waitUntil(
    self.registration.showNotification(title, {
      badge: "/icons/icon-192.png",
      body: typeof data.body === "string" ? data.body : undefined,
      data: {
        url,
      },
      icon: "/icons/icon-192.png",
      tag: typeof data.tag === "string" ? data.tag : undefined,
    }),
  );
});

function readPushPayload(data) {
  try {
    return data.json();
  } catch {
    return {};
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({
        includeUncontrolled: true,
        type: "window",
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client && client.url.includes(targetUrl)) {
            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
