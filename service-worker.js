// Service Worker base per CSVXpress

self.addEventListener('install', event => {
  console.log('Service Worker installato');
  // Salta l'attesa per l'installazione
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker attivato');
});

self.addEventListener('fetch', event => {
  // Strategia semplice: prova a fare il fetch e, in caso di errore, recupera dal cache (se implementato in futuro)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
