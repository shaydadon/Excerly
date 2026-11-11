/* Excerly – Service Worker לתמיכה בעבודה לא מקוונת (PWA) */
const CACHE = 'excerly-v57';
const EX_KEYS = ['neck','arms','sidebend','forwardfold','hamstring',
  'butterfly','quad','hipflexor','calf','catcow','cobra','child','twist'];
const GYM_KEYS = ['squat','legpress','legcurl','legext','calf','hipthrust','lunge','bench','inclinedb','fly',
  'ohp','lateral','pushdown','pulldown','row','facepull','curl','hammer','reardelt','plank','cardio','rdl','warmup'];
const EX_IMGS = EX_KEYS.flatMap((k) => [
  `assets/exercise-img/${k}-m.jpg`,
  `assets/exercise-img/${k}-f.jpg`
]).concat(GYM_KEYS.flatMap((k) => [
  `assets/exercise-img/gym-${k}-m.jpg`,
  `assets/exercise-img/gym-${k}-f.jpg`
]));
const ASSETS = [
  '.',
  'index.html',
  'assets/css/app.css',
  'assets/js/i18n.js',
  'assets/js/data.js',
  'assets/js/animations.js',
  'assets/js/nutrition.js',
  'assets/js/config.js',
  'assets/js/govil.js',
  'assets/js/foodmap.js',
  'assets/js/mealimage.js',
  'assets/js/nutrients.js',
  'assets/data/usda-core.json',
  'assets/data/govil-foods.json',
  'assets/data/govil-portions.json',
  'assets/data/govil-map.json',
  'assets/meal-img/entrecote-sandwich.jpg',
  'assets/meal-img/generic-plate.jpg',
  'assets/js/usda.js',
  'assets/js/mealcard.js',
  'assets/js/workout.js',
  'assets/js/gcal.js',
  'assets/js/app.js',
  'assets/js/cloud.js',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'privacy.html',
  'manifest.webmanifest',
  ...EX_IMGS
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
