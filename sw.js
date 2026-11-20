// Retro Snake service worker: saves the game on the player's device so it also opens offline.
// To ship an update, change VERSION. Players get the new version the next time they open the game online.
const VERSION = 'retro-snake-v1';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "img/3310-blue.webp",
  "img/3310-green.webp",
  "img/3310-grey.webp",
  "img/3310-red.webp",
  "img/3310-yellow.webp",
  "img/3315-blue.webp",
  "img/3315-green.webp",
  "img/3315-grey.webp",
  "img/3315-red.webp",
  "img/3315-yellow.webp"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // The page itself: try the network first so updates arrive, fall back to the saved copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return res; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Everything else (phone images, icons): use the saved copy, fetch and save it if missing.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
