// Offline support: the app shell is cached; vendor data and map searches always go to the network.
const CACHE = 'wedding-app-v2';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'messages.js', 'data.js', '../locales.js', 'manifest.webmanifest',
  '../CormorantGaramond-300.ttf', '../CormorantGaramond-400.ttf', '../CormorantGaramond-400i.ttf', '../CormorantGaramond-500.ttf', '../Jost-300.ttf', '../Jost-400.ttf', '../Jost-500.ttf',
  ...['rose', 'poppy', 'columbine', 'crown-imperial', 'sweet-pea', 'gloriosa', 'tulips', 'star-flower', 'erica', 'fritillaries'].map((n) => `art/${n}-sm.png`)];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('vendors.json')) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
