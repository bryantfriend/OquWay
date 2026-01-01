const CACHE_NAME = "oquway-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/main.js",
  "/js/firebase-init.js",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
