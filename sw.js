/* Franko — fonctionne hors ligne : l'interface est mise en cache, les données restent dans le navigateur. */
const CACHE = 'franko-v1';
const SHELL = ['./', 'index.html', 'app.html', 'legal.html', 'css/app.css', 'css/site.css', 'config.js', 'js/logic.js', 'js/tax.js', 'js/i18n.js', 'js/store.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // API Supabase et polices : réseau direct
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  })).catch(() => caches.match('app.html')));
});
