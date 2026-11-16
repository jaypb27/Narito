/* NARITO service worker — lets the app open and scan with no internet.
   Change the version below whenever you upload a new index.html. */
const VERSION = 'narito-v3';
const LOCAL = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const REMOTE = [
  './logo-deped.png', './logo-school.png',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
  'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(LOCAL);
    await Promise.all(REMOTE.map(u => c.add(u).catch(() => {})));      // a failed extra must not block install
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || /script\.google(usercontent)?\.com$/.test(url.hostname)) return;   // API calls go straight to Google
  const sameOrigin = url.origin === location.origin;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: sameOrigin });
    const fresh = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; });
    if (hit) { fresh.catch(() => {}); return hit; }                     // cached copy now, refresh in the background
    return fresh.catch(() => sameOrigin && req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
  }));
});
