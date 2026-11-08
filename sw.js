// Service worker: guarda la app en el teléfono para que funcione sin internet.
const CACHE = 'oasis-daily-v6';
const ARCHIVOS = ['./', 'index.html', 'style.css', 'app.js', 'google.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
    self.clients.claim();
});

// Primero la red (para recibir actualizaciones); si no hay conexión, la copia guardada.
self.addEventListener('fetch', (e) => {
    // Solo guardamos los archivos de la app (no las llamadas a Google)
    if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
    e.respondWith(
        fetch(e.request)
            .then((r) => {
                const copia = r.clone();
                caches.open(CACHE).then((c) => c.put(e.request, copia));
                return r;
            })
            .catch(() => caches.match(e.request))
    );
});

// Al tocar una notificación, abrir la app
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(self.clients.matchAll({ type: 'window' }).then((ws) => (ws[0] ? ws[0].focus() : self.clients.openWindow('./'))));
});
