// Nome della cache e lista delle risorse da pre-cachare
const CACHE_NAME = 'csvxpress-cache-v1';
const urlsToCache = [
  '/', // Assicurati che il server risponda correttamente alla root
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon/CSVXpress-192.png',
  '/icon/CSVXpress-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js'
];

// Fase di installazione: apre la cache e pre-carica le risorse elencate
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installazione');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching delle risorse');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fase di attivazione: pulisce le vecchie cache
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Attivazione');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Rimozione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Gestione delle richieste (fetch)
self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se la richiesta è presente nella cache, restituiscila
        if (response) {
          return response;
        }
        // Altrimenti, esegui la fetch dalla rete e aggiungi il risultato nella cache
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest)
          .then(response => {
            // Se la risposta non è valida, restituiscila senza cache
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      }).catch(() => {
        // In caso di errore (es. offline), se la richiesta è per una pagina, restituisci index.html come fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});
