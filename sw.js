/* Franko — fonctionne hors ligne : l'interface est mise en cache, les données restent dans le navigateur.
   Pages : le réseau d'abord (une mise en ligne arrive tout de suite), le cache si on est hors ligne.
   Fichiers : servis depuis le cache puis rafraîchis en arrière-plan, pour la visite suivante. */
const CACHE = 'franko-v6';
const SHELL = ['./', 'index.html', 'app.html', 'legal.html', 'css/app.css', 'css/site.css', 'config.js', 'js/logic.js', 'js/tax.js', 'js/i18n.js', 'js/store.js', 'js/app.js', 'js/vendor/jsQR.js', 'manifest.webmanifest', 'icons/icon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
const store = (req, res) => { if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return; // API Supabase et polices : réseau direct
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => store(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('app.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => {
    const net = fetch(req).then((r) => store(req, r)).catch(() => hit);
    if (hit) { e.waitUntil(net); return hit; }
    return net;
  }));
});
