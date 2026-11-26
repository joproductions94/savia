/* Franko — interface (sans framework). Logique : F (logic.js), impôts : FrankoTax, textes : I18n, données : Store. */
(function () {
  'use strict';
  const T = window.FrankoTax, I = window.I18n, S = window.Store;
  const t = I.t;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = F.fmt;
  const asDate = (s) => new Date((s.length === 7 ? s + '-01' : s) + 'T00:00:00Z');
  let dShort, dLong, mLong, mShort;
  function setLocale() {
    const loc = I.locale;
    dShort = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    dLong = new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    mLong = new Intl.DateTimeFormat(loc, { month: 'long', timeZone: 'UTC' });
    mShort = new Intl.DateTimeFormat(loc, { month: 'short', timeZone: 'UTC' });
  }
  const ds = (s) => dShort.format(asDate(s)).replace(/\.$/, '');
  const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : 0);
  const catLabel = (id) => t('cat.' + (F.CAT_BY_ID[id] ? id : 'autre'));
  const doc = () => S.doc;
  const ui = Object.assign({ tab: 'home', filter: 'all', offset: 0, theme: 'auto' }, S.ui.get('state', {}));
  const saveUi = () => S.ui.set('state', { tab: ui.tab, filter: ui.filter, theme: ui.theme, lang: ui.lang });
  function save() { S.save(); render(); }
  function setting(patch) { Object.assign(doc().settings, patch, { updatedAt: Date.now() }); save(); }
  const accounts = () => F.live(doc().accounts);
  const accName = (id) => { const a = doc().accounts.find((x) => x.id === id); return a && !a.deleted ? a.name : ''; };

  // ---------- icônes ----------
  const ICONS = {
    courses: '<path d="M3 4h2l2.2 10h10.6L20 7H6"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    bebe: '<path d="M10 3h4M10.5 3v3L8 9v10a2 2 0 002 2h4a2 2 0 002-2V9l-2.5-3V3M8 13h8"/>',
    garde: '<rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/><path d="M12 4l3.5 6h-7z"/>',
    pension: '<path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0112 8a3.8 3.8 0 017 2.5C19 15.6 12 20 12 20z"/>',
    formation: '<path d="M2.5 9L12 5l9.5 4-9.5 4z"/><path d="M6.5 11v4.5c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2V11M21.5 9v5"/>',
    sante: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    transport: '<path d="M5 17v-5.5L7.2 6.5h9.6L19 11.5V17M4 17h16M5 11.5h14M6.5 17v2M17.5 17v2"/><circle cx="8.5" cy="14.2" r=".7"/><circle cx="15.5" cy="14.2" r=".7"/>',
    logement: '<path d="M4 11l8-6.5 8 6.5M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
    assurances: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
    telecom: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
    impots: '<path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5zM9 8h6M9 12h6M9 16h3"/>',
    credit: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
    sorties: '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 3c-2 1.5-2.5 4-2.5 7H17v11"/>',
    loisirs: '<path d="M4 8a2 2 0 002-2h12a2 2 0 002 2v8a2 2 0 00-2 2H6a2 2 0 00-2-2z"/><path d="M14 7v2M14 11v2M14 15v2"/>',
    vetements: '<path d="M9 4l3 2 3-2 5 3-2 4-2-1v10H8V10l-2 1-2-4z"/>',
    maison: '<path d="M5 11V9a2 2 0 012-2h10a2 2 0 012 2v2M3 12a2 2 0 014 0v2h10v-2a2 2 0 014 0v5H3zM6 17v2M18 17v2"/>',
    cadeaux: '<rect x="4" y="9" width="16" height="4" rx="1"/><path d="M5.5 13v7h13v-7M12 9v11M12 9S10.5 4.5 8 5s-1 4 4 4zM12 9s1.5-4.5 4-4 1 4-4 4z"/>',
    epargne: '<ellipse cx="12" cy="6.5" rx="6.5" ry="2.5"/><path d="M5.5 6.5v5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-5M5.5 11.5v5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-5"/>',
    invest: '<path d="M4 17l5-5 3.5 3.5L20 8M15 8h5v5"/>',
    revenu: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
    dons: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2"/>',
    autre: '<circle cx="6.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="17.5" cy="12" r="1.2"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 016.5 5H18v3M4 7.5V17a2 2 0 002 2h14V9H6.5A2.5 2.5 0 014 7.5z"/><circle cx="16" cy="14" r="1.2"/>',
    bank: '<path d="M3.5 9.5L12 4.5l8.5 5M5 10v7.5M9.5 10v7.5M14.5 10v7.5M19 10v7.5M3.5 20h17"/>',
    buoy: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M6 6l3.5 3.5M14.5 14.5L18 18M18 6l-3.5 3.5M9.5 14.5L6 18"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ICONS.autre}</svg>`;
  const tile = (icon, env) => `<span class="ic ${env || 'daily'}" aria-hidden="true">${svg(icon)}</span>`;
  const txEnv = (x) => (x.amount > 0 ? 'income' : x.transfer ? 'transfer' : x.env || F.envOf(x.cat) || 'daily');
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const stateBtn = (done, todo, doneLabel, attrs) => `<button type="button" class="state${done ? ' done' : ''}" ${attrs} aria-pressed="${done}"><span class="box">${CHECK}</span>${done ? doneLabel : todo}</button>`;
  const bigAmount = (v) => `<span class="num">${fmt(v, { bare: true })}</span><span class="cur">CHF</span>`;
  const catOptions = (sel) => F.CATS.map((c) => [c.id, catLabel(c.id)]).sort((a, b) => a[1].localeCompare(b[1], I.locale)).map(([id, l]) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const row = (key, label, v, note, cls) => `<div class="flow-row ${cls || ''}"><span class="key" style="--c:${key ? `var(--${key})` : 'transparent'}"></span><span>${label}${note ? `<small>${note}</small>` : ''}</span><span class="num">${v}</span></div>`;

  // ---------- rendu ----------
  function render() {
    applyTheme();
    $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $('#quickInput').placeholder = t('quick.placeholder');
    $('#quickInput').setAttribute('aria-label', t('quick.add'));
    $('#micBtn').setAttribute('aria-label', t('quick.mic'));
    $('#addBtn').setAttribute('aria-label', t('quick.add'));
    $$('.tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
    const showQuick = (ui.tab === 'home' || ui.tab === 'tx') && !!doc().settings.salary;
    $('#quick').hidden = !showQuick;
    document.body.classList.toggle('no-quick', !showQuick);
    const st = F.monthState(doc());
    const per = st.period;
    $('#periodLabel').textContent = doc().settings.salary ? `${mLong.format(asDate(per.start))} · J-${per.daysLeft}` : '';
    renderBadge();
    const v = $('#view');
    v.innerHTML = (VIEWS[ui.tab] || VIEWS.home)(st);
    if (v.dataset.tab !== ui.tab) {
      // la vue glisse dans le sens de l'onglet choisi, comme une transition de prototype
      const order = ['home', 'tx', 'plan', 'settings'];
      const dir = v.dataset.tab ? Math.sign(order.indexOf(ui.tab) - order.indexOf(v.dataset.tab)) || 1 : 0;
      v.style.setProperty('--dir', dir);
      v.dataset.tab = ui.tab; v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
    }
    hideTip && hideTip();
    afterRender();
  }
  function renderBadge() {
    const b = $('#syncBadge');
    b.hidden = !S.cloud || !S.session;
    b.className = 'sync ' + S.status;
    b.textContent = t('sync.' + S.status);
  }
  function applyTheme() {
    const r = document.documentElement;
    if (ui.theme === 'light' || ui.theme === 'dark') r.dataset.theme = ui.theme; else delete r.dataset.theme;
  }

  function txRow(x) {
    const src = x.source === 'voice' ? t('src.voice') : x.source === 'scan' ? t('src.scan') : '';
    const meta = [catLabel(x.cat), accName(x.accountId), src].filter(Boolean).map(esc).join(' · ');
    const tags = (x.excluded ? `<span class="tag">${t('tag.excluded')}</span>` : '') + (x.transfer ? `<span class="tag tr">${t('tag.transfer')}</span>` : '');
    return `<li><button class="row" data-action="edit-tx" data-id="${esc(x.id)}">
      ${tile(x.cat, txEnv(x))}
      <span class="main"><span class="title">${esc(x.label)}</span><span class="meta">${x.bankConfirmed ? `<span title="${esc(t('tag.bank'))}">${CHECK}</span>` : ''}${meta}</span>${tags ? `<span class="tags">${tags}</span>` : ''}</span>
      <span class="num ${x.amount > 0 ? 'pos' : ''}">${fmt(x.amount, { sign: true })}</span>
    </button></li>`;
  }
  const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.updatedAt || 0) - (a.updatedAt || 0));

  const SETUP_CATS = ['logement', 'assurances', 'garde', 'telecom', 'impots', 'credit'];
  const VIEWS = {
    home(st) {
      const d = doc(), p = st.plan;
      if (!p.salary) {
        return `<section class="card form">
          <h1 style="font-size:1.4rem">${t('home.welcome.title')}</h1>
          <p class="muted">${t('home.welcome.text')}</p>
          <form id="onboard" class="form">
            <label class="field">${t('home.welcome.salary')}<input name="salary" inputmode="decimal" required placeholder="6500"></label>
            <label class="field">${t('home.welcome.payday')}<input name="payday" type="number" inputmode="numeric" min="1" max="28" value="${esc(d.settings.payday || 25)}"></label>
            <label class="field">${t('home.welcome.canton')}<select name="canton">${T.CANTON_LIST.map((c) => `<option ${c === (d.settings.canton || 'FR') ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
            <button class="btn primary block">${t('home.welcome.go')}</button>
          </form>
        </section>`;
      }
      const f = st.flow, per = st.period;
      const al = F.alerts(d).filter((a) => a.id !== 'short').concat(F.swissReminders().map((r) => ({ level: 'info', text: reminderText(r) })).filter((r) => r.text));
      const over = f.left < 0, short = f.leftAfterAll < 0;
      const inTotal = f.salaryIn + f.otherIncome;
      const used = inTotal > 0 ? pct(inTotal - f.left, inTotal) : 100;
      const fast = f.dailyBudget > 0 && f.spentDaily / f.dailyBudget > per.elapsed / per.days + 0.15;
      const status = over ? ['danger', 'status.overdraft'] : short ? ['danger', 'status.short'] : fast ? ['warn', 'status.fast'] : ['ok', 'status.ok'];
      const paidOut = f.fixedPaid + f.invest.deducted + f.savings.deducted;
      const recent = F.live(d.tx).slice().sort(byDateDesc).slice(0, 5);
      const e = p.emergency;
      const setup = F.live(d.fixed).length ? '' : `<section class="card setup">
        <h2>${t('setup.title')}</h2>
        <p class="small muted">${t('setup.text')}</p>
        <div class="chips">${t('setup.items').split('|').map((label, i) => `<button class="chip" data-action="new-fixed" data-label="${esc(label)}" data-cat="${SETUP_CATS[i]}">+ ${esc(label)}</button>`).join('')}<button class="chip" data-action="new-fixed">+ ${t('setup.other')}</button></div>
      </section>`;
      return `<div class="dash"><div class="col">
      ${setup}
      <section class="card hero" aria-label="${esc(t('home.available'))}">
        <div class="hero-top"><span class="eyebrow">${t('home.available')}</span><span class="pill ${status[0]}">${t(status[1])}</span></div>
        <div class="big ${over ? 'neg' : ''}"><span class="num" id="heroNum" data-v="${f.left}">${fmt(f.left, { bare: true })}</span><span class="cur">CHF</span></div>
        <p class="sub">${t('home.onlyPaid', { date: esc(ds(F.addDays(per.end, 1))) })}</p>
        ${f.pending >= 1 ? `<p class="bank-line"><span>${t('home.notPaid')} <b class="num">${fmt(f.pending)}</b></span><span>= ${t('home.afterAll')} <b class="num ${short ? 'neg' : ''}">${fmt(f.leftAfterAll)}</b>${!short && per.daysLeft > 0 ? ` · ${t('home.perDay', { amount: `<b class="num">${fmt(st.perDay)}</b>` })}` : ''}</span></p>` : ''}
        <div class="meter ${over ? 'over' : ''}" data-mk="hero" style="--c:var(--primary)" role="img" aria-label="${Math.round(used)} %"><i style="width:${used.toFixed(1)}%"></i></div>
        <div class="hero-actions"><button class="btn" data-action="new-tx"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>${t('tx.newExpense')}</button><button class="btn" data-action="new-income"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>${t('tx.newIncome')}</button></div>
        <dl class="stats">
          <div><dt>${t(setup ? 'home.estFixed' : 'home.paidOut')}</dt><dd class="num">${fmt(paidOut, { bare: true })}</dd></div>
          <div><dt>${t('home.spent')}</dt><dd class="num">${fmt(f.spentDaily, { bare: true })}</dd></div>
          <div><dt>${t('home.pending')}</dt><dd class="num">${fmt(f.pending, { bare: true })}</dd></div>
        </dl>
      </section>
      ${forecastHtml()}
      ${bonusHtml(st)}
      ${al.length ? `<section><div class="section-head"><h2>${t('home.watch')}</h2></div><div class="card notes">${al.map((a) => `<div class="note ${a.level}">${esc(alertText(a))}</div>`).join('')}</div></section>` : ''}
      ${paceHtml(st)}
      ${calcHtml(st)}
      </div><div class="col">
      ${checksHtml(st)}
      ${fixedSection(st)}
      ${catHtml(st)}
      ${taxCard()}
      <section>
        <div class="section-head"><h2>${t('recent.title')}</h2><button class="link" data-action="tab" data-tab="tx">${t('recent.all')}</button></div>
        <div class="card flush">${recent.length ? `<ul class="list">${recent.map(txRow).join('')}</ul>` : `<p class="empty">${t('recent.empty')}</p>`}</div>
      </section>
      <section class="card gauge">
        <div class="ring" style="--p:${pct(e.fund, e.target).toFixed(0)}"><span>${e.covered}&nbsp;${t('fund.months')}</span></div>
        <div>
          <h2>${t('fund.title')}</h2>
          <div class="small">${t('fund.text', { fund: `<b class="num">${fmt(e.fund)}</b>`, target: fmt(e.target), months: e.months })}</div>
          <div class="small muted">${p.shifted ? t('fund.shift', { amount: fmt(p.shifted) }) : e.level === 'ok' ? t('fund.ok') : t('fund.building')}</div>
        </div>
      </section></div></div>`;
    },

    tx() {
      const d = doc();
      const per = F.periodAt(d, ui.offset);
      const filters = ['all', 'daily', 'fixed', 'saved', 'income', 'transfer'];
      const kindOf = Object.fromEntries(F.live(d.fixed).map((c) => [c.id, F.chargeEnv(c)]));
      const list = F.live(d.tx).filter((x) => x.date >= per.start && x.date <= per.end).filter((x) => {
        if (ui.filter === 'all') return true;
        if (ui.filter === 'income') return x.amount > 0 && !x.transfer;
        if (ui.filter === 'transfer') return x.transfer;
        const e = (x.fixedId && kindOf[x.fixedId]) || x.env || F.envOf(x.cat);
        return x.amount < 0 && (ui.filter === 'saved' ? e === 'savings' || e === 'invest' : e === ui.filter);
      }).sort(byDateDesc);
      const counted = list.filter((x) => !x.transfer && !x.excluded);
      const out = counted.filter((x) => x.amount < 0).reduce((s, x) => s - x.amount, 0);
      const inc = counted.filter((x) => x.amount > 0).reduce((s, x) => s + x.amount, 0);
      let html = '', day = '';
      for (const x of list) {
        if (x.date !== day) { if (day) html += '</ul>'; day = x.date; html += `<div class="day">${esc(dLong.format(asDate(day)))}</div><ul class="list">`; }
        html += txRow(x);
      }
      if (day) html += '</ul>';
      return `
      ${historyHtml()}
      <section id="periodDetail">
        <div class="section-head">
          <button class="link" data-action="period" data-d="1">${t('tx.prev')}</button>
          <h2><span class="cap">${esc(mLong.format(asDate(per.start)))}</span> <span class="small muted" style="font-weight:500">${esc(ds(per.start))} – ${esc(ds(per.end))}</span></h2>
          <button class="link" data-action="period" data-d="-1" ${ui.offset === 0 ? 'disabled style="visibility:hidden"' : ''}>${t('tx.next')}</button>
        </div>
        <div class="chips" role="group">${filters.map((k) => `<button class="chip" data-action="filter" data-f="${k}" aria-pressed="${ui.filter === k}">${t('tx.filter.' + k)}</button>`).join('')}</div>
      </section>
      <section class="card flush">
        <dl class="stats plain">
          <div><dt>${t('tx.out')}</dt><dd class="num">${fmt(out, { bare: true })}</dd></div>
          <div><dt>${t('tx.in')}</dt><dd class="num pos">${fmt(inc, { bare: true })}</dd></div>
          <div><dt>${t('tx.net')}</dt><dd class="num ${inc - out < 0 ? 'neg' : ''}">${fmt(inc - out, { bare: true, sign: true })}</dd></div>
        </dl>
        ${html || `<p class="empty">${t('tx.empty')}</p>`}
      </section>
      <section class="stack-v">
        <button class="btn primary block" data-action="import">${svg('revenu')}${t('tx.import')}</button>
        <div class="row-btns"><button class="btn" data-action="new-tx">${t('tx.newExpense')}</button><button class="btn" data-action="new-income">${t('tx.newIncome')}</button></div>
        <button class="btn block" data-action="scan-bill">${svg('qr')}${t('qr.scan')}</button>
        <button class="btn block" data-action="export-csv">${t('tx.export')}</button>
      </section>
      ${reviewHtml()}`;
    },

    plan(st) {
      const d = doc();
      if (!st.plan.salary) return VIEWS.home(st);
      const charges = F.live(d.fixed).filter((c) => +c.amount > 0).sort((a, b) => b.amount - a.amount);
      const total = charges.reduce((s, c) => s + F.monthlyOf(c), 0);
      return `${nextMonthHtml(st)}
      ${goalsHtml()}
      ${yearlyHtml(st)}
      ${pillarHtml()}
      ${savingsHtml(st)}
      <section>
        <div class="section-head"><h2>${t('plan.chargesTitle')}</h2><button class="link" data-action="new-fixed">${t('fixed.add')}</button></div>
        <div class="card flush">${charges.length ? `<ul class="list">${charges.map((c) => `<li><button class="row" data-action="edit-fixed" data-id="${esc(c.id)}">
            ${tile(c.cat, F.chargeEnv(c))}<span class="main"><span class="title">${esc(c.label)}</span><span class="meta">${esc(catLabel(c.cat))}${F.isYearly(c) ? ` · ${t('fixedd.perYear', { amount: fmt(c.amount), month: esc(monthName(c.dueMonth)) })}` : c.day ? ` · ${esc(c.day)}.` : ''}</span></span>
            <span class="num">${fmt(F.monthlyOf(c))}</span></button></li>`).join('')}</ul>
          <p class="small" style="text-align:right;padding:4px 0 12px">${t('plan.total', { amount: `<b class="num">${fmt(total)}</b>` })}</p>` : `<p class="empty">${t('fixed.empty')}</p>`}</div>
      </section>
      ${taxCard()}
      ${dossierCard()}`;
    },

    settings() {
      const d = doc(), s = d.settings;
      const p = F.plan({ ...s, emergencyFund: F.emergencyFund(d), fixedCharges: d.fixed });
      const sd = F.salaryDates(d); const last = sd[sd.length - 1];
      const urg = accounts().some((a) => a.kind === 'urgence');
      const accs = accounts();
      return `
      <section class="card form" id="setForm">
        <h2>${t('set.money')}</h2>
        <div class="grid2">
          <label class="field">${t('set.salary')}<input name="salary" inputmode="decimal" value="${esc(s.salary || '')}"></label>
          <label class="field">${t('set.canton')}<select name="canton">${T.CANTON_LIST.map((c) => `<option ${c === s.canton ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        </div>
        <div class="grid2">
          <label class="field">${t('set.periodMode')}<select name="periodMode"><option value="salary" ${s.periodMode !== 'payday' ? 'selected' : ''}>${t('set.period.salary')}</option><option value="payday" ${s.periodMode === 'payday' ? 'selected' : ''}>${t('set.period.payday')}</option></select></label>
          <label class="field">${t('set.payday')}<input name="payday" type="number" min="1" max="28" value="${esc(s.payday)}"></label>
        </div>
        <p class="hint">${last ? t('set.lastSalary', { label: esc(last.label), amount: fmt(last.amount), date: esc(ds(last.date)) }) : t('set.noSalary')}</p>
        <label class="field">${t('set.preset')}<select name="preset">${['famille', 'classique', 'serre', 'perso'].map((k) => `<option value="${k}" ${s.preset === k ? 'selected' : ''}>${t('set.preset.' + k)}</option>`).join('')}</select></label>
        ${s.preset === 'perso' ? `<div class="grid4">${F.ENVS.map((k) => `<label class="field">${t('env.' + k)} %<input name="split_${k}" type="number" min="0" max="100" value="${esc(Math.round((s.split || {})[k] || 0))}"></label>`).join('')}</div>` : ''}
        <div class="split-bar">${F.ENVS.map((k) => `<i style="flex:${Math.max(0, p.env[k])};background:var(--${k})"></i>`).join('')}</div>
        <div class="legend">${F.ENVS.map((k) => `<span style="--c:var(--${k})">${t('env.' + k)}<b class="num">${fmt(p.env[k], { bare: true })}</b></span>`).join('')}</div>
      </section>
      <section>
        <div class="section-head"><h2>${t('acc.title')}</h2><button class="link" data-action="new-account">${t('acc.add')}</button></div>
        <div class="card flush">${accs.length ? `<ul class="list">${accs.map((a) => `<li><button class="row" data-action="edit-account" data-id="${esc(a.id)}">
            ${{ courant: tile('bank', 'brand'), epargne: tile('epargne', 'savings'), urgence: tile('buoy', 'savings'), invest: tile('invest', 'invest'), carte: tile('card', 'fixed') }[a.kind] || tile('bank', 'brand')}
            <span class="main"><span class="title">${esc(a.name)}</span><span class="meta">${t('acc.kind.' + (a.kind || 'courant'))}</span></span>
            <span class="num ${a.balance < 0 ? 'neg' : ''}">${fmt(a.balance)}</span></button></li>`).join('')}</ul>` : `<p class="empty">${t('acc.empty')}</p>`}</div>
      </section>
      <section class="card form">
        <h2>${t('set.fund')}</h2>
        <label class="field"><span>${t('set.fundGoal', { months: `<output id="monthsOut">${p.emergency.months}</output>`, amount: fmt(p.emergency.target) })}</span>
          <input name="emergencyMonths" type="range" min="3" max="6" step="1" value="${p.emergency.months}"></label>
        <label class="field">${t('set.fundNow')}<input name="emergencyFund" inputmode="decimal" value="${esc(urg ? F.emergencyFund(d) : s.emergencyFund || '')}" ${urg ? 'disabled' : ''}></label>
        ${urg ? `<p class="hint">${t('set.fundAuto')}</p>` : ''}
      </section>
      ${walletHtml()}
      ${accountHtml()}
      <section class="card form">
        <div class="grid2">
          <label class="field">${t('set.lang')}<select name="lang">${[['fr', 'Français'], ['de', 'Deutsch'], ['it', 'Italiano']].map(([v, l]) => `<option value="${v}" ${I.lang === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field">${t('set.theme')}<select name="theme">${['auto', 'light', 'dark'].map((v) => `<option value="${v}" ${ui.theme === v ? 'selected' : ''}>${t('set.theme.' + v)}</option>`).join('')}</select></label>
        </div>
      </section>
      <section class="card form">
        <h2>${t('set.data')}</h2>
        <div class="row-btns"><button class="btn" data-action="export-csv">${t('set.exportCsv')}</button><button class="btn" data-action="backup">${t('set.backup')}</button></div>
        <div class="row-btns"><button class="btn" data-action="restore">${t('set.restore')}</button><button class="btn danger" data-action="wipe">${t('set.wipe')}</button></div>
      </section>
      <p class="small muted" style="text-align:center">Franko 0.1 · <a class="link" href="legal.html">CGU · ${I.lang === 'de' ? 'Datenschutz' : I.lang === 'it' ? 'Privacy' : 'Confidentialité'}</a></p>`;
    },
  };

  function alertText(a) {
    if (a.text) return a.text;
    const p = { ...a };
    if (a.cat) p.cat = catLabel(a.cat);
    if (a.limit != null) p.limit = fmt(a.limit);
    if (a.amount != null) p.amount = fmt(a.amount);
    if (a.perDay != null) p.perDay = fmt(a.perDay);
    if (a.names) p.names = a.names.join(', ');
    return t('alert.' + a.id, p);
  }

  // ---------- motion : réponses courtes aux actions (≤ 450 ms), dessins une fois par session ----------
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = { left: null, widths: {}, drawn: {}, flash: null };
  function tweenText(el, from, to, dur) {
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e, { bare: true });
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function afterRender() {
    const quiet = reduceMotion.matches;
    // le chiffre principal se compte depuis sa valeur précédente
    const n = $('#heroNum');
    if (n) {
      const v = +n.dataset.v;
      if (!quiet && motion.left != null && Math.abs(motion.left - v) >= 0.01) { tweenText(n, motion.left, v, 450); n.parentElement.classList.add('bump'); }
      motion.left = v;
    }
    // les barres partent de leur largeur précédente
    $$('[data-mk]').forEach((m) => {
      const bar = m.querySelector('i'); if (!bar) return;
      const target = bar.style.width, prev = motion.widths[m.dataset.mk];
      motion.widths[m.dataset.mk] = target;
      if (quiet || prev == null || prev === target) return;
      bar.style.transition = 'none'; bar.style.width = prev;
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = ''; bar.style.width = target; }));
    });
    // retour sur l'élément touché : coche dessinée, nouveau mouvement mis en évidence
    if (motion.flash && !quiet) {
      const f = motion.flash;
      const el = f.type === 'paid' ? $(`.state.done[data-id="${f.id}"]`) : $(`.list button.row[data-id="${f.id}"]`);
      if (el) (f.type === 'paid' ? el : el.closest('li')).classList.add(f.type === 'paid' ? 'pop' : 'flash');
    }
    motion.flash = null;
    // graphiques : tracés une seule fois par session
    for (const [sel, key] of [['.pace-line', 'pace'], ['.hchart', 'hist']]) {
      const el = $(sel);
      if (el && !motion.drawn[key]) { motion.drawn[key] = true; if (!quiet) (key === 'pace' ? el.closest('svg') : el).classList.add('draw'); }
    }
  }

  // ---------- graphiques ----------
  // Rythme du mois : dépenses du quotidien cumulées, comparées au rythme régulier qui épuise le budget le dernier jour.
  function paceHtml(st) {
    const f = st.flow, per = st.period;
    const s = F.dailySeries(doc(), per);
    const budget = Math.max(0, f.dailyBudget);
    if (!s.elapsed) return '';
    const W = 560, H = 210, L = 46, R = 14, T = 14, B = 28;
    const spent = s.cum[s.cum.length - 1] || 0;
    const top = Math.max(budget, spent, 1) * 1.12;
    const x = (i) => L + (i / Math.max(1, s.days - 1)) * (W - L - R);
    const y = (v) => T + (H - T - B) * (1 - v / top);
    const path = s.cum.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const area = `${path} L${x(s.cum.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
    const idealAt = (i) => (budget * (i + 1)) / s.days;
    const ahead = spent > idealAt(s.elapsed - 1) + 0.5;
    const ticks = [0, budget].filter((v, i, a) => a.indexOf(v) === i);
    const labelDays = [0, Math.floor((s.days - 1) / 2), s.days - 1];
    const dayDate = (i) => F.addDays(per.start, i);
    const hits = s.cum.map((v, i) => {
      const tip = `<b>${esc(dLong.format(asDate(dayDate(i))))}</b><br>${t('pace.day')} ${fmt(s.byDay[i])}<br>${t('pace.cum')} ${fmt(v)}<br>${t('pace.ideal')} ${fmt(idealAt(i))}`;
      const w = (W - L - R) / Math.max(1, s.days - 1);
      return `<rect class="hit" x="${(x(i) - w / 2).toFixed(1)}" y="${T}" width="${w.toFixed(1)}" height="${H - T - B}" data-tip="${esc(tip)}" data-cx="${x(i).toFixed(1)}" data-cy="${y(v).toFixed(1)}"/>`;
    }).join('');
    return `<section>
      <div class="section-head"><h2>${t('pace.title')}</h2><span class="sub">${ahead ? `<span class="pill warn">${t('pace.ahead')}</span>` : `<span class="pill ok">${t('pace.onTrack')}</span>`}</span></div>
      <div class="card chart-card">
        <div class="legend inline"><span style="--c:var(--c-daily)">${t('pace.cum')}</span><span class="dash" style="--c:var(--faint)">${t('pace.ideal')}</span></div>
        <div class="chart" data-w="${W}">
          <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('pace.aria', { spent: fmt(spent), budget: fmt(budget) }))}">
            ${ticks.map((v) => `<line class="gridl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v, { bare: true }).replace(/\.\d\d$/, '')}</text>`).join('')}
            ${labelDays.map((i) => `<text class="axis" x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === s.days - 1 ? 'end' : 'middle'}">${esc(ds(dayDate(i)))}</text>`).join('')}
            <line x1="${x(0)}" y1="${y(budget / s.days)}" x2="${x(s.days - 1)}" y2="${y(budget)}" stroke="var(--faint)" stroke-width="1.5" stroke-dasharray="5 5"/>
            <path class="pace-area" d="${area}" fill="var(--c-daily)" fill-opacity=".12"/>
            <path class="pace-line" pathLength="1" d="${path}" fill="none" stroke="var(--c-daily)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
            <circle class="pace-dot" cx="${x(s.cum.length - 1)}" cy="${y(spent)}" r="5" fill="var(--c-daily)" stroke="var(--surface)" stroke-width="2"/>
            <line class="cross" y1="${T}" y2="${H - B}"/>
            ${hits}
          </svg>
        </div>
        <p class="hint">${t('pace.note', { spent: `<b class="num">${fmt(spent)}</b>`, budget: `<b class="num">${fmt(budget)}</b>`, left: s.days - s.elapsed })}</p>
      </div>
    </section>`;
  }
  // Où va l'argent du quotidien : catégories du mois.
  function catHtml(st) {
    const s = F.dailySeries(doc(), st.period);
    const limits = Object.fromEntries(F.limitsState(doc()).map((l) => [l.cat, l]));
    const seen = new Set(s.byCat.map((c) => c[0]));
    const byCat = s.byCat.concat(Object.keys(limits).filter((c) => !seen.has(c)).map((c) => [c, 0]));
    if (!byCat.length) return '';
    const total = byCat.reduce((a, c) => a + c[1], 0) || 1;
    const keep = byCat.filter((c, i) => i < 5 || limits[c[0]]);
    const rest = byCat.filter((c) => !keep.includes(c)).reduce((a, c) => a + c[1], 0);
    const rows = keep.concat(rest > 0 ? [['__rest', rest]] : []);
    const max = Math.max(...rows.map((r) => r[1]), 1);
    const line = ([c, v]) => {
      const l = limits[c];
      const bar = l ? `<span class="meter thin limit ${l.level}" style="--c:${l.level === 'over' ? 'var(--danger)' : l.level === 'near' || l.level === 'fast' ? 'var(--warn)' : 'var(--c-daily)'}"><i style="width:${Math.min(100, l.ratio * 100).toFixed(1)}%"></i></span>` : `<span class="meter thin" data-mk="cat-${esc(c)}" style="--c:var(--c-daily)"><i style="width:${pct(v, max).toFixed(1)}%"></i></span>`;
      const label = esc(c === '__rest' ? t('cats.rest') : catLabel(c));
      const right = l ? `<span class="cat-pct num ${l.level === 'over' ? 'neg' : ''}">${l.left >= 0 ? t('limit.left', { amount: fmt(l.left, { bare: true }) }) : t('limit.over', { amount: fmt(-l.left, { bare: true }) })}</span>` : `<span class="cat-pct num">${Math.round((v / total) * 100)} %</span>`;
      const inner = `${tile(c === '__rest' ? 'autre' : c, 'daily')}<span class="cat-main"><span class="cat-top"><span>${label}</span><span class="num">${fmt(v)}${l ? `<small class="muted"> / ${fmt(l.limit, { bare: true })}</small>` : ''}</span></span>${bar}</span>${right}`;
      return c === '__rest' ? `<li>${inner}</li>` : `<li><button class="cat-btn" data-action="limit" data-cat="${esc(c)}" aria-label="${esc(t('limit.set', { cat: catLabel(c) }))}">${inner}</button></li>`;
    };
    return `<section>
      <div class="section-head"><h2>${t('cats.title')}</h2><span class="sub">${t('cats.total', { amount: fmt(s.byCat.reduce((a, c) => a + c[1], 0)) })}</span></div>
      <div class="card"><ul class="cats">${rows.map(line).join('')}</ul><p class="hint" style="margin:8px 0 0">${t('limit.hint')}</p></div>
    </section>`;
  }
  // moyenne des trois derniers mois terminés pour une catégorie du quotidien
  function catAverage(cat) {
    const vals = [];
    for (let o = 1; o <= 3; o++) { const per = F.periodAt(doc(), o); const v = F.dailySeries(doc(), per, per.end).byCat.find((x) => x[0] === cat); if (F.live(doc().tx).some((x) => x.date >= per.start && x.date <= per.end)) vals.push(v ? v[1] : 0); }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
  function limitDialog(cat) {
    const cur = ((doc().settings.limits || {})[cat]) || '';
    const avg = catAverage(cat);
    openDialog(t('limit.title', { cat: catLabel(cat) }), `<div class="form">
      <label class="field">${t('limit.amount')}<input name="limit" inputmode="decimal" value="${esc(cur)}" placeholder="${avg ? esc(Math.round(avg)) : '0'}" autocomplete="off"></label>
      <p class="hint">${avg ? t('limit.avg', { amount: fmt(avg) }) + ' ' : ''}${t('limit.dialogHint')}</p></div>`,
    `${cur ? `<button class="btn danger" value="delete">${t('limit.remove')}</button>` : ''}<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      const lim = { ...(doc().settings.limits || {}) };
      const v = F.parseAmount(fd.get('limit'));
      if (action === 'delete' || !(v > 0)) delete lim[cat]; else lim[cat] = Math.round(v * 100) / 100;
      setting({ limits: lim });
    });
  }

  // ---------- prévision du solde jusqu'au prochain salaire ----------
  function forecastHtml() {
    const fc = F.forecast(doc());
    if (fc.points.length < 2) return '';
    const W = 320, H = 92, pad = 6;
    const vals = fc.points.map((x) => x.balance).concat([fc.start, 0]);
    const max = Math.max(...vals), min = Math.min(...vals), span = max - min || 1;
    const X = (i) => pad + (i / (fc.points.length - 1)) * (W - pad * 2);
    const Y = (v) => pad + ((max - v) / span) * (H - pad * 2);
    const line = fc.points.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x.balance).toFixed(1)}`).join(' ');
    const lowI = fc.points.findIndex((x) => x.date === fc.low.date);
    const neg = !!fc.firstNegative;
    const src = t(fc.fromAccounts ? 'fc.srcAccount' : 'fc.srcLeft');
    const tip = (x) => `${ds(x.date)} · ${fmt(x.balance)}${x.events.length ? '<br>' + x.events.map((e) => `${esc(e.label)} ${fmt(e.amount)}`).join('<br>') : ''}`;
    const dots = fc.points.map((x, i) => (x.events.length ? `<circle class="ev" cx="${X(i).toFixed(1)}" cy="${Y(x.balance).toFixed(1)}" r="3.2"/>` : '')).join('');
    const hits = fc.points.map((x, i) => `<rect x="${(X(i) - (W - pad * 2) / fc.points.length / 2).toFixed(1)}" y="0" width="${((W - pad * 2) / fc.points.length).toFixed(1)}" height="${H}" fill="transparent" data-tip="${esc(tip(x))}"/>`).join('');
    const next = fc.events.filter((e) => !e.undated).slice(0, 3);
    return `<section>
      <div class="section-head"><h2>${t('fc.title')}</h2><span class="sub">${t('fc.until', { date: esc(ds(fc.until)) })}</span></div>
      <div class="card forecast ${neg ? 'is-neg' : ''}">
        <div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(t('fc.aria', { low: fmt(fc.low.balance), date: ds(fc.low.date) }))}">
          <line class="zero" x1="${pad}" x2="${W - pad}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}"/>
          <path class="area" d="${line} L${X(fc.points.length - 1).toFixed(1)} ${Y(Math.max(min, Math.min(0, max))).toFixed(1)} L${X(0).toFixed(1)} ${Y(Math.max(min, Math.min(0, max))).toFixed(1)} Z"/>
          <path class="line" d="${line}"/>${dots}
          <circle class="low" cx="${X(lowI).toFixed(1)}" cy="${Y(fc.low.balance).toFixed(1)}" r="4.5"/>${hits}
        </svg></div>
        ${neg ? `<p class="note danger">${t('fc.negative', { date: esc(ds(fc.firstNegative.date)), src, amount: fmt(fc.firstNegative.balance), cause: esc(fc.firstNegative.cause || t('fc.daily')) })} ${fc.cutPerDay < fc.perDay * 0.7 ? t('fc.advice', { cut: fmt(fc.cutPerDay) }) : t('fc.adviceShort', { amount: fmt(-fc.low.balance) })}</p>`
          : `<p class="small" style="margin:6px 0 0">${t('fc.ok', { low: `<b class="num">${fmt(fc.low.balance)}</b>`, date: esc(ds(fc.low.date)), end: `<b class="num">${fmt(fc.end)}</b>` })}</p>`}
        <p class="hint" style="margin:4px 0 0">${t('fc.how', { src, perDay: fmt(fc.perDay) })}${fc.fromAccounts ? ` <button class="link" data-action="tab" data-tab="settings">${t('fc.balance', { amount: fmt(fc.start) })}</button>` : ''}</p>
        ${next.length ? `<ul class="fc-events">${next.map((e) => `<li><span>${esc(ds(e.date))}</span><span>${esc(e.label)}</span><b class="num">${fmt(e.amount)}</b></li>`).join('')}</ul>` : ''}
      </div>
    </section>`;
  }

  // ---------- factures QR suisses ----------
  let jsqrLoading = null;
  const loadJsQR = () => jsqrLoading || (jsqrLoading = new Promise((ok, ko) => {
    if (window.jsQR) return ok(window.jsQR);
    const sc = document.createElement('script');
    sc.src = 'js/vendor/jsQR.js'; sc.onload = () => ok(window.jsQR); sc.onerror = () => { jsqrLoading = null; ko(new Error('jsqr')); };
    document.head.appendChild(sc);
  }));
  function decodeImage(src, jsQR) {
    const max = 1400, c = document.createElement('canvas');
    const k = Math.min(1, max / Math.max(src.width || src.videoWidth, src.height || src.videoHeight));
    c.width = Math.round((src.width || src.videoWidth) * k); c.height = Math.round((src.height || src.videoHeight) * k);
    if (!c.width || !c.height) return null;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, c.width, c.height);
    const img = g.getImageData(0, 0, c.width, c.height);
    const r = jsQR(img.data, c.width, c.height, { inversionAttempts: 'attemptBoth' });
    return r ? r.data : null;
  }
  function scanDialog() {
    let stream = null, raf = 0, done = false;
    const stop = () => { done = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((tr) => tr.stop()); stream = null; };
    openDialog(t('qr.title'), `<div class="form scan">
      <div class="scan-view" id="scanView"><video id="scanVideo" playsinline muted></video><span class="scan-frame" aria-hidden="true"></span><p class="scan-msg" id="scanMsg">${t('qr.starting')}</p></div>
      <label class="btn block file-btn">${svg('qr')}<span>${t('qr.photo')}</span><input type="file" accept="image/*" id="scanFile" hidden></label>
      <p class="hint">${t('qr.hint')}</p></div>`,
    `<button class="btn" value="close" type="button" data-close>${t('dlg.close')}</button>`, () => {});
    dlg.addEventListener('close', stop, { once: true });
    const msg = (k, cls) => { const m = $('#scanMsg'); if (m) { m.textContent = t(k); m.className = 'scan-msg ' + (cls || ''); } };
    const found = (text) => {
      const bill = F.parseQrBill(text);
      if (!bill.ok) { msg('qr.err.' + bill.error, 'err'); return false; }
      stop(); dlg.close();
      const pl = F.billToPlanned(doc(), bill);
      if (pl.dup) { toast(t('qr.dup', { label: pl.dup.label })); plannedDialog(pl.dup); return true; }
      plannedDialog({ label: pl.label, amount: pl.amount || '', cat: pl.cat, month: pl.month, qr: pl.qr });
      return true;
    };
    loadJsQR().then((jsQR) => {
      $('#scanFile').addEventListener('change', (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const im = new Image();
        im.onload = () => { const r = decodeImage(im, jsQR); URL.revokeObjectURL(im.src); if (!r) msg('qr.notFound', 'err'); else found(r); };
        im.onerror = () => msg('qr.notFound', 'err');
        im.src = URL.createObjectURL(file);
      });
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg('qr.noCamera'); $('#scanView').classList.add('off'); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false }).then((st) => {
        if (done) { st.getTracks().forEach((tr) => tr.stop()); return; }
        stream = st;
        const v = $('#scanVideo'); v.srcObject = st; v.play().catch(() => {});
        msg('qr.aim');
        let last = 0;
        const tick = (ts) => {
          if (done) return;
          if (ts - last > 180 && v.readyState >= 2) { last = ts; const r = decodeImage(v, jsQR); if (r && found(r)) return; }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }).catch(() => { msg('qr.noCamera'); $('#scanView').classList.add('off'); });
    }).catch(() => msg('qr.loadErr', 'err'));
  }

  // ---------- dossier pour la déclaration d'impôts ----------
  const dossierYear = () => { const n = new Date(); return n.getMonth() < 6 ? n.getFullYear() - 1 : n.getFullYear(); };
  const DOSSIER_ITEMS = ['p3a', 'childcare', 'alimony', 'health', 'donations', 'training', 'interest'];
  function dossierBody(r) {
    const it = r.items;
    const line = (k) => {
      const x = it[k];
      if (!x.total && k !== 'p3a') return '';
      const note = k === 'p3a' ? t('dos.p3aNote', { max: fmt(x.max) }) : k === 'health' ? t('dos.healthNote', { threshold: fmt(x.threshold), deductible: fmt(x.deductible) }) : k === 'donations' ? t('dos.donNote', { deductible: fmt(x.deductible) }) : t('dos.n', { n: x.list.length });
      return row(k === 'p3a' ? 'invest' : 'fixed', t('dos.' + k), fmt(x.total), note);
    };
    const any = DOSSIER_ITEMS.some((k) => it[k].total);
    return `<div class="flow">
      ${r.income.total <= 0 ? '' : row('income', t('dos.income'), fmt(r.income.total), t('dos.incomeNote', { n: r.income.salaries, bonus: r.income.bonus ? ' · ' + t('dos.bonus', { amount: fmt(r.income.bonus) }) : '' }))}
      ${DOSSIER_ITEMS.map(line).join('')}
    </div>${any ? '' : `<p class="hint">${t('dos.empty')}</p>`}<p class="hint" style="margin-top:8px">${t('dos.hint')}</p>`;
  }
  function dossierDialog(year) {
    const y = year || dossierYear();
    const r = F.taxDossier(doc(), y);
    const years = [new Date().getFullYear() - 1, new Date().getFullYear()];
    openDialog(t('dos.title', { year: y }), `<div class="form">
      <div class="seg kind">${years.map((yy) => `<label><input type="radio" name="year" value="${yy}" ${yy === y ? 'checked' : ''} data-dossier-year>${yy}</label>`).join('')}</div>
      ${dossierBody(r)}</div>`,
    `<button class="btn" value="csv">${t('dos.csv')}</button><button class="btn primary" value="print">${t('dos.print')}</button>`,
    (action) => {
      if (action === 'csv') { download(`franko-impots-${y}.csv`, dossierCsv(r), 'text/csv;charset=utf-8'); return true; }
      if (action === 'print') { printDossier(r); return true; }
    });
  }
  function dossierCsv(r) {
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['Rubrique', 'Date', 'Libellé', 'Montant CHF'].map(q).join(';')];
    for (const k of DOSSIER_ITEMS) for (const x of r.items[k].list) rows.push([t('dos.' + k), x.date, x.label, x.amount.toFixed(2)].map(q).join(';'));
    return '\ufeff' + rows.join('\r\n');
  }
  function printDossier(r) {
    const d = doc(), s0 = d.settings;
    const sec = (k) => {
      const x = r.items[k];
      if (!x.list.length) return '';
      const extra = k === 'health' ? `<p>${esc(t('dos.healthNote', { threshold: fmt(x.threshold), deductible: fmt(x.deductible) }))}</p>` : k === 'donations' ? `<p>${esc(t('dos.donNote', { deductible: fmt(x.deductible) }))}</p>` : k === 'p3a' ? `<p>${esc(t('dos.p3aNote', { max: fmt(x.max) }))}</p>` : '';
      return `<h2>${esc(t('dos.' + k))} <span>${esc(fmt(x.total))}</span></h2>${extra}<table><thead><tr><th>${esc(t('txd.date'))}</th><th>${esc(t('txd.label'))}</th><th class="n">CHF</th></tr></thead><tbody>${x.list.map((y) => `<tr><td>${esc(ds(y.date))}</td><td>${esc(y.label)}</td><td class="n">${esc(fmt(y.amount, { bare: true }))}</td></tr>`).join('')}</tbody></table>`;
    };
    const html = `<!doctype html><html lang="${esc(I.lang)}"><head><meta charset="utf-8"><title>${esc(t('dos.title', { year: r.year }))}</title><style>
      body{font:13px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#14211f;margin:28px;max-width:760px}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:22px 0 6px;display:flex;justify-content:space-between;border-bottom:1.5px solid #14211f;padding-bottom:3px}
      .meta{color:#5b6b68;margin:0 0 14px}table{width:100%;border-collapse:collapse}td,th{padding:4px 6px;border-bottom:1px solid #e3e8e6;text-align:left}th{font-size:11px;text-transform:uppercase;color:#5b6b68}.n{text-align:right;font-variant-numeric:tabular-nums}
      .sum td{font-weight:700}p{margin:4px 0;color:#3c4a47}.foot{margin-top:28px;font-size:11px;color:#5b6b68}@media print{body{margin:12mm}button{display:none}}</style></head><body>
      <button onclick="print()" style="float:right;padding:8px 14px;border-radius:8px;border:1px solid #0d5c57;background:#0d5c57;color:#fff;font-weight:600">${esc(t('dos.print'))}</button>
      <h1>${esc(t('dos.title', { year: r.year }))}</h1><p class="meta">${esc(t('dos.meta', { canton: s0.canton || 'FR', date: ds(F.today()) }))}</p>
      <table><tbody><tr class="sum"><td>${esc(t('dos.income'))}</td><td class="n">${esc(fmt(r.income.total))}</td></tr>
      ${DOSSIER_ITEMS.filter((k) => r.items[k].total).map((k) => `<tr><td>${esc(t('dos.' + k))}</td><td class="n">${esc(fmt(r.items[k].total))}</td></tr>`).join('')}</tbody></table>
      ${DOSSIER_ITEMS.map(sec).join('')}<p class="foot">${esc(t('dos.hint'))}</p></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { download(`franko-impots-${r.year}.html`, html, 'text/html;charset=utf-8'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  function dossierCard() {
    if (!doc().settings.salary) return '';
    const y = dossierYear(), r = F.taxDossier(doc(), y);
    const total = DOSSIER_ITEMS.reduce((a, k) => a + (k === 'health' ? r.items.health.deductible : k === 'donations' ? r.items.donations.deductible : r.items[k].total), 0);
    return `<section>
      <div class="section-head"><h2>${t('dos.cardTitle')}</h2>${S.isPro() ? '' : `<span class="pill beta">Pro</span>`}</div>
      <button class="tax-card" data-action="dossier">${tile('impots', 'fixed')}
        <span class="main"><span class="eyebrow">${t('dos.cardEyebrow', { year: y })}</span><span class="big">${bigAmount(total)}</span>
        <span class="small muted">${t('dos.cardText')}</span></span>
      </button>
    </section>`;
  }

  // 13e salaire, prime : proposer d'en mettre une part de côté avant qu'elle ne fonde dans le quotidien
  function bonusPlan(st) {
    const d = doc();
    const r = T.estimate(taxInput(taxCfg()));
    const taxGap = Math.max(0, Math.round(r.total - taxCharges().reduce((s2, c) => s2 + F.monthlyOf(c), 0) * 12));
    const cur = st.month;
    const yearlyGap = F.live(d.fixed).filter((c) => F.isYearly(c) && F.chargeEnv(c) === 'fixed').reduce((s2, c) => {
      const due = cur.slice(0, 4) + '-' + String(c.dueMonth).padStart(2, '0');
      const target = due >= cur ? due : (+cur.slice(0, 4) + 1) + '-' + String(c.dueMonth).padStart(2, '0');
      return s2 + Math.max(0, (+c.amount || 0) - F.yearlyCovered(c, target));
    }, 0);
    const fundGap = Math.max(0, st.plan.emergency.target - st.plan.emergency.fund);
    const lines = [];
    // jamais tout : une part reste libre, sinon le conseil n'est pas suivi
    let left = Math.round(st.flow.bonus * 0.8);
    const take = (key, need) => { const v = Math.round(Math.min(left, need)); if (v >= 20) { lines.push([key, v]); left -= v; } };
    take('tax', taxGap); take('yearly', yearlyGap); take('fund', fundGap);
    if (!lines.length) take('save', st.flow.bonus / 2);
    const total = lines.reduce((s2, l) => s2 + l[1], 0);
    return { lines, total, free: Math.round(st.flow.bonus - total) };
  }
  function bonusHtml(st) {
    const f = st.flow;
    if (!(f.bonus >= 300)) return '';
    const b = bonusPlan(st);
    const done = f.bonusSaved >= b.total - 1;
    return `<section class="card bonus">
      <div class="hero-top"><span class="eyebrow">${t('bonus.eyebrow')}</span><span class="pill ${done ? 'ok' : 'warn'}">${done ? t('bonus.done') : t('bonus.todo')}</span></div>
      <h2>${t('bonus.title', { amount: fmt(f.bonus) })}</h2>
      <p class="small muted">${t('bonus.text')}</p>
      <div class="flow">${b.lines.map(([k, v]) => row(k === 'tax' || k === 'yearly' ? 'fixed' : 'savings', t('bonus.' + k), fmt(v))).join('')}${row('', t('bonus.free'), fmt(b.free), '', 'sum')}</div>
      ${done ? `<p class="small" style="margin:8px 0 0">${t('bonus.saved', { amount: fmt(f.bonusSaved) })}</p>` : `<button class="btn primary block" data-action="bonus-save" data-amount="${b.total - Math.min(b.total, f.bonusSaved)}">${t('bonus.cta', { amount: fmt(b.total - Math.min(b.total, f.bonusSaved)) })}</button>`}
    </section>`;
  }

  // ---------- objectifs d'épargne ----------
  function goalsHtml() {
    const gs = F.goalsState(doc());
    const need = gs.filter((g) => !g.done).reduce((s2, g) => s2 + g.perMonth, 0);
    return `<section>
      <div class="section-head"><h2>${t('goal.title')}</h2><button class="link" data-action="new-goal">${t('fixed.add')}</button></div>
      <div class="card">
        ${gs.length ? `<p class="small muted" style="margin:0 0 6px">${t('goal.need', { amount: `<b class="num" style="color:var(--ink)">${fmt(need)}</b>` })}</p><ul class="list wrapmeta">${gs.map((g) => `<li>
          <button class="row" data-action="edit-goal" data-id="${esc(g.goal.id)}">${tile('epargne', 'savings')}<span class="main"><span class="title">${esc(g.goal.label)}</span>
          <span class="meta"><b class="num">${fmt(g.saved)}</b> / ${fmt(g.goal.target)}${g.goal.month ? ' · ' + esc(mLong.format(asDate(g.goal.month))) : ''} · ${g.done ? t('goal.reached') : g.late ? t('goal.late', { amount: fmt(g.left) }) : t('goal.perMonth', { amount: fmt(g.perMonth) })}</span>
          <span class="meter thin" style="--c:var(--savings)"><i style="width:${(g.pct * 100).toFixed(1)}%"></i></span></span></button>
          <button class="state" data-action="goal-add" data-id="${esc(g.goal.id)}"><span>${t('goal.add')}</span></button></li>`).join('')}</ul>`
        : `<p class="small muted" style="margin:0 0 10px">${t('goal.empty')}</p><div class="chips wrap">${t('goal.items').split('|').map((x) => `<button class="chip" data-action="new-goal" data-label="${esc(x)}">+ ${esc(x)}</button>`).join('')}</div>`}
      </div>
    </section>`;
  }
  function goalDialog(g) {
    const d = doc(), isNew = !g.id;
    const cur = F.monthState(d).month;
    openDialog(isNew ? t('goal.new') : t('goal.edit'), `<div class="form">
      <label class="field">${t('goal.label')}<input name="label" value="${esc(g.label || '')}" placeholder="${esc(t('goal.labelPh'))}" autocomplete="off"></label>
      <div class="grid2"><label class="field">${t('goal.target')}<input name="target" inputmode="decimal" value="${esc(g.target || '')}" placeholder="3000" autocomplete="off"></label>
      <label class="field">${t('goal.month')}<input name="month" type="month" min="${esc(cur)}" value="${esc(g.month || F.addMonths(cur + '-01', 6).slice(0, 7))}"></label></div>
      <p class="hint">${t('goal.hint')}</p></div>`,
    `${isNew ? '' : `<button class="btn danger" value="delete">${t('dlg.delete')}</button>`}<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      const now = Date.now();
      if (action === 'delete') { Object.assign(g, { deleted: true, updatedAt: now }); save(); toast(t('goal.deleted')); return; }
      const label = String(fd.get('label') || '').trim(), target = F.parseAmount(fd.get('target'));
      if (!label || !(target > 0)) { toast(t('fixedd.err')); return true; }
      const data = { label, target, month: fd.get('month') || null, updatedAt: now };
      d.goals = d.goals || [];
      if (isNew) d.goals.push({ id: F.uid(), ...data }); else Object.assign(g, data);
      save(); toast(t('goal.saved', { label }));
    });
  }
  function goalAddDialog(g) {
    const st = F.goalsState(doc()).find((x) => x.goal.id === g.id);
    openDialog(g.label, `<div class="form">
      <div class="seg kind"><label class="k-inc"><input type="radio" name="dir" value="in" checked>${t('goal.put')}</label><label class="k-exp"><input type="radio" name="dir" value="out">${t('goal.take')}</label></div>
      <label class="amount-field"><span class="sr">${t('txd.amount')}</span><span class="cur">CHF</span><input name="amount" inputmode="decimal" placeholder="0.00" value="${st && st.perMonth ? esc(st.perMonth.toFixed(2)) : ''}" autocomplete="off" aria-label="${esc(t('txd.amount'))}"></label>
      <p class="hint">${t('goal.addHint')}</p></div>`,
    `<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      const amt = Math.abs(F.parseAmount(fd.get('amount')));
      if (!(amt > 0)) { toast(t('txd.amountErr')); return true; }
      const out = fd.get('dir') === 'out';
      // un retrait revient sur le compte : ce n'est pas un revenu, donc noté comme virement
      F.addTx(doc(), { date: F.today(), amount: out ? amt : -amt, label: g.label, cat: 'epargne', env: 'savings', goalId: g.id, transfer: out, accountId: doc().settings.defaultAccount || null, source: 'manual' });
      save(); toast(t(out ? 'goal.taken' : 'goal.put2', { amount: fmt(amt), label: g.label }));
    });
  }

  // ---------- bilan sur douze mois ----------
  function reviewHtml() {
    const r = F.yearReview(doc());
    if (!r) return '';
    return `<section>
      <div class="section-head"><h2>${t('review.title')}</h2><span class="sub">${t('review.sub', { n: r.months })}</span></div>
      <div class="card review">
        <div class="hero-top"><span class="eyebrow">${t('review.rate')}</span><span class="pill ${r.rate >= 10 ? 'ok' : r.rate >= 0 ? 'warn' : 'danger'}">${r.rate >= 20 ? t('review.good') : r.rate >= 10 ? t('review.ok') : t('review.low')}</span></div>
        <div class="big ${r.rate < 0 ? 'neg' : ''}"><span class="num">${r.rate.toLocaleString(I.locale)}</span><span class="cur">%</span></div>
        <p class="sub">${t('review.rateText', { kept: fmt(r.perMonth.kept), income: fmt(r.perMonth.income) })}</p>
        <div class="flow">
          ${row('income', t('review.income'), fmt(r.income), t('review.perMonth', { amount: fmt(r.perMonth.income) }))}
          ${row('fixed', t('review.fixed'), fmt(-r.fixed))}
          ${row('daily', t('review.daily'), fmt(-r.daily))}
          ${row('savings', t('review.kept'), fmt(r.kept), t('review.keptNote', { saved: fmt(r.savings + r.invest) }), 'sum')}
        </div>
        ${r.cats.length ? `<div class="group-label">${t('review.cats')}</div><ul class="cats">${r.cats.map((c) => `<li>${tile(c.cat, 'daily')}<span class="cat-main"><span class="cat-top"><span>${esc(catLabel(c.cat))}</span><span class="num">${fmt(c.perMonth)}<small class="muted"> ${t('review.mo')}</small></span></span><span class="meter thin" style="--c:var(--c-daily)"><i style="width:${pct(c.total, r.cats[0].total).toFixed(1)}%"></i></span></span><span class="cat-pct num">${fmt(c.total, { bare: true })}</span></li>`).join('')}</ul>` : ''}
        ${r.months >= 2 && r.best.offset !== r.worst.offset ? `<p class="hint" style="margin-top:10px">${t('review.bestWorst', { best: esc(mLong.format(asDate(r.best.start))), bestNet: fmt(r.best.net, { sign: true }), worst: esc(mLong.format(asDate(r.worst.start))), worstNet: fmt(r.worst.net, { sign: true }) })}</p>` : ''}
      </div>
    </section>`;
  }

  // Calcul du mois, ligne par ligne ; la pastille de chaque ligne correspond au segment de la barre.
  function calcHtml(st) {
    const f = st.flow, p = st.plan;
    const fx = st.fixed.filter((x) => x.kind === 'fixed');
    const paid = fx.filter((x) => x.paid).length;
    const since = f.salaryDate ? ds(f.salaryDate) : '';
    const alloc = (k, label, who, what) => {
      const a = f[k];
      if (a.contract && a.pending) return row(k, label, `<span class="soft">${fmt(a.planned)}</span>`, `${who ? who + ' · ' : ''}${t('calc.contractPending')}`, 'pending');
      if (a.contract) return row(k, label, fmt(-a.deducted), `${who ? who + ' · ' : ''}${t('calc.paid')}`);
      if (a.done || a.deducted > 0) return row(k, label, fmt(-a.deducted), t('calc.counted'));
      if (!a.planned) return row(k, label, fmt(0), t('calc.nothing'), 'pending');
      return row(k, label, `<span class="soft">${fmt(a.planned)}</span>`, t('calc.proposed', { what }), 'pending');
    };
    const invWho = p.investFixed ? esc(st.fixed.filter((x) => x.kind === 'invest').map((x) => x.charge.label).join(', ')) : '';
    const inTotal = Math.max(0, f.salaryIn + f.otherIncome);
    const parts = [['fixed', f.fixedPaid, ''], ['fixed', f.pending, 'due'], ['invest', f.invest.deducted, ''], ['savings', f.savings.deducted, ''], ['daily', f.spentDaily, '']];
    const usedSum = parts.reduce((s, x) => s + Math.max(0, x[1]), 0);
    const base = Math.max(inTotal, usedSum) || 1;
    const bar = parts.filter((x) => x[1] > 0).map(([k, v, c]) => `<i class="${c}" style="flex:0 0 ${((v / base) * 100).toFixed(2)}%;background:var(--${k})"></i>`).join('') + (usedSum > inTotal ? '<i style="flex:1;background:var(--danger)"></i>' : '');
    const pendingNames = st.fixed.filter((x) => !x.paid && (x.kind === 'fixed' || (f[x.kind] && f[x.kind].pending))).map((x) => x.charge.label).join(', ');
    return `<section>
      <div class="section-head"><h2>${t('calc.title')} · <span class="cap">${esc(mLong.format(asDate(st.period.start)))}</span></h2><span class="sub">${since ? t('calc.since', { date: esc(since) }) : t('calc.salaryFromSettings')}</span></div>
      <div class="card calc">
        <div class="stack" role="img" aria-label="${esc(t('calc.title'))}">${bar}</div>
        <div class="flow">
          ${row('income', f.salaryDate ? t('calc.salary') : t('calc.salaryPlanned'), fmt(f.salaryIn), f.salaryDate ? `${esc(f.salaryLabel)} · ${esc(since)}` : t('calc.salaryFromSettings'))}
          ${f.otherIncome ? row('income', t('calc.other'), fmt(f.otherIncome), t('calc.otherNote')) : ''}
          ${row('fixed', t('calc.fixedPaid'), fmt(-f.fixedPaid), fx.length ? t('calc.fixedNote', { paid, total: fx.length }) + (f.fixedPending ? ' · ' + t('calc.fixedNotPaid', { amount: fmt(f.fixedPending) }) : '') : t('calc.estimate'))}
          ${f.provision ? row('fixed', t('calc.provision'), fmt(-f.provision), t('calc.provisionNote')) : ''}
          ${row('', t('calc.afterFixed'), fmt(f.after), '', 'sum')}
          ${alloc('invest', t('calc.invest'), invWho, t('checks.invest'))}
          ${alloc('savings', t('calc.savings'), '', t('checks.savings'))}
          ${row('', t('calc.forDaily'), fmt(f.forDaily), '', 'sum')}
          ${row('daily', t('calc.spentDaily'), fmt(-f.spentDaily), since ? t('calc.since', { date: esc(since) }) : '')}
          ${row('', t('calc.availableNow'), `<span class="${f.left < 0 ? 'neg' : ''}">${fmt(f.left)}</span>`, '', 'total')}
          ${f.pending >= 1 ? row('fixed', t('calc.notPaid'), fmt(-f.pending), esc(pendingNames), 'pending') + row('', t('calc.afterAll'), `<span class="${f.leftAfterAll < 0 ? 'neg' : ''}">${fmt(f.leftAfterAll)}</span>`, '', 'sum') : ''}
        </div>
      </div>
    </section>`;
  }

  function paidBtn(x, c) {
    return !x.paidMark || x.bankConfirmed
      ? stateBtn(true, '', t('state.paid'), `data-action="edit-tx" data-id="${esc(x.id)}"`)
      : stateBtn(true, '', t('state.paid'), `data-action="unpay-fixed" data-id="${esc(x.id)}" aria-label="${esc(t('fixed.unmark', { label: c.label }))}"`);
  }
  function checksHtml(st) {
    const f = st.flow;
    const contractRow = (k) => {
      const list = st.fixed.filter((x) => x.kind === k);
      const paid = list.filter((x) => x.paid);
      const todo = list.find((x) => !x.paid);
      const names = list.map((x) => x.charge.label).join(', ');
      return {
        detail: !todo && paid.length ? `${names} · ${t('checks.paidOn', { date: ds(paid[0].paid.date) })}` : `${names} · ${t('checks.contractNote')}`,
        btn: todo ? stateBtn(false, t('state.pay'), '', `data-action="pay-fixed" data-id="${esc(todo.charge.id)}" aria-label="${esc(t('fixed.markPaid', { label: todo.charge.label }))}"`) : paidBtn(paid[0].paid, paid[0].charge),
        done: !todo,
      };
    };
    const items = [
      { k: 'invest', icon: 'invest', title: f.invest.contract ? t('checks.investContract') : t('checks.invest'), amount: f.invest.contract ? Math.max(f.invest.planned, f.invest.deducted) : f.invest.planned, detail: '' },
      { k: 'savings', icon: 'epargne', title: f.savings.contract ? t('checks.savingsContract') : t('checks.savings'), amount: f.savings.contract ? Math.max(f.savings.planned, f.savings.deducted) : f.savings.planned, detail: f.savings.planned > 0 ? t('checks.savingsNote') : t('checks.savingsNone') },
      { k: 'daily', icon: 'wallet', title: t('checks.daily'), amount: Math.max(0, f.dailyBudget), detail: t('checks.dailyNote') },
    ];
    let done = 0;
    const rows = items.map((i) => {
      const c = st.checks[i.k];
      let btn, detail = i.detail;
      if (c.contract) { const r = contractRow(i.k); btn = r.btn; detail = r.detail; if (r.done) done++; }
      else if (c.auto) { btn = `<span class="state done"><span class="box">${CHECK}</span>${t('state.paid')}</span>`; done++; }
      else { btn = stateBtn(c.done, t('state.todo'), t('state.done'), `data-action="toggle-check" data-k="${i.k}"`); if (c.done) done++; }
      return `<li>${tile(i.icon, i.k)}<span class="main"><span class="title">${esc(i.title)}</span><span class="meta"><span class="num">${fmt(i.amount)}</span>${detail ? ' · ' + esc(detail) : ''}</span></span>${btn}</li>`;
    }).join('');
    return `<section><div class="section-head"><h2>${t('checks.title')}</h2><span class="sub">${t('checks.done', { n: done })}</span></div><div class="card flush"><ul class="list">${rows}</ul></div></section>`;
  }

  function fixedSection(st) {
    const fx = st.fixed.filter((f) => f.kind === 'fixed');
    if (!fx.length) {
      return `<section class="card form"><h2>${t('fixed.title')}</h2><p class="hint">${t('fixed.empty')}</p><button class="btn primary block" data-action="new-fixed">${t('fixed.add')}</button></section>`;
    }
    const todo = fx.filter((f) => !f.paid), done = fx.filter((f) => f.paid);
    const total = fx.reduce((s, f) => s + Math.max(+f.charge.amount || 0, f.paid ? -f.paid.amount : 0), 0);
    const due = st.flow.fixedPending;
    const line = (f0) => {
      const { charge: c, paid: x } = f0;
      const left = (+c.amount || 0) - (f0.partial || 0);
      const when = f0.yearly && !x ? (f0.short > 0 ? t('fixed.yearlyShort', { covered: fmt(f0.covered), short: fmt(f0.short) }) : t('fixed.yearlyCovered')) : x ? t('fixed.paidOn', { date: ds(x.date) }) : f0.planned ? `${t('fixed.plannedTag')} · ${catLabel(c.cat)}` : f0.partial ? t('fixed.partial', { amount: fmt(c.amount, { bare: true }) }) : c.day ? t('fixed.dueOn', { date: ds(F.dueDate(st.period, c.day)) }) : catLabel(c.cat);
      return `<li>
        <button class="row" data-action="${f0.planned ? 'edit-planned' : 'edit-fixed'}" data-id="${esc(c.id)}">
          ${tile(c.cat, 'fixed')}
          <span class="main"><span class="title">${esc(c.label)}</span><span class="meta"><b class="num">${fmt(x ? -x.amount : left)}</b> · ${esc(when)}</span>${f0.partial && !x ? `<span class="meter thin partial" style="--c:var(--fixed)"><i style="width:${pct(f0.partial, c.amount).toFixed(0)}%"></i></span>` : ''}</span>
        </button>
        ${x ? paidBtn(x, c) : stateBtn(false, t('state.pay'), '', `data-action="pay-fixed" data-id="${esc(c.id)}" aria-label="${esc(t('fixed.markPaid', { label: c.label }))}"`)}
      </li>`;
    };
    return `<section>
      <div class="section-head"><h2>${t('fixed.title')}</h2><button class="link" data-action="new-fixed">${t('fixed.add')}</button></div>
      <div class="card">
        <div class="hero-top" style="margin-bottom:8px"><span class="small">${t('fixed.paidCount', { paid: `<b>${done.length}</b>`, total: fx.length })}</span><span class="small muted">${due ? t('fixed.due', { amount: `<b class="num" style="color:var(--ink)">${fmt(due)}</b>` }) : t('fixed.allPaid')}</span></div>
        <div class="meter" data-mk="fixed" style="--c:var(--fixed)"><i style="width:${pct(total - due, total).toFixed(1)}%"></i></div>
        ${todo.length ? `<div class="group-label">${t('fixed.toPay')}</div><ul class="list">${todo.map(line).join('')}</ul>` : ''}
        ${done.length ? `<details class="paid"${todo.length ? '' : ' open'}><summary>${t('fixed.paidGroup', { n: done.length })} <span class="num" style="margin-left:auto">${fmt(done.reduce((s, f) => s - f.paid.amount, 0))}</span></summary><ul class="list">${done.map(line).join('')}</ul></details>` : ''}
      </div>
    </section>`;
  }

  // ---------- mois par mois ----------
  function historyHtml() {
    const all = F.history(doc(), 12);
    if (!all.length) return '';
    const h = S.isPro() ? all.slice(-6) : all.slice(-3);
    const max = Math.max(1, ...h.map((m) => Math.max(m.income, m.spent)));
    const HGT = 132;
    const px = (v) => Math.max(v > 0 ? 2 : 0, Math.round((v / max) * HGT));
    const cols = h.map((m) => {
      const fixedLike = m.fixed + m.invest + m.savings;
      const tip = `${ds(m.start)} – ${ds(m.end)} : ${t('hist.inc')} ${fmt(m.income)}, ${t('tx.out')} ${fmt(m.spent)}, ${t('tx.net')} ${fmt(m.net, { sign: true })}`;
      const rich = `<b>${esc(mLong.format(asDate(m.start)))}</b> · ${esc(ds(m.start))} – ${esc(ds(m.end))}<br><i style="background:var(--c-income)"></i>${t('hist.inc')} ${fmt(m.income)}<br><i style="background:var(--c-fixed)"></i>${t('hist.fixed')} ${fmt(fixedLike)}<br><i style="background:var(--c-daily)"></i>${t('hist.daily')} ${fmt(m.daily)}<br>${t('tx.net')} <b>${fmt(m.net, { sign: true })}</b>`;
      return `<button class="hcol${m.offset === ui.offset ? ' on' : ''}" data-action="goto-period" data-o="${m.offset}" data-tip="${esc(rich)}" aria-label="${esc(tip)}" aria-pressed="${m.offset === ui.offset}">
        <span class="hbars" style="height:${HGT}px"><span class="hbar inc" style="height:${px(m.income)}px"></span>
        <span class="hbar out">${fixedLike > 0 ? `<i style="height:${px(fixedLike)}px;background:var(--c-fixed)"></i>` : ''}${m.daily > 0 ? `<i style="height:${px(m.daily)}px;background:var(--c-daily)"></i>` : ''}</span></span>
        <span class="hlab">${esc(mShort.format(asDate(m.start)).replace('.', ''))}</span></button>`;
    }).join('');
    const rows = h.slice().reverse().map((m) => `<tr${m.offset === ui.offset ? ' class="on"' : ''}><th scope="row"><button class="link" data-action="goto-period" data-o="${m.offset}" title="${esc(ds(m.start))} – ${esc(ds(m.end))}">${esc(mLong.format(asDate(m.start)))}</button></th>
      <td class="num">${fmt(m.income, { bare: true })}</td><td class="num">${fmt(m.spent, { bare: true })}</td><td class="num ${m.net < 0 ? 'neg' : 'pos'}">${fmt(m.net, { bare: true, sign: true })}</td></tr>`).join('');
    return `<section>
      <div class="section-head"><h2>${t('hist.title')}</h2><span class="sub">${t('hist.sub')}</span></div>
      <div class="card hist">
        <div class="legend inline"><span style="--c:var(--c-income)">${t('hist.inc')}</span><span style="--c:var(--c-fixed)">${t('hist.fixed')}</span><span style="--c:var(--c-daily)">${t('hist.daily')}</span></div>
        <div class="hchart" role="group" aria-label="${esc(t('hist.title'))}">${cols}</div>
        <div class="htable"><table><thead><tr><th scope="col">${t('hist.month')}</th><th scope="col">${t('tx.in')}</th><th scope="col">${t('tx.out')}</th><th scope="col">${t('tx.net')}</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="hint">${t('hist.hint')}${!S.isPro() && all.length > 3 ? ' ' + t('hist.locked') : ''}</p>
      </div>
    </section>`;
  }

  // ---------- mois suivant ----------
  function goalGap(n) {
    const need = F.goalsState(doc()).filter((g) => !g.done).reduce((s2, g) => s2 + g.perMonth, 0);
    if (!need) return '';
    return `<p class="bank-line"><span>${need > n.savings + Math.max(0, n.daily) * 0.25 ? t('goal.gapShort', { need: `<b class="num">${fmt(need)}</b>`, savings: fmt(n.savings) }) : t('goal.gapOk', { need: `<b class="num">${fmt(need)}</b>`, savings: fmt(n.savings) })}</span></p>`;
  }
  function nextMonthHtml(st) {
    const n = F.nextMonth(doc());
    const fxCount = F.live(doc().fixed).filter((c) => +c.amount > 0 && F.chargeEnv(c) === 'fixed').length;
    const inv = F.live(doc().fixed).filter((c) => +c.amount > 0 && F.chargeEnv(c) === 'invest').map((c) => c.label).join(', ');
    return `<section>
      <div class="section-head"><h2 class="cap">${esc(mLong.format(asDate(n.start)))}</h2><span class="sub">${t('next.sub', { date: esc(ds(n.start)) })}</span></div>
      <div class="card calc"><div class="flow">
        ${row('income', t('next.salary'), fmt(n.salary), t('next.salaryNote'))}
        ${row('fixed', fxCount ? t('next.fixed') : t('next.fixedEst'), fmt(-n.fixed), !fxCount ? t('next.fixedEstNote') : t('next.fixedNote', { n: fxCount }) + (n.provision ? ' · ' + t('next.provisionNote', { amount: fmt(n.provision) }) : ''))}
        ${n.yearly.filter((y) => y.short > 0).map((y) => row('fixed', esc(y.charge.label), fmt(-y.short), t('next.yearlyShort', { amount: fmt(y.charge.amount), covered: fmt(y.covered) }))).join('')}
        ${n.invest ? row('invest', t('calc.invest'), fmt(-n.invest), esc(inv)) : ''}
        ${n.planned.map((x) => `<button class="flow-row" data-action="edit-planned" data-id="${esc(x.id)}"><span class="key" style="--c:var(--fixed)"></span><span>${esc(x.label)}<small>${x.qr ? t('qr.tag') + (x.qr.due ? ' · ' + t('qr.due', { date: esc(ds(x.qr.due)) }) : '') : t('next.plannedNote', { cat: esc(catLabel(x.cat)) })}</small></span><span class="num">${fmt(-x.amount)}</span></button>`).join('')}
        ${row('', t('next.after'), `<span class="${n.after < 0 ? 'neg' : ''}">${fmt(n.after)}</span>`, n.plannedSum ? t('next.afterNote', { amount: fmt(n.plannedSum) }) : '', 'sum')}
        ${row('savings', t('next.savings'), fmt(-n.savings), n.savings ? t('next.savingsNote') : t('next.savingsNone'))}
        ${row('', t('next.daily'), `<span class="${n.daily < 0 ? 'neg' : ''}">${fmt(n.daily)}</span>`, n.daily > 0 ? t('next.dailyNote', { amount: fmt(n.perDay), days: n.days }) : '', 'total')}
      </div>
      ${goalGap(n)}
      ${n.carry < 0 ? `<p class="bank-line"><span>${t('next.carry', { amount: `<b class="neg num">${fmt(n.carry)}</b>` })}</span></p>` : ''}
      ${fxCount ? '' : `<button class="btn primary block" data-action="new-fixed">${t('next.addFixed')}</button>`}
      <div class="row-btns"><button class="btn" data-action="new-planned" data-month="${esc(n.month)}">${t('next.add')}</button><button class="btn" data-action="scan-bill">${svg('qr')}${t('qr.scan')}</button></div>
      </div>
    </section>`;
  }

  const yearlyCat = (label) => { const c = label ? F.categorize(label, doc().settings.learned) : 'autre'; return c === 'autre' || F.envOf(c) === 'daily' && c !== 'transport' ? 'assurances' : c; };
  const monthName = (m) => mLong.format(new Date(2026, (+m || 1) - 1, 1));
  // Factures annuelles : ce qui est réservé chaque mois et quand chaque facture tombe.
  function yearlyHtml(st) {
    const list = F.live(doc().fixed).filter((c) => F.isYearly(c) && F.chargeEnv(c) === 'fixed' && +c.amount > 0).sort((a, b) => a.dueMonth - b.dueMonth);
    const chips = t('yearly.items').split('|').map((it) => { const [label, amount] = it.split(':'); return `<button class="chip" data-action="new-yearly" data-label="${esc(label)}" data-amount="${esc(amount || '')}">+ ${esc(label)}</button>`; }).join('');
    return `<section>
      <div class="section-head"><h2>${t('yearly.title')}</h2><button class="link" data-action="new-yearly">${t('fixed.add')}</button></div>
      <div class="card">
        <p class="small muted" style="margin:0 0 10px">${list.length ? t('yearly.text', { amount: `<b class="num" style="color:var(--ink)">${fmt(st.plan.provision)}</b>` }) : t('yearly.empty')}</p>
        ${list.length ? `<ul class="list wrapmeta">${list.map((c) => {
          const due = st.month.slice(0, 4) + '-' + String(c.dueMonth).padStart(2, '0');
          const target = due >= st.month ? due : (+st.month.slice(0, 4) + 1) + '-' + String(c.dueMonth).padStart(2, '0');
          const cov = F.yearlyCovered(c, target);
          return `<li><button class="row" data-action="edit-fixed" data-id="${esc(c.id)}">${tile(c.cat, 'fixed')}<span class="main"><span class="title">${esc(c.label)}</span><span class="meta"><b class="num">${fmt(c.amount)}</b> · ${esc(monthName(c.dueMonth))}${cov < c.amount ? ' · ' + t('yearly.short', { amount: fmt(c.amount - cov) }) : ''}</span></span><span class="num">${fmt(F.monthlyOf(c))}<small class="muted">${t('yearly.perMonth')}</small></span></button></li>`;
        }).join('')}</ul>` : ''}
        <div class="chips wrap" style="margin-top:10px">${chips}</div>
      </div>
    </section>`;
  }
  // 3e pilier A : versé cette année, reste jusqu'au plafond, économie d'impôt si on verse le reste.
  function pillarInfo() {
    const r = F.pillar3a(doc());
    const c = taxCfg(), base = taxInput(c);
    const already = r.paid + r.scheduled;
    const now = T.estimate({ ...base, pillar3a: already }), full = T.estimate({ ...base, pillar3a: r.max });
    return { ...r, saving: Math.max(0, Math.round(now.total - full.total)), savingAll: Math.max(0, Math.round(T.estimate({ ...base, pillar3a: 0 }).total - full.total)) };
  }
  function pillarHtml() {
    if (!doc().settings.salary) return '';
    const r = pillarInfo();
    const done = r.paid + r.scheduled;
    return `<section>
      <div class="section-head"><h2>${t('p3a.title', { year: r.year })}</h2><span class="sub">${r.daysLeft >= 0 ? t('p3a.deadline', { days: r.daysLeft }) : ''}</span></div>
      <div class="card">
        <div class="hero-top" style="margin-bottom:8px"><span class="small">${t('p3a.paid', { paid: `<b class="num">${fmt(r.paid)}</b>`, max: fmt(r.max) })}</span>${r.scheduled ? `<span class="small muted">${t('p3a.scheduled', { amount: fmt(r.scheduled) })}</span>` : ''}</div>
        <div class="meter" style="--c:var(--invest)"><i style="width:${pct(done, r.max).toFixed(1)}%"></i></div>
        <p class="small" style="margin:10px 0 0">${r.left > 0 ? t('p3a.left', { amount: `<b class="num">${fmt(r.left)}</b>`, saving: `<b class="num">${fmt(r.saving)}</b>` }) : t('p3a.full', { saving: `<b class="num">${fmt(r.savingAll)}</b>` })}</p>
        <p class="hint" style="margin:6px 0 10px">${t('p3a.hint')}</p>
        <button class="btn block" data-action="new-3a">${t('p3a.add')}</button>
      </div>
    </section>`;
  }
  // Pistes d'économie : échéances suisses, abonnements, catégories qui dépassent leur moyenne.
  function reminderText(r) {
    if (r.id === 'p3a') { const p = pillarInfo(); return p.left > 0 ? t('rem.p3a', { amount: fmt(p.left), saving: fmt(p.saving), days: r.days }) : ''; }
    return t('rem.' + r.id, { days: r.days });
  }
  function savingsHtml(st) {
    const d = doc();
    const rem = F.swissReminders().filter((r) => r.id !== 'p3a').map(reminderText).filter(Boolean);
    const subs = F.subscriptions(d);
    const over = F.overspend(d);
    if (!rem.length && !subs.length && !over.length) return '';
    const subTotal = subs.reduce((s, x) => s + x.yearly, 0);
    return `<section>
      <div class="section-head"><h2>${t('save.title')}</h2></div>
      <div class="card">
        ${rem.length ? `<div class="notes">${rem.map((x) => `<div class="note info">${esc(x)}</div>`).join('')}</div>` : ''}
        ${over.length ? `<div class="group-label">${t('save.over')}</div><ul class="list wrapmeta">${over.slice(0, 4).map((o) => `<li>${tile(o.cat, 'daily')}<span class="main"><span class="title">${esc(catLabel(o.cat))}</span><span class="meta">${t(o.whole ? 'save.overMonth' : 'save.overMeta', { spent: fmt(o.spent), usual: fmt(o.expected) })}</span></span><span class="num neg">+${fmt(o.over, { bare: true })}</span></li>`).join('')}</ul>` : ''}
        ${subs.length ? `<div class="group-label">${t('save.subs', { amount: fmt(subTotal) })}</div><ul class="list wrapmeta">${subs.slice(0, 6).map((x) => `<li>${tile(x.cat, 'daily')}<span class="main"><span class="title">${esc(x.label)}</span><span class="meta">${t('save.subMeta', { amount: fmt(x.monthly) })}</span></span><span class="num">${fmt(x.yearly)}<small class="muted">${t('save.perYear')}</small></span></li>`).join('')}</ul><p class="hint">${t('save.subsHint')}</p>` : ''}
      </div>
    </section>`;
  }

  // ---------- impôts ----------
  const TAX_DEFAULT = { status: 'single', children: 0, salaries: 12, other: 0, communeCoef: null, parishCoef: 0, pillar3a: null, alimony: null, childcare: null, cantonalOverride: 0 };
  const taxCfg = () => ({ ...TAX_DEFAULT, ...(doc().settings.tax || {}) });
  const fixedYear = (cat) => F.live(doc().fixed).filter((c) => c.cat === cat).reduce((s, c) => s + F.monthlyOf(c), 0) * 12;
  const p3aAuto = () => { const r = F.pillar3a(doc()); return r.paid + r.scheduled; };
  function taxInput(c) {
    return {
      salaryNet: (+doc().settings.salary || 0) * (+c.salaries || 12), other: +c.other || 0, status: c.status, children: +c.children || 0,
      alimony: c.alimony == null || c.alimony === '' ? fixedYear('pension') : +c.alimony,
      childcare: c.childcare == null || c.childcare === '' ? fixedYear('garde') : +c.childcare,
      pillar3a: c.pillar3a == null || c.pillar3a === '' ? p3aAuto() : +c.pillar3a, canton: doc().settings.canton || 'FR', communeCoef: c.communeCoef, parishCoef: +c.parishCoef || 0, cantonalOverride: +c.cantonalOverride || 0,
    };
  }
  const taxCharges = () => F.live(doc().fixed).filter((c) => c.cat === 'impots');
  function taxCard() {
    if (!doc().settings.salary) return '';
    const r = T.estimate(taxInput(taxCfg()));
    const planned = taxCharges().reduce((s, c) => s + F.monthlyOf(c), 0);
    return `<section>
      <div class="section-head"><h2>${t('tax.title', { year: new Date().getFullYear() })}</h2>${S.isPro() ? '' : `<span class="pill beta">Pro</span>`}</div>
      <button class="tax-card" data-action="tax">${tile('impots', 'fixed')}
        <span class="main"><span class="eyebrow">${t('tax.monthly')}</span><span class="big">${bigAmount(r.monthly)}</span>
        <span class="small muted">${t('tax.year', { amount: fmt(r.total) })} · ${esc(doc().settings.canton || 'FR')}${planned ? ' · ' + t('tax.yourCharge', { amount: fmt(planned) }) : ''}</span></span>
      </button>
    </section>`;
  }
  function taxBreakdown(c) {
    const r = T.estimate(taxInput(c));
    const l = (label, v, cls) => row('', label, v, '', cls);
    const dd = r.ded.canton || r.ded.ifd;
    let html = l(t('tax.income'), fmt(r.income));
    if (r.supported) {
      html += l(t('tax.dedPro'), fmt(-dd.pro)) + l(t('tax.dedIns'), fmt(-dd.insurance)) + (dd.alimony ? l(t('tax.dedAlimony'), fmt(-dd.alimony)) : '') + (dd.children ? l(t('tax.dedChildren'), fmt(-dd.children)) : '') + (dd.childcare ? l(t('tax.dedCare'), fmt(-dd.childcare)) : '') + (dd.pillar3a ? l(t('tax.dedP3a'), fmt(-dd.pillar3a)) : '');
      html += l(t('tax.taxable'), fmt(r.taxable), 'sum') + l(t('tax.base', { rate: r.rate.toFixed(2) }), fmt(r.base)) + l(t('tax.cantonal', { coef: r.coef }), fmt(r.cantonal)) + l(t('tax.communal', { coef: r.communeCoef }), fmt(r.communal)) + (r.parish ? l(t('tax.parishLine'), fmt(r.parish)) : '');
    } else html += l(t('tax.cantonalManual'), fmt(r.cantonal));
    html += l(t('tax.ifd'), fmt(r.ifd)) + l(t('tax.total'), fmt(r.total), 'sum') + l(t('tax.perMonth'), fmt(r.monthly), 'total');
    const note = [t('tax.noteExact'), r.supported ? t('tax.noteApprox') : t('tax.noteUnsupported'), t('tax.noteBordereau')].join(' ');
    return `<div class="flow">${html}</div><p class="hint" style="margin-top:8px">${note}</p>`;
  }
  function readTax(fd) {
    const n = (k) => { const x = String(fd.get(k) == null ? '' : fd.get(k)).trim(); return x === '' ? null : F.parseAmount(x) || 0; };
    return { status: fd.get('status'), children: n('children') || 0, salaries: +fd.get('salaries') || 12, other: n('other') || 0, alimony: n('alimony'), childcare: n('childcare'), communeCoef: n('communeCoef'), parishCoef: n('parishCoef') || 0, pillar3a: n('pillar3a'), cantonalOverride: n('cantonalOverride') || 0 };
  }
  function taxDialog() {
    const c = taxCfg(), canton = doc().settings.canton || 'FR', supported = !!T.CANTONS[canton];
    const v = (x) => (x == null || x === '' ? '' : esc(x));
    openDialog(t('tax.dialog'), `<div class="form" id="taxForm">
        <div class="grid2">
          <label class="field">${t('tax.status')}<select name="status">${['single', 'parent', 'married'].map((k) => `<option value="${k}" ${c.status === k ? 'selected' : ''}>${t('tax.' + k)}</option>`).join('')}</select></label>
          <label class="field">${t('tax.children')}<input name="children" type="number" min="0" max="9" value="${esc(c.children)}"></label>
        </div>
        <div class="grid2">
          <label class="field">${t('tax.salaries')}<select name="salaries"><option value="12" ${+c.salaries !== 13 ? 'selected' : ''}>12</option><option value="13" ${+c.salaries === 13 ? 'selected' : ''}>${t('tax.thirteenth')}</option></select></label>
          <label class="field">${t('tax.other')}<input name="other" inputmode="decimal" value="${v(c.other || '')}" placeholder="0"></label>
        </div>
        <div class="grid2">
          <label class="field">${t('tax.alimony')}<input name="alimony" inputmode="decimal" value="${v(c.alimony)}" placeholder="${fmt(fixedYear('pension'), { bare: true })}"></label>
          <label class="field">${t('tax.childcare')}<input name="childcare" inputmode="decimal" value="${v(c.childcare)}" placeholder="${fmt(fixedYear('garde'), { bare: true })}"></label>
        </div>
        ${supported ? `<div class="grid2">
          <label class="field">${t('tax.commune')}<input name="communeCoef" inputmode="decimal" value="${v(c.communeCoef)}" placeholder="${T.CANTONS[canton].communeDefault}"></label>
          <label class="field">${t('tax.parish')}<input name="parishCoef" inputmode="decimal" value="${v(c.parishCoef || '')}" placeholder="${esc(t('tax.parishPh'))}"></label>
        </div>` : `<label class="field">${t('tax.override')}<input name="cantonalOverride" inputmode="decimal" value="${v(c.cantonalOverride || '')}" placeholder="0"></label>`}
        <label class="field">${t('tax.p3a')}<input name="pillar3a" inputmode="decimal" value="${v(c.pillar3a)}" placeholder="${esc(fmt(p3aAuto(), { bare: true }))}"></label>
        <p class="hint">${t('tax.hint')}</p>
        <div id="taxOut">${taxBreakdown(c)}</div>
      </div>`,
    `<button class="btn" value="apply">${t('tax.apply')}</button><button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      const val = readTax(fd);
      setting({ tax: val });
      if (action === 'apply') {
        const m = Math.round(T.estimate(taxInput(val)).monthly);
        const now = Date.now(), cur = taxCharges();
        if (cur.length) { Object.assign(cur[0], { amount: m, updatedAt: now }); cur.slice(1).forEach((x) => Object.assign(x, { deleted: true, updatedAt: now })); }
        else doc().fixed.push({ id: F.uid(), label: t('cat.impots'), amount: m, cat: 'impots', day: null, updatedAt: now });
        F.relinkFixed(doc());
        save(); toast(t('tax.applied', { amount: fmt(m) }));
        return;
      }
      toast(t('tax.saved'));
    });
  }

  // ---------- Apple Pay / Wallet ----------
  function walletHtml() {
    const base = location.origin + location.pathname;
    const link = `${base}?amount=[${t('wallet.vAmount')}]&merchant=[${t('wallet.vMerchant')}]&card=[${t('wallet.vCard')}]`;
    const cloud = S.cloud && S.session;
    const steps = (cloud ? ['wallet.s1', 'wallet.s2', 'wallet.s3', 'wallet.s4c', 'wallet.s5c'] : ['wallet.s1', 'wallet.s2', 'wallet.s3', 'wallet.s4l', 'wallet.s5l']).map((k) => `<li>${t(k)}</li>`).join('');
    return `<section class="card form" id="walletCard">
      <div class="hero-top"><h2>${t('wallet.title')}</h2><span class="pill beta">iPhone · Android</span></div>
      <p class="hint">${t(cloud ? 'wallet.introCloud' : 'wallet.introLocal')}</p>
      <ol class="steps-list">${steps}</ol>
      ${cloud ? `<div class="copy-row"><code id="ingestUrl">${esc(S.ingestUrl)}</code><button class="btn" type="button" data-copy="ingestUrl">${t('wallet.copy')}</button></div>
        <div class="copy-row"><code id="ingestKey">${esc(ui.ingestKey || '••••••••••••')}</code><button class="btn ${ui.ingestKey ? '' : 'primary'}" type="button" data-action="${ui.ingestKey ? '' : 'make-key'}" ${ui.ingestKey ? 'data-copy="ingestKey"' : ''}>${ui.ingestKey ? t('wallet.copy') : t('wallet.makeKey')}</button></div>
        <p class="hint">${t('wallet.keyNote')}</p>`
        : `<div class="copy-row"><code id="walletLink">${esc(link)}</code><button class="btn" type="button" data-copy="walletLink">${t('wallet.copy')}</button></div>`}
      <p class="hint">${t('wallet.android')}</p>
      <p class="hint">${t('wallet.dedupe')}</p>
    </section>`;
  }
  document.addEventListener('click', async (ev) => {
    const c = ev.target.closest('[data-copy]');
    if (!c) return;
    const el = document.getElementById(c.dataset.copy);
    try { await navigator.clipboard.writeText(el.textContent); toast(t('wallet.copied')); }
    catch (e) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast(t('wallet.selectCopy')); }
  });

  // ---------- compte et abonnement ----------
  function accountHtml() {
    const cfg = S.config, sess = S.session;
    const planLine = S.plan.comp ? `<p class="hint"><span class="pill ok">Pro</span> ${t(S.plan.owner ? 'plan.owner' : 'plan.comp')}</p>`
      : S.plan.tier === 'beta' ? `<p class="hint"><span class="pill beta">Bêta</span> ${t('plan.beta')}</p>`
      : `<p class="small">${t('plan.' + S.plan.tier)}${S.plan.tier === 'free' ? ` · ${t('plan.price', { month: cfg.priceMonth, year: cfg.priceYear })}` : ''}</p>`;
    let auth;
    if (!S.cloud) auth = `<p class="hint">${t('auth.local')} ${t('auth.unavailable')}</p>`;
    else if (sess) auth = `<p class="small">${t('auth.signedIn', { email: esc(sess.email || '') })}</p><div class="row-btns">${S.plan.tier === 'free' ? `<button class="btn primary" data-action="upgrade" data-i="month">${t('plan.upgrade')}</button>` : S.plan.tier === 'pro' && !S.plan.comp ? `<button class="btn" data-action="manage-billing">${t('plan.manage')}</button>` : ''}<button class="btn" data-action="sign-out">${t('auth.signOut')}</button></div>`;
    else auth = `<p class="hint">${t('auth.local')}</p><form id="signIn" class="form"><label class="field">${t('auth.email')}<input name="email" type="email" autocomplete="email" required></label><button class="btn primary block">${t('auth.send')}</button></form>`;
    // le propriétaire (secret ADMIN_EMAILS, vérifié par le serveur) retrouve ici son tableau de bord
    const adminLink = S.isAdmin() ? `<a class="btn primary block" href="admin.html">${svg('invest')}${t('admin.open')}</a>` : '';
    return `<section class="card form"><h2>${t('set.account')}</h2>${planLine}${adminLink}${auth}</section>`;
  }
  // Fonction Pro : ouvre directement en bêta, sinon explique l'abonnement.
  function requirePro(feature, fn) {
    if (S.isPro()) return fn();
    openDialog(t('pro.title'), `<p>${t('pro.text', { feature: t('pro.' + feature) })}</p><p class="small muted" style="margin-top:8px">${t('plan.price', { month: S.config.priceMonth, year: S.config.priceYear })}</p>`,
      `<button class="btn primary" value="up">${t('plan.upgrade')}</button>`,
      () => { if (S.session) S.billing('checkout', 'month').catch(() => toast('…')); else { ui.tab = 'settings'; saveUi(); render(); } });
  }

  // ---------- dialogues ----------
  const dlg = $('#dlg');
  let dlgHandler = null, pressed = null;
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
    const b = ev.target.closest('button[value]');
    if (b) pressed = b.value;
  });
  dlg.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const primary = form.querySelector('.dlg-foot .btn.primary');
    const action = (ev.submitter && ev.submitter.value) || pressed || (primary && primary.value) || 'save';
    pressed = null;
    const keep = dlgHandler && dlgHandler(action, new FormData(form));
    if (keep !== true) dlg.close();
  });
  function confirmDialog(title, text, okLabel) {
    return new Promise((resolve) => {
      openDialog(title, `<p>${esc(text)}</p>`, `<button class="btn" value="no" type="button" data-close>${t('dlg.cancel')}</button><button class="btn primary danger" value="ok">${esc(okLabel)}</button>`, (a) => resolve(a === 'ok'));
      dlg.addEventListener('close', () => resolve(false), { once: true });
    });
  }

  function txDialog(x) {
    const d = doc(), existing = x.id ? x : null;
    const isIncome = existing ? existing.amount > 0 : x.kind === 'income';
    const accOpts = `<option value="">${t('txd.noAccount')}</option>` + accounts().map((a) => `<option value="${esc(a.id)}" ${(existing ? existing.accountId : d.settings.defaultAccount) === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
    openDialog(existing ? t('txd.edit') : t('txd.new'), `<div class="form" id="txForm">
      <div class="seg kind"><label class="k-exp"><input type="radio" name="kind" value="expense" ${!isIncome ? 'checked' : ''}>${t('txd.expense')}</label><label class="k-inc"><input type="radio" name="kind" value="income" ${isIncome ? 'checked' : ''}>${t('txd.income')}</label></div>
      <label class="amount-field"><span class="sr">${t('txd.amount')}</span><span class="cur">CHF</span><input name="amount" inputmode="decimal" placeholder="0.00" value="${existing ? esc(Math.abs(existing.amount)) : ''}" autocomplete="off" aria-label="${esc(t('txd.amount'))}"></label>
      ${existing ? '' : `<button type="button" class="btn dictate" data-dictate><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg><span>${t('txd.dictate')}</span></button><p class="hint" id="dictHint">${t('txd.dictateHint')}</p>`}
      <label class="field">${t('txd.label')}<input name="label" value="${esc(existing ? existing.label : x.label || '')}" autocomplete="off"></label>
      <label class="field">${t('txd.date')}<input name="date" type="date" value="${esc(existing ? existing.date : F.today())}"></label>
      <div class="grid2"><label class="field">${t('txd.cat')}<select name="cat" ${!existing && x.cat ? 'data-chosen="1"' : ''}>${catOptions(existing ? existing.cat : x.cat || (isIncome ? 'revenu' : 'autre'))}</select></label>
      <label class="field">${t('txd.account')}<select name="accountId">${accOpts}</select></label></div>
      <label class="check"><input type="checkbox" name="excluded" ${existing && existing.excluded ? 'checked' : ''}>${t('txd.excluded')}</label>
      <label class="check"><input type="checkbox" name="transfer" ${existing && existing.transfer ? 'checked' : ''}>${t('txd.transfer')}</label>
    </div>`,
    `${existing ? `<button class="btn danger" value="delete">${t('dlg.delete')}</button>` : ''}${existing && existing.amount < 0 ? `<button class="btn" value="split">${t('dlg.split')}</button>` : ''}<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      if (action === 'delete') { F.deleteTx(d, existing.id); save(); toast(t('txd.deleted')); return; }
      if (action === 'split') { splitDialog(existing); return true; }
      const amt = Math.abs(F.parseAmount(fd.get('amount')));
      if (!(amt > 0)) { toast(t('txd.amountErr')); return true; }
      const signed = fd.get('kind') === 'income' ? amt : -amt;
      const label = String(fd.get('label') || '').trim() || catLabel(fd.get('cat'));
      const cat = fd.get('cat');
      const data = { amount: signed, date: fd.get('date') || F.today(), label, cat, env: signed < 0 ? F.envOf(cat) : null, accountId: fd.get('accountId') || null, transfer: fd.get('transfer') === 'on', excluded: fd.get('excluded') === 'on' };
      const s = d.settings, w = F.keyWord(label);
      if (w && existing && existing.cat !== cat && signed < 0) s.learned = { ...(s.learned || {}), [w]: cat };
      if (w && !!(existing && existing.excluded) !== data.excluded) { const ex = { ...(s.excludedWords || {}) }; if (data.excluded) ex[w] = true; else delete ex[w]; s.excludedWords = ex; }
      s.updatedAt = Date.now();
      if (existing) { if (existing.fixedId && existing.cat !== cat) data.fixedId = undefined; F.updateTx(d, existing.id, data); }
      else motion.flash = { type: 'tx', id: F.addTx(d, { ...data, source: 'manual' }).id };
      save(); toast(t('txd.saved'));
    });
  }

  // Dans la feuille de saisie : la catégorie suit le libellé tant qu'on ne l'a pas choisie ; la dictée remplit tout.
  document.addEventListener('input', (ev) => {
    const fx = ev.target.closest('#fixForm');
    if (fx && ev.target.name === 'freq') { fx.dataset.freq = ev.target.value; return; }
    if (fx) {
      if (ev.target.name === 'cat') ev.target.dataset.chosen = '1';
      else if (ev.target.name === 'label') {
        const sel = fx.querySelector('[name=cat]');
        if (!sel.dataset.chosen) { const c = F.categorize(ev.target.value, doc().settings.learned); sel.value = c === 'autre' ? 'logement' : c; }
      }
      return;
    }
    const f = ev.target.closest('#txForm');
    if (!f) return;
    if (ev.target.name === 'cat') { ev.target.dataset.chosen = '1'; return; }
    if (ev.target.name === 'label' || ev.target.name === 'kind') {
      const sel = f.querySelector('[name=cat]');
      if (sel.dataset.chosen) return;
      const income = f.querySelector('[name=kind]:checked').value === 'income';
      sel.value = income ? 'revenu' : F.categorize(f.querySelector('[name=label]').value, doc().settings.learned);
    }
  });
  document.addEventListener('change', (ev) => { if (ev.target.matches('[data-dossier-year]')) { dlg.close(); dossierDialog(+ev.target.value); } });
  document.addEventListener('change', (ev) => { if (ev.target.name === 'kind' && ev.target.closest('#txForm')) ev.target.dispatchEvent(new Event('input', { bubbles: true })); });
  function fillFromSpeech(f, text) {
    const kind = f.querySelector('[name=kind]:checked').value;
    const r = F.parseCommand(text, { learned: doc().settings.learned });
    if (!r.ok) { $('#dictHint').textContent = t('quick.err.no-amount') + ' « ' + text + ' »'; return; }
    const income = r.amount > 0 || kind === 'income';
    f.querySelector(`[name=kind][value=${income ? 'income' : 'expense'}]`).checked = true;
    f.querySelector('[name=amount]').value = Math.abs(r.amount).toFixed(2);
    f.querySelector('[name=label]').value = r.label;
    f.querySelector('[name=date]').value = r.date;
    const sel = f.querySelector('[name=cat]'); if (!sel.dataset.chosen) sel.value = income ? 'revenu' : r.cat;
    $('#dictHint').textContent = '« ' + text + ' »';
  }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-dictate]');
    if (!b) return;
    const f = b.closest('#txForm'), SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { f.querySelector('[name=label]').focus(); $('#dictHint').textContent = t('quick.mic.tip'); return; }
    const r = new SR(); r.lang = I.locale; r.interimResults = true;
    b.classList.add('rec'); b.querySelector('span').textContent = t('txd.listening');
    let last = '';
    r.onresult = (e) => { last = [...e.results].map((x) => x[0].transcript).join(' ').trim(); $('#dictHint').textContent = '« ' + last + ' »'; };
    r.onend = () => { b.classList.remove('rec'); b.querySelector('span').textContent = t('txd.dictate'); if (last) fillFromSpeech(f, last); };
    r.onerror = () => { b.classList.remove('rec'); b.querySelector('span').textContent = t('txd.dictate'); $('#dictHint').textContent = t('quick.mic.tip'); };
    try { r.start(); } catch (e) { b.classList.remove('rec'); }
  });

  function splitDialog(x) {
    const d = doc(), total = Math.abs(x.amount), word = F.keyWord(x.bankLabel || x.label);
    const rule = word && d.settings.splitRules && d.settings.splitRules[word];
    const pre = rule && Math.round(rule.total * 100) === Math.round(total * 100) ? rule.parts : [{ label: x.label, amount: total, cat: x.cat }, {}, {}];
    const rows = [...pre, ...Array(Math.max(0, 4 - pre.length)).fill({})].slice(0, 6);
    openDialog(t('split.title'), `<div class="form" id="splitForm" data-total="${total}">
      <p class="hint">${t('split.hint', { label: esc(x.label), amount: fmt(x.amount) })}</p>
      ${rows.map((r, i) => `<div class="split-row"><input name="pl" aria-label="${esc(t('txd.label'))} ${i + 1}" value="${esc(r.label || '')}" autocomplete="off"><input name="pa" aria-label="${esc(t('txd.amount'))} ${i + 1}" inputmode="decimal" placeholder="0.00" value="${esc(r.amount || '')}" autocomplete="off"><select name="pc" aria-label="${esc(t('txd.cat'))} ${i + 1}">${catOptions(r.cat || 'autre')}</select></div>`).join('')}
      <div class="small" id="splitLeft"></div>
      <label class="check"><input type="checkbox" name="remember" checked>${t('split.remember')}</label></div>`,
    `<button class="btn primary" value="split">${t('dlg.split')}</button>`,
    (action, fd) => {
      const parts = fd.getAll('pl').map((label, i) => ({ label, amount: F.parseAmount(fd.getAll('pa')[i]), cat: fd.getAll('pc')[i] })).filter((p) => p.amount > 0);
      let made;
      try { made = F.splitTx(d, x.id, parts); } catch (e) { toast(t('split.err.' + e.message)); return true; }
      if (fd.get('remember') === 'on' && word) d.settings.splitRules = { ...(d.settings.splitRules || {}), [word]: { total, parts: made.map((p) => ({ label: p.label, amount: Math.abs(p.amount), cat: p.cat })) } };
      d.settings.updatedAt = Date.now();
      save(); toast(t('split.done', { n: made.length, labels: made.map((p) => p.label).join(', ') }));
    });
    updateSplitLeft();
  }
  function updateSplitLeft() {
    const f = $('#splitForm'), out = $('#splitLeft');
    if (!f || !out) return;
    const left = Math.round((+f.dataset.total - $$('input[name=pa]', f).reduce((s, i) => s + (F.parseAmount(i.value) || 0), 0)) * 100) / 100;
    out.innerHTML = left === 0 ? `<span class="pos">${t('split.ok')}</span>` : t('split.left', { amount: `<b class="num ${left < 0 ? 'neg' : ''}">${fmt(left)}</b>` });
  }

  function fixedDialog(c) {
    const d = doc(), existing = c && c.id ? c : null, yearly = !!(c && c.freq === 'year');
    openDialog(existing ? t('fixedd.edit') : t('fixedd.new'), `<div class="form" id="fixForm" data-freq="${yearly ? 'year' : 'month'}">
      <label class="field">${t('fixedd.label')}<input name="label" value="${esc(c ? c.label || '' : '')}" autocomplete="off"></label>
      <div class="seg kind freq"><label><input type="radio" name="freq" value="month" ${yearly ? '' : 'checked'}>${t('fixedd.monthly')}</label><label><input type="radio" name="freq" value="year" ${yearly ? 'checked' : ''}>${t('fixedd.yearly')}</label></div>
      <div class="grid2"><label class="field"><span data-when="month">${t('fixedd.amount')}</span><span data-when="year">${t('fixedd.amountYear')}</span><input name="amount" inputmode="decimal" value="${esc(c && c.amount ? c.amount : '')}" autocomplete="off"></label>
      <label class="field" data-when="month">${t('fixedd.day')}<input name="day" type="number" min="1" max="31" value="${esc(existing && existing.day ? existing.day : '')}"></label>
      <label class="field" data-when="year">${t('fixedd.dueMonth')}<select name="dueMonth">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${+(c && c.dueMonth) === i + 1 ? 'selected' : ''}>${esc(monthName(i + 1))}</option>`).join('')}</select></label></div>
      <p class="hint" data-when="year">${t('fixedd.yearHint')}</p>
      <label class="field">${t('txd.cat')}<select name="cat" ${c && c.cat ? 'data-chosen="1"' : ''}>${catOptions(c && c.cat ? c.cat : 'logement')}</select></label>
      <p class="hint">${t('fixedd.hint')}</p></div>`,
    `${existing ? `<button class="btn danger" value="delete">${t('dlg.delete')}</button>` : ''}<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      const now = Date.now();
      if (action === 'delete') {
        Object.assign(existing, { deleted: true, updatedAt: now }); save();
        toast(t('fixed.deleted', { label: existing.label }), [{ label: t('undo'), fn: () => { Object.assign(existing, { deleted: false, updatedAt: Date.now() }); save(); } }]);
        return;
      }
      const label = String(fd.get('label') || '').trim(), amount = F.parseAmount(fd.get('amount'));
      if (!label || !(amount > 0)) { toast(t('fixedd.err')); return true; }
      const year = fd.get('freq') === 'year';
      const data = { label, amount, cat: fd.get('cat'), day: year ? null : +fd.get('day') || null, freq: year ? 'year' : 'month', dueMonth: year ? +fd.get('dueMonth') : null, updatedAt: now };
      // la réserve commence le mois où la facture annuelle est saisie
      if (year && !(existing && existing.freq === 'year' && existing.since)) data.since = F.monthState(d).month;
      if (existing) Object.assign(existing, data); else d.fixed.push({ id: F.uid(), ...data });
      F.relinkFixed(d);
      save();
    });
  }

  function plannedDialog(x) {
    const d = doc(), per = F.periodFor(d, F.today());
    const nextStart = F.addDays(per.end, 1);
    const months = [per.start, nextStart, F.addMonths(nextStart, 1), F.addMonths(nextStart, 2)].map((m) => m.slice(0, 7));
    if (x.month && !months.includes(x.month)) months.push(x.month);
    const isNew = !x.id;
    const qr = x.qr;
    openDialog(isNew ? (qr ? t('qr.newTitle') : t('planned.title')) : t('planned.edit'), `<div class="form">
      ${qr ? `<div class="qr-card">${tile('qr', 'fixed')}<div><b>${esc(qr.creditor || '')}</b>${qr.city ? ` · ${esc(qr.city)}` : ''}<small>${esc(qr.iban.replace(/(.{4})/g, '$1 ').trim())}${qr.ref ? ` · ${t('qr.ref')} ${esc(qr.ref.slice(-8))}` : ''}${qr.due ? ` · ${t('qr.due', { date: esc(ds(qr.due)) })}` : ''}</small></div></div>` : ''}
      <label class="field">${t('planned.what')}<input name="label" value="${esc(x.label || '')}" placeholder="${esc(t('planned.whatPh'))}" autocomplete="off"></label>
      <div class="grid2"><label class="field">${t('txd.amount')}<input name="amount" inputmode="decimal" value="${esc(x.amount || '')}" placeholder="0.00" autocomplete="off"></label>
      <label class="field">${t('planned.month')}<select name="month">${months.map((m, i) => `<option value="${m}" ${m === (x.month || months[1]) ? 'selected' : ''}>${esc(mLong.format(asDate(m)))}${i === 0 ? ' ' + t('planned.current') : ''}</option>`).join('')}</select></label></div>
      <label class="field">${t('txd.cat')}<select name="cat">${catOptions(x.cat || 'autre')}</select></label>
      <p class="hint">${t('planned.hint')}</p></div>`,
    `${isNew ? '' : `<button class="btn danger" value="delete">${t('dlg.delete')}</button>`}<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      const now = Date.now();
      if (action === 'delete') { Object.assign(x, { deleted: true, updatedAt: now }); save(); toast(t('planned.deleted')); return; }
      const amount = F.parseAmount(fd.get('amount')), label = String(fd.get('label') || '').trim();
      if (!label || !(amount > 0)) { toast(t('fixedd.err')); return true; }
      let cat = fd.get('cat');
      if (cat === 'autre') cat = F.categorize(label, d.settings.learned);
      const data = { label, amount, cat, month: fd.get('month'), updatedAt: now };
      if (qr) data.qr = qr;
      if (isNew) d.planned.push({ id: F.uid(), ...data }); else Object.assign(x, data);
      save(); toast(t('planned.saved', { label, amount: fmt(amount), month: mLong.format(asDate(data.month)) }));
    });
  }

  function accountDialog(a) {
    const d = doc();
    openDialog(a ? t('acc.edit') : t('acc.new'), `<div class="form">
      <label class="field">${t('acc.name')}<input name="name" value="${esc(a ? a.name : '')}" autocomplete="off"></label>
      <div class="grid2"><label class="field">${t('acc.kind')}<select name="kind">${['courant', 'epargne', 'urgence', 'invest', 'carte'].map((k) => `<option value="${k}" ${a && a.kind === k ? 'selected' : ''}>${t('acc.kind.' + k)}</option>`).join('')}</select></label>
      <label class="field">${t('acc.balance')}<input name="balance" inputmode="decimal" value="${esc(a ? a.balance : '')}" autocomplete="off"></label></div></div>`,
    `${a ? `<button class="btn danger" value="delete">${t('dlg.delete')}</button>` : ''}<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      const now = Date.now();
      if (action === 'delete') { Object.assign(a, { deleted: true, updatedAt: now }); save(); return; }
      const name = String(fd.get('name') || '').trim();
      if (!name) return true;
      const data = { name, kind: fd.get('kind'), balance: F.parseAmount(fd.get('balance')) || 0, updatedAt: now };
      if (a) Object.assign(a, data);
      else { const id = F.uid(); d.accounts.push({ id, ...data }); if (!d.settings.defaultAccount) d.settings.defaultAccount = id; }
      save();
    });
  }

  // ---------- import de relevé ----------
  let pendingImport = null;
  function importDialog() {
    if (!accounts().length) { toast(t('imp.needAccount')); accountDialog(null); return; }
    openDialog(t('imp.title'), `<div class="form">
      <label class="field">${t('imp.account')}<select name="accountId">${accounts().map((a) => `<option value="${esc(a.id)}" ${doc().settings.defaultAccount === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
      <p class="hint">${t('imp.hint')}</p></div>`,
    `<button class="btn primary" value="pick">${t('imp.file')}</button>`,
    (action, fd) => { pendingImport = { accountId: fd.get('accountId') }; $('#stmtFile').click(); });
  }
  $('#stmtFile').addEventListener('change', async (ev) => {
    const file = ev.target.files[0]; ev.target.value = '';
    if (!file || !pendingImport) return;
    const buf = await file.arrayBuffer();
    let text = new TextDecoder('utf-8').decode(buf);
    if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buf);
    const res = F.parseStatement(text);
    if (!res.ok) { toast(t('imp.err.' + res.error)); return; }
    previewImport(pendingImport.accountId, F.reconcile(doc(), pendingImport.accountId, res.rows));
  });
  function previewImport(accountId, rows) {
    const tag = (r) => [r.dup === 'exact' ? `<span class="tag">${t('imp.dupExact')}</span>` : r.dup === 'probable' ? `<span class="tag ok">${t('imp.dupProb')}</span>` : '',
      r.fixedId && r.dup !== 'exact' ? `<span class="tag ok">✓ ${esc((F.live(doc().fixed).find((c) => c.id === r.fixedId) || {}).label || '')}</span>` : '',
      r.excluded ? `<span class="tag">${t('tag.excluded')}</span>` : '', r.transfer ? `<span class="tag tr">${t('tag.transfer')}</span>` : '',
      r.split ? `<span class="tag ok">${t('imp.split', { labels: esc(r.split.map((p) => p.label).join(' + ')) })}</span>` : ''].join('');
    const count = () => rows.filter((r) => r.selected).length;
    openDialog(t('imp.title'), `<p class="small muted">${t('imp.preview', { n: rows.length })}</p><div id="impRows">${rows.map((r, i) => `<label class="imp-row"><input type="checkbox" name="sel" value="${i}" ${r.selected ? 'checked' : ''} ${r.dup === 'exact' ? 'disabled' : ''}>
        <span style="min-width:0"><span class="t">${esc(r.label)}</span><span class="s"> · ${esc(ds(r.date))} · ${esc(catLabel(r.cat))}</span>${tag(r) ? `<span class="tags">${tag(r)}</span>` : ''}</span>
        <span class="num ${r.amount > 0 ? 'pos' : ''}">${fmt(r.amount, { sign: true })}</span></label>`).join('')}</div>`,
    `<button class="btn primary" value="go">${t('imp.go', { n: count() })}</button>`,
    (action, fd) => {
      const sel = new Set(fd.getAll('sel').map(Number));
      rows.forEach((r, i) => { r.selected = sel.has(i); });
      const res = F.applyImport(doc(), accountId, rows);
      F.relinkFixed(doc());
      save(); toast(t('imp.done', { added: res.added, linked: res.linked, fixed: res.fixedPaid }));
    });
  }

  // ---------- saisie rapide ----------
  $('#quick').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const inp = $('#quickInput'), text = inp.value.trim();
    if (!text) { txDialog({ kind: 'expense' }); return; }
    quickAdd(text, 'manual');
    inp.value = '';
  });
  function quickAdd(text, source) {
    const d = doc();
    const r = F.parseCommand(text, { learned: d.settings.learned });
    if (!r.ok) { toast(t('quick.err.' + (r.error || 'no-amount'))); return; }
    const acc = accounts().some((a) => a.id === d.settings.defaultAccount) ? d.settings.defaultAccount : null;
    const x = F.addTx(d, { date: r.date, amount: r.amount, label: r.label || catLabel(r.cat), cat: r.cat, accountId: acc, source });
    motion.flash = { type: 'tx', id: x.id };
    save();
    toast(`${x.label} · ${fmt(x.amount)}${x.date !== F.today() ? ' · ' + ds(x.date) : ''}`, [
      { label: t('quick.edit'), fn: () => txDialog(x) },
      { label: t('undo'), fn: () => { F.deleteTx(d, x.id); save(); } },
    ]);
  }
  let rec = null;
  $('#micBtn').addEventListener('click', () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const inp = $('#quickInput');
    if (!SR) { inp.focus(); toast(t('quick.mic.tip')); return; }
    if (rec) { rec.stop(); return; }
    let finalText = '';
    rec = new SR();
    rec.lang = I.locale; rec.interimResults = true;
    rec.onresult = (e) => { const s = [...e.results].map((r) => r[0].transcript).join(' ').trim(); inp.value = s; if (e.results[e.results.length - 1].isFinal) finalText = s; };
    rec.onend = () => { $('#micBtn').classList.remove('rec'); rec = null; if (finalText) { inp.value = ''; quickAdd(finalText, 'voice'); } };
    rec.onerror = () => { inp.focus(); toast(t('quick.mic.tip')); };
    $('#micBtn').classList.add('rec');
    try { rec.start(); } catch (e) { $('#micBtn').classList.remove('rec'); rec = null; }
  });

  // ---------- actions ----------
  function payFixed(id) {
    const d = doc();
    const planned = F.live(d.planned).find((x) => x.id === id);
    const c = planned || F.live(d.fixed).find((x) => x.id === id);
    if (!c) return;
    const acc = accounts().some((a) => a.id === d.settings.defaultAccount) ? d.settings.defaultAccount : null;
    const x = F.addTx(d, { date: F.today(), amount: -Math.abs(c.amount), label: c.label, cat: c.cat, env: planned ? 'fixed' : F.chargeEnv(c), fixedId: c.id, accountId: acc, source: 'manual', paidMark: true });
    motion.flash = { type: 'paid', id: x.id };
    save();
    toast(t('fixed.paidToast', { label: c.label }), [{ label: t('undo'), fn: () => { F.deleteTx(d, x.id); save(); } }]);
  }
  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const ACTIONS = {
    tab: (el) => go(el.dataset.tab),
    'edit-tx': (el) => { const x = doc().tx.find((y) => y.id === el.dataset.id && !y.deleted); if (x) txDialog(x); },
    'new-tx': () => txDialog({ kind: 'expense' }),
    'new-income': () => txDialog({ kind: 'income' }),
    limit: (el) => limitDialog(el.dataset.cat),
    'scan-bill': () => scanDialog(),
    dossier: () => requirePro('dossier', () => dossierDialog()),
    'bonus-save': (el) => {
      const amt = Math.round(+el.dataset.amount || 0);
      if (!(amt > 0)) return;
      const st = F.monthState(doc());
      F.addTx(doc(), { date: F.today(), amount: -amt, label: t('bonus.label'), cat: 'epargne', env: 'savings', bonusFor: st.period.start, accountId: doc().settings.defaultAccount || null, source: 'manual' });
      save(); toast(t('bonus.saved', { amount: fmt(amt) }));
    },
    'new-goal': (el) => goalDialog({ label: (el && el.dataset.label) || '' }),
    'edit-goal': (el) => { const g = F.live(doc().goals).find((x) => x.id === el.dataset.id); if (g) goalDialog(g); },
    'goal-add': (el) => { const g = F.live(doc().goals).find((x) => x.id === el.dataset.id); if (g) goalAddDialog(g); },
    'new-3a': () => txDialog({ kind: 'expense', label: t('p3a.label'), cat: 'invest' }),
    'new-yearly': (el) => fixedDialog({ freq: 'year', label: (el && el.dataset.label) || '', amount: (el && el.dataset.amount) || '', cat: yearlyCat(el && el.dataset.label), dueMonth: 1 }),
    'make-key': async () => { try { ui.ingestKey = await S.createIngestKey(); render(); } catch (e) { toast(t('wallet.keyErr')); } },
    'new-fixed': (el) => fixedDialog(el && el.dataset.label ? { label: el.dataset.label, cat: el.dataset.cat } : null),
    'edit-fixed': (el) => { const c = F.live(doc().fixed).find((x) => x.id === el.dataset.id); if (c) fixedDialog(c); },
    'new-planned': (el) => plannedDialog({ month: el.dataset.month }),
    'edit-planned': (el) => { const x = F.live(doc().planned).find((p) => p.id === el.dataset.id); if (x) plannedDialog(x); },
    'pay-fixed': (el) => payFixed(el.dataset.id),
    'unpay-fixed': (el) => {
      const d = doc(), x = d.tx.find((y) => y.id === el.dataset.id && !y.deleted);
      if (!x) return;
      F.deleteTx(d, x.id); save();
      toast(t('fixed.unmark', { label: x.label }), [{ label: t('undo'), fn: () => { F.addTx(d, { date: x.date, amount: x.amount, label: x.label, cat: x.cat, env: x.env, fixedId: x.fixedId, accountId: x.accountId, source: 'manual', paidMark: true }); save(); } }]);
    },
    'toggle-check': (el) => { const d = doc(), st = F.monthState(d); F.setCheck(d, st.period.start, el.dataset.k, !st.checks[el.dataset.k].manual); save(); },
    'new-account': () => accountDialog(null),
    'edit-account': (el) => accountDialog(doc().accounts.find((x) => x.id === el.dataset.id)),
    import: () => requirePro('import', importDialog),
    tax: () => requirePro('tax', taxDialog),
    filter: (el) => { ui.filter = el.dataset.f; saveUi(); render(); },
    period: (el) => { ui.offset = Math.max(0, ui.offset + +el.dataset.d); render(); },
    'goto-period': (el) => { ui.offset = +el.dataset.o || 0; render(); const p = $('#periodDetail'); if (p) p.scrollIntoView({ block: 'start' }); },
    'export-csv': () => download(`franko-${F.today()}.csv`, F.toCSV(doc()), 'text/csv;charset=utf-8'),
    backup: () => download(`franko-sauvegarde-${F.today()}.json`, JSON.stringify(doc(), null, 1), 'application/json'),
    restore: () => $('#restoreFile').click(),
    wipe: async () => {
      if (!(await confirmDialog(t('confirm.title'), t('set.wipeConfirm'), t('set.wipe')))) return;
      const now = Date.now(), d = doc();
      for (const k of ['accounts', 'fixed', 'checks', 'planned', 'tx']) for (const x of d[k]) Object.assign(x, { deleted: true, updatedAt: now });
      d.settings = { ...F.emptyDoc().settings, updatedAt: now };
      save(); toast(t('set.wiped'));
    },
    upgrade: (el) => S.billing('checkout', el.dataset.i || 'month').catch(() => toast('…')),
    'manage-billing': () => S.billing('portal').catch(() => toast('…')),
    'sign-out': async () => { await S.signOut(); render(); },
  };
  document.addEventListener('click', (ev) => {
    const tab = ev.target.closest('.tabs button');
    if (tab) { go(tab.dataset.tab); return; }
    const el = ev.target.closest('[data-action]');
    if (!el || el.closest('dialog') && !el.closest('.dlg-body')) return;
    if (el.closest('dialog')) dlg.close();
    const fn = ACTIONS[el.dataset.action];
    if (fn) { ev.preventDefault(); fn(el); }
  });
  function go(tab) { ui.tab = tab; if (tab === 'tx') ui.offset = 0; saveUi(); render(); window.scrollTo(0, 0); }

  $('#restoreFile').addEventListener('change', async (ev) => {
    const file = ev.target.files[0]; ev.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !data.settings) throw new Error('format');
      S.replace(F.merge(doc(), data)); S.save(); render(); toast(t('set.restored'));
    } catch (e) { toast(t('set.restoreErr')); }
  });

  // réglages : enregistrés à chaque changement
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    // le formulaire d'accueil ne s'enregistre qu'au bouton « Commencer », sinon il disparaît dès le premier champ
    if (!el.closest('#view') || !el.name || el.closest('#onboard')) return;
    const s = doc().settings;
    if (el.name === 'salary') setting({ salary: F.parseAmount(el.value) || 0 });
    else if (el.name === 'payday') setting({ payday: Math.min(28, Math.max(1, +el.value || 25)) });
    else if (el.name === 'canton' || el.name === 'periodMode' || el.name === 'preset') setting({ [el.name]: el.value });
    else if (el.name.startsWith('split_')) setting({ split: { ...s.split, [el.name.slice(6)]: +el.value || 0 } });
    else if (el.name === 'emergencyMonths') setting({ emergencyMonths: +el.value });
    else if (el.name === 'emergencyFund') setting({ emergencyFund: F.parseAmount(el.value) || 0 });
    else if (el.name === 'lang') { ui.lang = I.setLang(el.value); setLocale(); saveUi(); setting({ lang: ui.lang }); }
    else if (el.name === 'theme') { ui.theme = el.value; saveUi(); render(); }
  });
  document.addEventListener('input', (ev) => {
    if (ev.target.name === 'emergencyMonths') { const o = $('#monthsOut'); if (o) o.textContent = ev.target.value; }
    if (ev.target.closest('#splitForm')) updateSplitLeft();
    if (ev.target.closest('#taxForm')) { const f = ev.target.closest('form'); $('#taxOut').innerHTML = taxBreakdown(readTax(new FormData(f))); }
  });
  document.addEventListener('submit', (ev) => {
    if (ev.target.id === 'onboard') {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const sal = F.parseAmount(fd.get('salary'));
      if (!(sal > 0)) return;
      const pd = Math.round(+fd.get('payday'));
      setting({ salary: sal, canton: fd.get('canton'), ...(pd >= 1 && pd <= 28 ? { payday: pd } : {}) });
    } else if (ev.target.id === 'signIn') {
      ev.preventDefault();
      const email = String(new FormData(ev.target).get('email') || '').trim();
      S.signIn(email).then(() => toast(t('auth.sent', { email }))).catch(() => toast(t('auth.unavailable')));
    }
  });

  // Infobulle commune aux graphiques : survol à la souris, toucher au doigt.
  const tipEl = document.createElement('div');
  tipEl.className = 'tip'; tipEl.hidden = true; tipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(tipEl);
  function showTip(ev) {
    const el = ev.target.closest && ev.target.closest('[data-tip]');
    if (!el) { hideTip(); return; }
    tipEl.innerHTML = el.dataset.tip; tipEl.hidden = false;
    let cx, cy;
    const svgEl = el.ownerSVGElement;
    if (svgEl && el.dataset.cx) {
      const r = svgEl.getBoundingClientRect(), k = r.width / svgEl.viewBox.baseVal.width;
      cx = r.left + (+el.dataset.cx) * k; cy = r.top + (+el.dataset.cy) * k;
      const cross = svgEl.querySelector('.cross');
      if (cross) { cross.setAttribute('x1', el.dataset.cx); cross.setAttribute('x2', el.dataset.cx); cross.classList.add('on'); }
    } else { const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top; }
    const w = tipEl.offsetWidth;
    tipEl.style.left = Math.min(innerWidth - w / 2 - 8, Math.max(w / 2 + 8, cx)) + 'px';
    tipEl.style.top = Math.max(tipEl.offsetHeight + 12, cy) + window.scrollY + 'px';
  }
  function hideTip() { tipEl.hidden = true; document.querySelectorAll('.cross.on').forEach((c) => c.classList.remove('on')); }
  document.addEventListener('pointermove', (ev) => { if (ev.pointerType === 'mouse') showTip(ev); });
  document.addEventListener('pointerdown', (ev) => { if (ev.pointerType !== 'mouse') showTip(ev); });
  window.addEventListener('scroll', hideTip, { passive: true });

  let toastTimer = null;
  function toast(msg, actions) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span>` + (actions || []).map((a, i) => `<button type="button" data-i="${i}">${esc(a.label)}</button>`).join('');
    el.hidden = false;
    el.onclick = (ev) => { const b = ev.target.closest('button'); if (!b) return; el.hidden = true; actions[+b.dataset.i].fn(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, actions && actions.length ? 6000 : 3000);
  }

  // ---------- démarrage ----------
  ui.lang = I.setLang(ui.lang || doc().settings.lang || navigator.language);
  setLocale();
  function takeLinkPayment() {
    const q = new URLSearchParams(location.search);
    if (!q.has('amount') && !q.has('montant')) return;
    const item = F.parseIngest(q, { learned: doc().settings.learned });
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* adresse inchangée */ }
    if (!item.ok) { toast(t('wallet.bad')); return; }
    const x = F.ingest(doc(), item);
    S.save();
    if (x) { ui.tab = 'home'; toast(t('wallet.added', { label: x.label, amount: fmt(x.amount) }), [{ label: t('quick.edit'), fn: () => txDialog(x) }]); }
  }
  S.on(() => {
    const got = S.takeIngested && S.takeIngested();
    render();
    if (got && got.length) toast(got.length === 1 ? t('wallet.added', { label: got[0].label, amount: fmt(got[0].amount) }) : t('wallet.addedN', { n: got.length }));
  });
  // retour d'un lien de connexion refusé (expiré, déjà utilisé) : on l'explique et on ouvre Réglages pour en redemander un
  const authErr = /(^|[#&])error_code=([^&]*)/.exec(location.hash);
  if (authErr) {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    ui.tab = 'settings'; saveUi();
    setTimeout(() => toast(t(authErr[2] === 'otp_expired' ? 'auth.linkExpired' : 'auth.linkError')), 300);
  }
  S.init();
  takeLinkPayment();
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.App = { render, getDoc: doc, toast };
})();
