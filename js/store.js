/* Franko — stockage : ce téléphone d'abord (localStorage), puis compte en ligne (Supabase) quand il est configuré.
   La synchronisation relit le document distant, fusionne (la dernière modification gagne, élément par élément)
   et n'écrit que si la version de base n'a pas changé : aucun changement fait ailleurs n'est effacé. */
(function (root) {
  'use strict';
  const F = root.F;
  const cfg = Object.assign({ supabaseUrl: '', supabaseAnonKey: '', billing: false, priceMonth: '4.90', priceYear: '49' }, root.FRANKO_CONFIG || {});
  const KEY = 'franko.doc', SKEY = 'franko.session', REVKEY = 'franko.rev';
  const ls = {
    get(k, d) { try { const v = root.localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { root.localStorage.removeItem(k); } catch (e) { /* stockage indisponible */ } },
  };
  const cloud = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  let doc = normalize(ls.get(KEY, null));
  let session = ls.get(SKEY, null);
  let rev = ls.get(REVKEY, 0);
  let status = cloud && session ? 'ok' : 'local';
  let plan = { tier: cfg.billing ? 'free' : 'beta', until: null };
  let admin = !!(session && ls.get('franko.admin', false)), adminChecked = false;
  let listeners = [], timer = null, running = false, again = false, lastIngest = null, handedOff = false;
  // App ajoutée à l'écran d'accueil (iPhone) : son stockage est séparé de celui de Safari.
  const standalone = () => { try { return root.navigator.standalone === true || root.matchMedia('(display-mode: standalone)').matches; } catch (e) { return false; } };
  const HKEY = 'franko.handoff';
  // iPhone : Safari et l'app de l'écran d'accueil ne partagent pas leurs données. Sans compte, Safari garde
  // une copie chiffrée sur le serveur (clé jamais envoyée) et met son identifiant dans l'adresse de la page ;
  // l'app ajoutée à l'écran d'accueil s'ouvre sur cette adresse et récupère tout.
  const isIOS = (() => { try { const n = root.navigator; return /iPhone|iPad|iPod/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1); } catch (e) { return false; } })();
  const TKEY = 'franko.transfer', TDONE = 'franko.transferDone';
  let transferred = false, ttimer = null;
  const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');
  const unhex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
  const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return root.btoa(s); };
  const unb64 = (s) => Uint8Array.from(root.atob(s), (c) => c.charCodeAt(0));
  async function aes(keyHex) { return root.crypto.subtle.importKey('raw', unhex(keyHex), 'AES-GCM', false, ['encrypt', 'decrypt']); }
  function transferCode() {
    let c = ls.get(TKEY, null);
    if (!c || !/^[0-9a-f]{64}$/.test(c)) { const a = new Uint8Array(32); root.crypto.getRandomValues(a); c = hex(a); ls.set(TKEY, c); }
    return c;
  }
  const wantsTransfer = () => cloud && isIOS && !standalone() && !session && !!(doc && doc.settings && doc.settings.salary);
  function showTransferInUrl() {
    try {
      const q = new URLSearchParams(root.location.search);
      if (q.get('t') === ls.get(TKEY, null)) return;
      q.set('t', transferCode());
      root.history.replaceState(null, '', root.location.pathname + '?' + q + root.location.hash);
    } catch (e) { /* adresse inchangée */ }
  }
  async function pushTransfer() {
    if (!wantsTransfer() || !root.crypto || !root.crypto.subtle) return;
    try {
      const code = transferCode(), iv = new Uint8Array(12); root.crypto.getRandomValues(iv);
      const ct = new Uint8Array(await root.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aes(code.slice(32)), new TextEncoder().encode(JSON.stringify(doc))));
      const r = await fetch(cfg.supabaseUrl + '/rest/v1/rpc/put_transfer', { method: 'POST', headers: { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_id: code.slice(0, 32), p_data: b64(iv) + '.' + b64(ct) }) });
      if (r.ok) showTransferInUrl();
    } catch (e) { /* hors ligne : on réessaiera à la prochaine modification */ }
  }
  const scheduleTransfer = () => { if (!wantsTransfer()) return; clearTimeout(ttimer); ttimer = setTimeout(pushTransfer, 1500); };
  async function pullTransfer() {
    let code = null;
    try { code = new URLSearchParams(root.location.search).get('t'); } catch (e) { /* pas d'adresse */ }
    if (!cloud || !code || !/^[0-9a-f]{64}$/.test(code) || ls.get(TDONE, null) === code || code === ls.get(TKEY, null)) return false;
    try {
      const r = await fetch(cfg.supabaseUrl + '/rest/v1/rpc/take_transfer', { method: 'POST', headers: { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_id: code.slice(0, 32) }) });
      const data = r.ok ? await r.json() : null;
      if (!data) { ls.set(TDONE, code); return false; }
      const [iv, ct] = String(data).split('.');
      const plain = await root.crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await aes(code.slice(32)), unb64(ct));
      const remote = normalize(JSON.parse(new TextDecoder().decode(plain)));
      doc = doc.settings.salary ? F.merge(doc, remote) : remote;
      ls.set(KEY, doc); ls.set(TDONE, code); transferred = true; emit();
      if (session) save();
      return true;
    } catch (e) { return false; }
  }

  function normalize(d) {
    const e = F.emptyDoc();
    if (!d || !d.settings) return e;
    const out = { ...e, ...d, v: 2, settings: { ...e.settings, ...d.settings } };
    for (const k of ['accounts', 'fixed', 'checks', 'planned', 'goals', 'tx']) out[k] = Array.isArray(d[k]) ? d[k] : [];
    return out;
  }
  const emit = () => listeners.forEach((fn) => { try { fn(); } catch (e) { /* une vue ne doit pas bloquer les autres */ } });
  function setStatus(s) { if (status !== s) { status = s; emit(); } }

  function save() {
    doc.updatedAt = Date.now();
    ls.set(KEY, doc);
    scheduleTransfer();
    if (cloud && session) { setStatus('pending'); clearTimeout(timer); timer = setTimeout(sync, 1200); }
  }
  function replace(d) { doc = normalize(d); ls.set(KEY, doc); emit(); }

  // ---------- Supabase (REST, sans bibliothèque) ----------
  const api = (path, opts) => fetch(cfg.supabaseUrl + path, {
    ...opts,
    headers: { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json', ...(session ? { Authorization: 'Bearer ' + session.access_token } : {}), ...((opts && opts.headers) || {}) },
  });
  async function refresh() {
    if (!session || !session.refresh_token) return false;
    if (session.expires_at && session.expires_at * 1000 - Date.now() > 60000) return true;
    const r = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) });
    if (!r.ok) { if (r.status === 400 || r.status === 401) signOutLocal(); return false; }
    const j = await r.json();
    session = { ...session, ...j, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600) };
    if (j.user && j.user.email) session.email = j.user.email;
    ls.set(SKEY, session);
    return true;
  }
  // Retour du lien magique : #access_token=…&refresh_token=…
  function readHash() {
    const h = root.location && root.location.hash;
    if (!h || h.indexOf('access_token=') < 0) return false;
    const p = new URLSearchParams(h.slice(1));
    session = { access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_at: Math.floor(Date.now() / 1000) + +(p.get('expires_in') || 3600) };
    try { const b = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); session.email = JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4))).email; } catch (e) { /* jeton illisible : l'e-mail s'affichera après /user */ }
    ls.set(SKEY, session);
    const q = new URLSearchParams(root.location.search), code = q.get('handoff');
    q.delete('handoff');
    try { root.history.replaceState(null, '', root.location.pathname + (q.toString() ? '?' + q : '')); } catch (e) { root.location.hash = ''; }
    // Connexion demandée par l'app de l'écran d'accueil mais terminée ici (Safari) : on lui passe la session.
    if (code && ls.get(HKEY, null) !== code) { handOff(code); return 'handoff'; }
    if (code) ls.del(HKEY);
    return true;
  }
  async function handOff(code) {
    try {
      const r = await api('/rest/v1/rpc/put_handoff', { method: 'POST', body: JSON.stringify({ p_code: code, p_refresh: session.refresh_token }) });
      if (!r.ok) throw new Error('handoff ' + r.status);
      // la session part vers l'app : on l'oublie ici sans la révoquer (sinon l'app serait déconnectée)
      session = null; ls.del(SKEY); ls.del(REVKEY); rev = 0; handedOff = true; setStatus('local'); emit();
    } catch (e) { handedOff = false; status = 'ok'; sync(); } // échec : la connexion reste au moins valable ici
  }
  // L'app de l'écran d'accueil reprend la session déposée par Safari (une seule fois, code valable 10 minutes).
  async function takeHandoff() {
    const code = ls.get(HKEY, null);
    if (!code || session) return false;
    try {
      const r = await api('/rest/v1/rpc/take_handoff', { method: 'POST', body: JSON.stringify({ p_code: code }) });
      const token = r.ok ? await r.json() : null;
      if (!token) return false;
      session = { refresh_token: token, expires_at: 0 };
      if (!(await refresh())) { session = null; return false; }
      ls.del(HKEY); ls.set(SKEY, session);
      sync();
      return true;
    } catch (e) { return false; }
  }
  async function signIn(email) {
    if (!cloud) throw new Error('unavailable');
    const r = await api('/auth/v1/otp', { method: 'POST', body: JSON.stringify({ email, create_user: true, options: { emailRedirectTo: root.location.origin + root.location.pathname.replace(/[^/]*$/, '') + 'app.html' } }) });
    if (!r.ok) throw new Error(r.status === 429 ? 'rate' : r.status === 400 || r.status === 422 ? 'invalid' : 'send'); // le message affiché en dépend
  }
  function signOutLocal() { session = null; ls.del(SKEY); ls.del(REVKEY); ls.del('franko.admin'); admin = false; adminChecked = false; rev = 0; plan = { tier: cfg.billing ? 'free' : 'beta' }; setStatus('local'); }
  async function signOut() { try { if (session) await api('/auth/v1/logout', { method: 'POST' }); } catch (e) { /* déconnexion locale quand même */ } signOutLocal(); }

  async function pull() {
    const r = await api('/rest/v1/budget_docs?select=doc,rev', { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('pull ' + r.status);
    const rows = await r.json();
    return rows[0] || null;
  }
  async function sync() {
    if (!cloud || !session) return;
    if (running) { again = true; return; }
    running = true; setStatus('busy');
    try {
      if (!(await refresh())) throw new Error('auth');
      for (let i = 0; i < 4; i++) {
        const remote = await pull();
        if (remote) {
          const merged = F.merge(doc, normalize(remote.doc));
          F.repairFixedPayments(merged); // les doublons venus d'un autre appareil sont réparés après la fusion
          if (!F.sameDoc(merged, doc)) { doc = merged; ls.set(KEY, doc); emit(); }
          rev = remote.rev;
          if (F.sameDoc(doc, normalize(remote.doc))) break;
        }
        const r = await api('/rest/v1/rpc/save_budget_doc', { method: 'POST', body: JSON.stringify({ p_doc: doc, p_base_rev: remote ? remote.rev : 0 }) });
        if (r.ok) { const j = await r.json(); rev = typeof j === 'number' ? j : j.rev || rev + 1; break; }
        if (r.status !== 409) throw new Error('save ' + r.status); // 409 : quelqu'un a écrit entre-temps, on refusionne
      }
      ls.set(REVKEY, rev);
      await drainInbox();
      await loadPlan();
      setStatus('ok');
    } catch (e) {
      setStatus('err');
    } finally {
      running = false;
      if (again) { again = false; setTimeout(sync, 300); }
    }
  }
  // Paiements reçus par le serveur (Apple Pay, Wallet) : ajoutés au budget puis retirés de la boîte de réception.
  async function drainInbox() {
    const r = await api('/rest/v1/inbox?select=id,payload&order=received_at.asc&limit=200', { headers: { Accept: 'application/json' } });
    if (!r.ok) return;
    const rows = await r.json();
    if (!rows.length) return;
    const added = [];
    for (const row of rows) { const x = F.ingest(doc, F.parseIngest(row.payload, { learned: doc.settings.learned })); if (x) added.push(x); }
    if (added.length) {
      doc.updatedAt = Date.now(); ls.set(KEY, doc);
      const remote = await pull();
      const w = await api('/rest/v1/rpc/save_budget_doc', { method: 'POST', body: JSON.stringify({ p_doc: remote ? F.merge(doc, normalize(remote.doc)) : doc, p_base_rev: remote ? remote.rev : 0 }) });
      if (!w.ok) return; // on réessaiera : les identifiants évitent tout doublon
      lastIngest = added;
      emit();
    }
    await api('/rest/v1/inbox?id=in.(' + rows.map((x) => x.id).join(',') + ')', { method: 'DELETE' });
  }
  async function createIngestKey() {
    if (!cloud || !session) throw new Error('auth');
    await refresh();
    const r = await api('/rest/v1/rpc/create_ingest_token', { method: 'POST', body: '{}' });
    if (!r.ok) throw new Error('key');
    return r.json();
  }
  // Administrateur : décidé par le serveur (secret ADMIN_EMAILS), vérifié une fois par session.
  async function checkAdmin() {
    if (adminChecked) return;
    try {
      const r = await api('/functions/v1/admin', { method: 'POST', body: JSON.stringify({ action: 'me' }) });
      if (r.ok) { admin = !!(await r.json()).admin; adminChecked = true; ls.set('franko.admin', admin); }
    } catch (e) { /* hors ligne : garde la dernière réponse */ }
  }
  async function loadPlan() {
    await checkAdmin();
    if (admin) { plan = { tier: 'pro', comp: true, owner: true }; return; } // le propriétaire ne paie pas
    if (!cfg.billing) { plan = { tier: 'beta' }; return; }
    try {
      const r = await api('/rest/v1/subscriptions?select=status,current_period_end,comp', { headers: { Accept: 'application/json' } });
      const rows = r.ok ? await r.json() : [];
      const s = rows[0];
      plan = s && s.comp ? { tier: 'pro', comp: true } : s && (s.status === 'active' || s.status === 'trialing') ? { tier: 'pro', until: s.current_period_end } : { tier: 'free' };
    } catch (e) { /* garde le plan connu */ }
  }
  async function billing(action, interval) {
    if (!cloud || !session) throw new Error('auth');
    await refresh();
    const r = await api('/functions/v1/billing', { method: 'POST', body: JSON.stringify({ action, interval, returnUrl: root.location.href }) });
    if (!r.ok) throw new Error('billing');
    const j = await r.json();
    if (j.url) root.location.href = j.url;
  }

  // Fournisseurs activés dans Supabase (Authentication › Providers) : seuls leurs boutons s'affichent.
  let providers = ls.get('franko.providers', {});
  async function loadProviders() {
    try {
      const r = await fetch(cfg.supabaseUrl + '/auth/v1/settings', { headers: { apikey: cfg.supabaseAnonKey } });
      if (!r.ok) return;
      const ext = (await r.json()).external || {};
      const next = { apple: !!ext.apple, google: !!ext.google };
      if (JSON.stringify(next) !== JSON.stringify(providers)) { providers = next; ls.set('franko.providers', next); emit(); }
    } catch (e) { /* hors ligne : garde la dernière liste */ }
  }
  function signInWith(provider) {
    if (!cloud) throw new Error('unavailable');
    let back = root.location.origin + root.location.pathname.replace(/[^/]*$/, '') + 'app.html';
    if (standalone()) {
      const a = new Uint8Array(16); root.crypto.getRandomValues(a);
      const code = [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
      ls.set(HKEY, code); back += '?handoff=' + code;
    }
    root.location.href = `${cfg.supabaseUrl}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(back)}`;
  }
  function init() {
    if (cloud) loadProviders();
    try { if (root.navigator.storage && root.navigator.storage.persist) root.navigator.storage.persist(); } catch (e) { /* demande facultative */ }
    if (!cloud) return;
    pullTransfer();
    if (wantsTransfer()) { if (ls.get(TKEY, null)) showTransferInUrl(); scheduleTransfer(); }
    const h = readHash();
    if (h === true) status = 'busy';
    if (h === 'handoff') { /* la session part vers l'app de l'écran d'accueil */ } else if (session) sync(); else takeHandoff().then((ok) => { if (ok) emit(); });
    const wake = () => {
      if (!session) {
        const s = ls.get(SKEY, null); // connexion terminée dans une autre fenêtre qui partage ce stockage
        if (s) { session = s; sync(); } else takeHandoff().then((ok) => { if (ok) emit(); });
      } else if (status !== 'busy') sync();
    };
    root.addEventListener('online', wake);
    root.addEventListener('focus', wake);
    root.addEventListener('visibilitychange', () => { if (!root.document.hidden) wake(); });
  }

  root.Store = {
    init, save, replace, sync, signIn, signInWith, signOut, billing, createIngestKey,
    get providers() { return providers; },
    get handedOff() { return handedOff; },
    get isIOS() { return isIOS; },
    takeTransferred() { const x = transferred; transferred = false; return x; },
    get standalone() { return standalone(); },
    takeIngested() { const x = lastIngest; lastIngest = null; return x; },
    get ingestUrl() { return cloud ? cfg.supabaseUrl + '/functions/v1/ingest' : ''; },
    get doc() { return doc; }, get status() { return status; }, get session() { return session; }, get cloud() { return cloud; },
    get plan() { return plan; }, get config() { return cfg; },
    isPro: () => plan.tier === 'pro' || plan.tier === 'beta',
    isAdmin: () => !!session && admin,
    on(fn) { listeners.push(fn); },
    ui: { get: (k, d) => ls.get('franko.ui.' + k, d), set: (k, v) => ls.set('franko.ui.' + k, v) },
    persistent: ls.set('franko.probe', 1),
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
