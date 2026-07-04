const CACHE = 'boykot-material-v4';
const ASSETS = ['./','./index.html','./style.css','./app.js','./data.json','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return res; }).catch(() => caches.match(event.request))); });
