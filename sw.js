const CACHE_NAME = "boykot-rehberi-modern-v1";
const APP_FILES = ["./", "./index.html", "./style.css", "./app.js", "./data.json", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if(url.pathname.endsWith("data.json")){
    event.respondWith(fetch(event.request).catch(() => caches.match("./data.json")));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
