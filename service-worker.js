// Nome della cache (cambia versione quando aggiorni i file)
const CACHE_NAME = 'csvxpress-v1';

// Elenco dei file da pre-cachare
const urlsToCache = [
  '/',                // Se hai un hosting su GitHub Pages, assicura che '/' punti a index.html
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon/CSVXpress-192.png',
  '/icon/CSVXpress-512.png',
  // Libreria PapaParse da CDN (se vuoi che sia disponibile offline)
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js'
];

// Installazione del Service Worker: pre-cachiamo le risorse
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installazione');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Pre-caching delle risorse');
      return cache.addAll(urlsToCache);
    })
  );
  // Forza il service worker a diventare attivo subito
  self.skipWaiting();
});

// Attivazione del Service Worker: pulizia vecchie cache
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Attivazione');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se la cache non è quella corrente, eliminala
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Rimozione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Rendi il SW attivo in tutte le pagine subito
  self.clients.claim();
});

// Intercetta le richieste e usa prima la cache, poi la rete
self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch:', event.request.url);
  event.respondWith(
    caches.match(event.request).then(response => {
      // Se la risorsa è in cache, restituiscila subito
      if (response) {
        return response;
      }
      // Altrimenti, prova a scaricarla dalla rete
      return fetch(event.request).then(networkResponse => {
        // Se la risposta non è valida, restituiscila così com’è
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        // Altrimenti, mettiamo una copia in cache
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
