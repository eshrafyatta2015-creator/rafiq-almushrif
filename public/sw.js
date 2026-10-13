/* رفيق المشرف — عامل الخدمة: تخزين واجهة التطبيق للعمل دون إنترنت */
const CACHE_VERSION = 'rafiq-v1.1.0';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index.css',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // لا نتدخل في واجهات الخادم الذكي أو روابط المشاركة المشفرة
  if (url.pathname.startsWith('/api') || url.searchParams.has('report')) return;
  if (url.origin !== self.location.origin) return;

  // صفحات التطبيق: الشبكة أولًا مع رجوع للنسخة المخزنة
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // الملفات الثابتة: المخزن أولًا مع تحديث بالخلفية
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
