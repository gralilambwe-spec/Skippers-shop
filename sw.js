// Skippers service worker.
// Strategy: network first for the site's own files, so visitors always get the
// latest version when they are online. The saved copy is used only when offline.
// To force every visitor to refresh in future, change the number in CACHE_NAME.
const CACHE_NAME = "skippers-v3";
const ASSETS = ["./", "./index.html", "./style.css", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Leave everything that is not a plain GET alone.
  if (req.method !== "GET") return;
  // Leave other websites (Supabase, fonts, CDN scripts, WhatsApp) to the browser.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
