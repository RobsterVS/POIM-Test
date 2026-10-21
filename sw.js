/* Service Worker der POI Erfassung: hält die App offline startbar.
   Bei neuer Version CACHE hochzählen, dann holt sich die App die neuen Dateien beim nächsten Start mit Netz. */
const CACHE = 'poi-erfassung-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  if(u.origin === location.origin){   // App-Dateien: zuerst Netz (für Updates), sonst Cache
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  }else if(/cdnjs\.cloudflare\.com|wmts\.geo\.admin\.ch/.test(u.host)){   // Leaflet und angeschaute Kartenkacheln zwischenspeichern
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE + '-ext').then(k => k.put(e.request, c)); return res; })));
  }
});
