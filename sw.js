// ASU Venezuela 15TPD — Service Worker v1.0
// Estrategia: Cache First para todos los módulos (funcionamiento offline total)

const CACHE_NAME = 'asu-venezuela-v1';
const ASSETS = [
  './ASU_Index.html',
  './ASU_Module01_Base.html',
  './ASU_Module02_AC1001.html',
  './ASU_Module03_RU1101.html',
  './ASU_Module04_PPU1201.html',
  './ASU_Module05_ET401.html',
  './ASU_Module06_ColdBox.html',
  './ASU_Module07_Dashboard.html',
  './ASU_Module08_Turno.html',
  './manifest.json',
];

// INSTALL: pre-cachear todos los módulos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-cacheando módulos ASU...');
      return cache.addAll(ASSETS);
    }).then(() => {
      console.log('[SW] Todos los módulos en caché. App disponible offline.');
      return self.skipWaiting();
    })
  );
});

// ACTIVATE: limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminando caché antigua:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH: Cache First — responder siempre desde caché si existe
self.addEventListener('fetch', event => {
  // Solo interceptar GETs al mismo origen
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Retornar desde caché inmediatamente
        return cached;
      }
      // No está en caché → intentar red y cachear
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Sin red y sin caché: mostrar página offline básica
        return new Response(
          `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Sin conexión</title>
          <style>body{background:#0a0a0f;color:#e8e8f0;font-family:sans-serif;
            display:flex;align-items:center;justify-content:center;
            min-height:100vh;text-align:center;padding:24px;}
          h1{font-size:32px;margin-bottom:12px;}
          p{color:#8888aa;font-size:14px;}</style></head>
          <body><div><div style="font-size:64px;margin-bottom:16px">📵</div>
          <h1>Sin conexión</h1>
          <p>La app ASU Venezuela requiere estar cargada al menos una vez con conexión.<br>
          Regresa cuando tengas conexión o abre el módulo desde el caché del navegador.</p></div></body></html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
