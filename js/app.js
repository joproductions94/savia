/* Interface de l'app d'exemple : une liste (ajouter, cocher, modifier, supprimer), un suivi, des réglages complets.
   Remplacez VIEWS.home et VIEWS.stats par votre métier ; le reste (compte, Pro, propriétaire, langue, thème,
   sauvegarde, dialogues, notifications, hors ligne) sert tel quel à toutes les apps. */
(function () {
  'use strict';
  const S = window.Store, I = window.I18n, C = window.Core;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const APP = S.config.appName || 'MonApp';
  const t = (k, p) => I.t(k, { app: APP, ...(p || {}) });
  const doc = () => S.doc;
  const save = () => { S.save(); render(); };
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const stateBtn = (done, todo, doneLabel, attrs) => `<button type="button" class="state${done ? ' done' : ''}" ${attrs} aria-pressed="${done}"><span class="box">${CHECK}</span>${done ? doneLabel : todo}</button>`;

  // ---------- état de l'interface (par appareil) ----------
  const ui = Object.assign({ tab: 'home', theme: 'auto', lang: null }, S.ui.get('state', {}));
  const saveUi = () => S.ui.set('state', ui);
  I.setLang(ui.lang || (doc().settings && doc().settings.lang) || navigator.language);
  let dFmt;
  const setLocale = () => { dFmt = new Intl.DateTimeFormat(I.locale, { day: 'numeric', month: 'short' }); };
  setLocale();
  const day = (ms) => dFmt.format(new Date(ms));
  function applyTheme() { const r = document.documentElement; if (ui.theme === 'light' || ui.theme === 'dark') r.dataset.theme = ui.theme; else delete r.dataset.theme; }

  // ---------- vues ----------
  const items = () => C.live(doc().items).sort((a, b) => (a.done - b.done) || (b.createdAt || 0) - (a.createdAt || 0));
  const VIEWS = {
    home() {
      const list = items(), open = list.filter((x) => !x.done).length;
      return `<section>
        <div class="section-head"><h2>${t('home.title')}</h2><span class="sub">${t('home.open', { n: open })} · ${t('home.done', { n: list.length - open })}</span></div>
        <div class="card flush">${list.length ? `<ul class="list">${list.map((x) => `<li>
          <button class="row" data-action="edit-item" data-id="${esc(x.id)}"><span class="main"><span class="title${x.done ? ' muted' : ''}">${esc(x.title)}</span>${x.note ? `<span class="meta">${esc(x.note)}</span>` : `<span class="meta">${esc(day(x.createdAt || Date.now()))}</span>`}</span></button>
          ${stateBtn(!!x.done, t('item.todo'), t('item.doneState'), `data-action="toggle-item" data-id="${esc(x.id)}"`)}</li>`).join('')}</ul>`
        : `<p class="empty">${t('home.empty')}</p>`}</div>
      </section>`;
    },
    stats() {
      const list = items(), done = list.filter((x) => x.done).length;
      const week = list.filter((x) => (x.createdAt || 0) > Date.now() - 7 * 864e5).length;
      const rate = list.length ? Math.round((done / list.length) * 100) : 0;
      return `<section class="card">
        <h2>${t('stats.title')}</h2>
        <dl class="stats plain">
          <div><dt>${t('stats.total')}</dt><dd class="num">${list.length}</dd></div>
          <div><dt>${t('stats.done')}</dt><dd class="num">${done}</dd></div>
          <div><dt>${t('stats.rate')}</dt><dd class="num">${rate} %</dd></div>
        </dl>
        <div class="meter" style="--c:var(--primary);margin-top:12px"><i style="width:${rate}%"></i></div>
        <p class="hint" style="margin-top:10px">${t('stats.week')} : <b>${week}</b></p>
      </section>
      <section class="stack-v"><button class="btn block" data-action="export">${t('set.export')}</button>${S.isPro() ? '' : `<p class="hint">${t('stats.pro')}</p>`}</section>`;
    },
    settings() {
      const opt = (v, l, cur) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`;
      return `${accountHtml()}
      <section class="card form">
        <div class="grid2">
          <label class="field">${t('set.lang')}<select name="lang">${opt('fr', 'Français', I.lang)}${opt('de', 'Deutsch', I.lang)}${opt('it', 'Italiano', I.lang)}</select></label>
          <label class="field">${t('set.theme')}<select name="theme">${['auto', 'light', 'dark'].map((k) => opt(k, t('set.theme.' + k), ui.theme)).join('')}</select></label>
        </div>
      </section>
      <section class="card form"><h2>${t('set.data')}</h2>
        <div class="row-btns"><button class="btn" data-action="export">${t('set.export')}</button><button class="btn" data-action="backup">${t('set.backup')}</button><button class="btn" data-action="restore">${t('set.restore')}</button></div>
        <button class="btn danger block" data-action="wipe">${t('set.wipe')}</button>
      </section>
      <p class="small muted" style="text-align:center">${esc(APP)} · <a class="link" href="legal.html">${t('set.legal')}</a></p>`;
    },
  };

  // ---------- compte, abonnement, propriétaire ----------
  function accountHtml() {
    const cfg = S.config, sess = S.session, plan = S.plan;
    const planLine = plan.comp ? `<p class="hint"><span class="pill ok">Pro</span> ${t(plan.owner ? 'plan.owner' : 'plan.comp')}</p>`
      : plan.tier === 'beta' ? `<p class="hint"><span class="pill beta">Bêta</span> ${t('plan.beta')}</p>`
      : `<p class="small">${t('plan.' + plan.tier)}${plan.tier === 'free' ? ` · ${t('plan.price', { month: cfg.priceMonth, year: cfg.priceYear })}` : ''}</p>`;
    const adminLink = S.isAdmin() ? `<a class="btn primary block" href="admin.html">${t('admin.open')}</a>` : '';
    let auth;
    if (!S.cloud) auth = `<p class="hint">${t('auth.local')} ${t('auth.unavailable')}</p>`;
    else if (sess) auth = `<p class="small">${t('auth.signedIn', { email: esc(sess.email || '') })}</p><div class="row-btns">${plan.tier === 'free' ? `<button class="btn primary" data-action="upgrade">${t('plan.upgrade')}</button>` : plan.tier === 'pro' && !plan.comp ? `<button class="btn" data-action="manage-billing">${t('plan.manage')}</button>` : ''}<button class="btn" data-action="sign-out">${t('auth.signOut')}</button></div>`;
    else auth = `<p class="hint">${t('auth.local')}</p><form id="signIn" class="form"><label class="field">${t('auth.email')}<input name="email" type="email" autocomplete="email" required></label><button class="btn primary block">${t('auth.send')}</button></form>`;
    return `<section class="card form"><h2>${t('set.account')}</h2>${planLine}${adminLink}${auth}</section>`;
  }
  // Une fonction réservée à Pro : s'ouvre directement en bêta ou pour un compte Pro, sinon propose l'abonnement.
  function requirePro(feature, fn) {
    if (S.isPro()) return fn();
    openDialog(t('pro.title'), `<p>${t('pro.text', { feature: t('pro.' + feature) })}</p><p class="small muted" style="margin-top:8px">${t('plan.price', { month: S.config.priceMonth, year: S.config.priceYear })}</p>`,
      `<button class="btn primary" value="up">${t('plan.upgrade')}</button>`,
      () => { if (S.session) S.billing('checkout', 'month').catch(() => toast('…')); else go('settings'); });
  }

  // ---------- rendu ----------
  const order = ['home', 'stats', 'settings'];
  function render() {
    applyTheme();
    document.title = APP;
    $('#appName').textContent = APP;
    $('#tabs').dataset.app = APP;
    $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $$('.tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
    $('#fab').hidden = ui.tab !== 'home';
    const b = $('#syncBadge');
    b.hidden = !S.cloud; b.dataset.s = S.status; b.textContent = t('sync.' + S.status);
    const v = $('#view');
    if (v.dataset.tab !== ui.tab) {
      const dir = v.dataset.tab ? Math.sign(order.indexOf(ui.tab) - order.indexOf(v.dataset.tab)) || 1 : 0;
      v.style.setProperty('--dir', dir);
      v.dataset.tab = ui.tab; v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
    }
    v.innerHTML = VIEWS[ui.tab]();
  }
  function go(tab) { ui.tab = order.includes(tab) ? tab : 'home'; saveUi(); render(); window.scrollTo(0, 0); }

  // ---------- dialogues et notifications ----------
  const dlg = $('#dlg');
  let dlgHandler = null, pressed = null, toastTimer = null;
  function openDialog(title, body, foot, handler) {
    dlg.innerHTML = `<form method="dialog" novalidate><div class="dlg-head"><h2>${esc(title)}</h2><button type="button" class="close" data-close aria-label="${esc(t('dlg.close'))}">×</button></div>
      <div class="dlg-body">${body}<div class="dlg-foot row-btns">${foot}</div></div></form>`;
    dlgHandler = handler;
    if (!dlg.open) dlg.showModal();
    const f = dlg.querySelector('input:not([type=hidden]):not([type=checkbox]), select, textarea');
    if (f && !matchMedia('(pointer: coarse)').matches) f.focus();
  }
  dlg.addEventListener('click', (ev) => {
    if (ev.target === dlg || ev.target.closest('[data-close]')) { dlg.close(); return; }
    const b = ev.target.closest('button[value]'); if (b) pressed = b.value;
  });
  dlg.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.target, primary = form.querySelector('.dlg-foot .btn.primary');
    const action = (ev.submitter && ev.submitter.value) || pressed || (primary && primary.value) || 'save';
    pressed = null;
    if ((dlgHandler && dlgHandler(action, new FormData(form))) !== true) dlg.close();
  });
  function confirmDialog(title, text, okLabel) {
    return new Promise((resolve) => {
      openDialog(title, `<p>${esc(text)}</p>`, `<button class="btn" value="no" type="button" data-close>${t('dlg.cancel')}</button><button class="btn primary danger" value="ok">${esc(okLabel)}</button>`, (a) => resolve(a === 'ok'));
      dlg.addEventListener('close', () => resolve(false), { once: true });
    });
  }
  function toast(msg, actions) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span>` + (actions || []).map((a, i) => `<button type="button" data-i="${i}">${esc(a.label)}</button>`).join('');
    el.hidden = false;
    el.onclick = (ev) => { const b = ev.target.closest('button'); if (!b) return; el.hidden = true; actions[+b.dataset.i].fn(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, actions && actions.length ? 6000 : 3000);
  }
  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- l'objet métier de l'exemple ----------
  function itemDialog(x) {
    const isNew = !x;
    openDialog(isNew ? t('item.new') : t('item.edit'), `<div class="form">
      <label class="field">${t('item.title')}<input name="title" value="${esc(x ? x.title : '')}" autocomplete="off" required></label>
      <label class="field">${t('item.note')}<input name="note" value="${esc(x ? x.note || '' : '')}" autocomplete="off"></label></div>`,
    `${isNew ? '' : `<button class="btn danger" value="delete">${t('dlg.delete')}</button>`}<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      if (action === 'delete') {
        C.remove(doc(), 'items', x.id); save();
        toast(t('item.deleted', { title: x.title }), [{ label: t('undo'), fn: () => { C.restore(doc(), 'items', x.id); save(); } }]);
        return;
      }
      const title = String(fd.get('title') || '').trim(), note = String(fd.get('note') || '').trim();
      if (!title) { toast(t('item.err')); return true; }
      if (isNew) C.add(doc(), 'items', { title, note, done: false, createdAt: Date.now() }); else C.update(doc(), 'items', x.id, { title, note });
      save(); toast(t('item.saved'));
    });
  }

  // ---------- actions ----------
  const find = (id) => C.live(doc().items).find((x) => x.id === id);
  const ACTIONS = {
    tab: (el) => go(el.dataset.tab),
    'new-item': () => itemDialog(null),
    'edit-item': (el) => { const x = find(el.dataset.id); if (x) itemDialog(x); },
    'toggle-item': (el) => { const x = find(el.dataset.id); if (x) { C.update(doc(), 'items', x.id, { done: !x.done }); save(); } },
    export: () => requirePro('export', () => download(`${S.config.slug}-${C.today()}.csv`, C.toCSV(doc(), 'items', ['title', 'note', 'done']), 'text/csv;charset=utf-8')),
    backup: () => download(`${S.config.slug}-sauvegarde-${C.today()}.json`, JSON.stringify(doc(), null, 1), 'application/json'),
    restore: () => $('#restoreFile').click(),
    wipe: async () => {
      if (!(await confirmDialog(t('set.wipe'), t('set.wipeConfirm'), t('set.wipe')))) return;
      // chaque objet devient une « pierre tombale » : la suppression se propage aussi aux autres appareils
      const now = Date.now();
      for (const k of C.LISTS) for (const x of C.live(doc()[k])) C.remove(doc(), k, x.id, now);
      doc().settings = { lang: I.lang, updatedAt: now };
      save(); render(); toast(t('set.wiped'));
    },
    upgrade: () => S.billing('checkout', 'month').catch(() => toast('…')),
    'manage-billing': () => S.billing('portal').catch(() => toast('…')),
    'sign-out': () => S.signOut().then(render),
  };
  document.addEventListener('click', (ev) => {
    const tab = ev.target.closest('.tabs [data-tab]');
    if (tab) { go(tab.dataset.tab); return; }
    const el = ev.target.closest('[data-action]');
    if (!el || (el.closest('dialog') && !el.closest('.dlg-body'))) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) { ev.preventDefault(); fn(el); }
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.name === 'lang' && el.closest('#view')) { ui.lang = I.setLang(el.value); setLocale(); saveUi(); Object.assign(doc().settings, { lang: ui.lang, updatedAt: Date.now() }); save(); render(); }
    else if (el.name === 'theme' && el.closest('#view')) { ui.theme = el.value; saveUi(); render(); }
    else if (el.id === 'restoreFile' && el.files[0]) {
      el.files[0].text().then((txt) => { const d = JSON.parse(txt); if (!d || !d.settings) throw new Error('format'); S.replace(C.merge(doc(), C.normalize(d))); S.save(); toast(t('set.restored')); })
        .catch(() => toast(t('set.restoreErr'))).finally(() => { el.value = ''; });
    }
  });
  document.addEventListener('submit', (ev) => {
    if (ev.target.id !== 'signIn') return;
    ev.preventDefault();
    const email = String(new FormData(ev.target).get('email') || '').trim();
    S.signIn(email).then(() => toast(t('auth.sent', { email }))).catch(() => toast(t('auth.unavailable')));
  });

  S.on(render);
  S.init();
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.App = { render, getDoc: doc, toast };
})();
