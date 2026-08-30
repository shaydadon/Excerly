/* Excerly – Service Worker לתמיכה בעבודה לא מקוונת (PWA) */
const CACHE = 'excerly-v12';
const ASSETS = [
  '.',
  'index.html',
  'assets/css/app.css',
  'assets/js/i18n.js',
  'assets/js/data.js',
  'assets/js/animations.js',
  'assets/js/nutrition.js',
  'assets/js/app.js',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => cached)
    )
  );
});

/* לחיצה על התראת התזכורת פותחת את האפליקציה */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('.');
    })
  );
});
