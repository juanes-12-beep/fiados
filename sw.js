// Permite que la app abra sin internet.
// Si cambia algún archivo de la app, suba el número de versión.
const CACHE = 'fiados-v5';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Responde desde el celular y, si hay internet, se actualiza por detrás.
const FUENTES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const origen = new URL(e.request.url).origin;
  // Letras de Google: se guardan la primera vez para que funcionen sin internet.
  if (FUENTES.includes(origen)) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const guardado = await cache.match(e.request);
        if (guardado) return guardado;
        const r = await fetch(e.request);
        if (r.ok || r.type === 'opaque') cache.put(e.request, r.clone());
        return r;
      })
    );
    return;
  }
  if (origen !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const guardado = await cache.match(e.request, { ignoreSearch: true });
      const red = fetch(e.request)
        .then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; })
        .catch(() => guardado);
      return guardado || red;
    })
  );
});
