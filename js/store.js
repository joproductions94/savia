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
  let listeners = [], timer = null, running = false, again = false, lastIngest = null;

  function normalize(d) {
    const e = F.emptyDoc();
    if (!d || !d.settings) return e;
    const out = { ...e, ...d, v: 2, settings: { ...e.settings, ...d.settings } };
    for (const k of ['accounts', 'fixed', 'checks', 'planned', 'tx']) out[k] = Array.isArray(d[k]) ? d[k] : [];
    return out;
  }
  const emit = () => listeners.forEach((fn) => { try { fn(); } catch (e) { /* une vue ne doit pas bloquer les autres */ } });
  function setStatus(s) { if (status !== s) { status = s; emit(); } }

  function save() {
    doc.updatedAt = Date.now();
    ls.set(KEY, doc);
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
    ls.set(SKEY, session);
    return true;
  }
  // Retour du lien magique : #access_token=…&refresh_token=…
  function readHash() {
    const h = root.location && root.location.hash;
    if (!h || h.indexOf('access_token=') < 0) return false;
    const p = new URLSearchParams(h.slice(1));
    session = { access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_at: Math.floor(Date.now() / 1000) + +(p.get('expires_in') || 3600) };
    try { session.email = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email; } catch (e) { /* jeton illisible : l'e-mail s'affichera après /user */ }
    ls.set(SKEY, session);
    try { root.history.replaceState(null, '', root.location.pathname + root.location.search); } catch (e) { root.location.hash = ''; }
    return true;
  }
  async function signIn(email) {
    if (!cloud) throw new Error('unavailable');
    const r = await api('/auth/v1/otp', { method: 'POST', body: JSON.stringify({ email, create_user: true, options: { emailRedirectTo: root.location.origin + root.location.pathname } }) });
    if (!r.ok) throw new Error('send');
  }
  function signOutLocal() { session = null; ls.del(SKEY); ls.del(REVKEY); rev = 0; plan = { tier: cfg.billing ? 'free' : 'beta' }; setStatus('local'); }
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
  async function loadPlan() {
    if (!cfg.billing) { plan = { tier: 'beta' }; return; }
    try {
      const r = await api('/rest/v1/subscriptions?select=status,current_period_end', { headers: { Accept: 'application/json' } });
      const rows = r.ok ? await r.json() : [];
      const s = rows[0];
      plan = s && (s.status === 'active' || s.status === 'trialing') ? { tier: 'pro', until: s.current_period_end } : { tier: 'free' };
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

  function init() {
    if (cloud && readHash()) status = 'busy';
    if (cloud && session) { sync(); root.addEventListener('online', sync); root.addEventListener('focus', () => { if (status !== 'busy') sync(); }); }
  }

  root.Store = {
    init, save, replace, sync, signIn, signOut, billing, createIngestKey,
    takeIngested() { const x = lastIngest; lastIngest = null; return x; },
    get ingestUrl() { return cloud ? cfg.supabaseUrl + '/functions/v1/ingest' : ''; },
    get doc() { return doc; }, get status() { return status; }, get session() { return session; }, get cloud() { return cloud; },
    get plan() { return plan; }, get config() { return cfg; },
    isPro: () => plan.tier === 'pro' || plan.tier === 'beta',
    on(fn) { listeners.push(fn); },
    ui: { get: (k, d) => ls.get('franko.ui.' + k, d), set: (k, v) => ls.set('franko.ui.' + k, v) },
    persistent: ls.set('franko.probe', 1),
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
