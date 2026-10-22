/* Service Worker der POI Erfassung: hält die App offline startbar und liefert Updates aus.
   Bei jeder neuen Version VERSION hier und APP_VERSION in index.html gleich setzen. */
const VERSION = '2026-10-22.1';
const CACHE = 'poi-erfassung-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', e => {
  // App-Dateien am Browser-Cache vorbei holen, damit wirklich die neue Version gespeichert wird
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, { cache: 'no-store' }).then(r => c.put(f, r))))).then(() => self.skipWaiting()));
});
const tellVersion = () => self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(c => c.postMessage({ type: 'version', v: VERSION })));
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'poi-erfassung-ext').map(k => caches.delete(k))))
    .then(() => self.clients.claim()).then(tellVersion));
});
self.addEventListener('message', e => { if(e.data === 'version?') e.source && e.source.postMessage({ type: 'version', v: VERSION }); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  if(u.origin === location.origin){   // App-Dateien: zuerst Netz ohne Browser-Cache, offline aus dem Cache
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { if(r.ok){ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
  }else if(/cdnjs\.cloudflare\.com|wmts\.geo\.admin\.ch/.test(u.host)){   // Leaflet und angeschaute Kartenkacheln zwischenspeichern
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open('poi-erfassung-ext').then(k => k.put(e.request, c)); return res; })));
  }
});
