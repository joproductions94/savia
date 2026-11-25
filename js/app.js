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
    $('#view').innerHTML = (VIEWS[ui.tab] || VIEWS.home)(st);
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

  const VIEWS = {
    home(st) {
      const d = doc(), p = st.plan;
      if (!p.salary) {
        return `<section class="card form">
          <h1 style="font-size:1.4rem">${t('home.welcome.title')}</h1>
          <p class="muted">${t('home.welcome.text')}</p>
          <form id="onboard" class="form">
            <label class="field">${t('home.welcome.salary')}<input name="salary" inputmode="decimal" required placeholder="6500"></label>
            <label class="field">${t('home.welcome.canton')}<select name="canton">${T.CANTON_LIST.map((c) => `<option ${c === (d.settings.canton || 'FR') ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
            <button class="btn primary block">${t('home.welcome.go')}</button>
          </form>
        </section>`;
      }
      const f = st.flow, per = st.period;
      const al = F.alerts(d).filter((a) => a.id !== 'short');
      const over = f.left < 0, short = f.leftAfterAll < 0;
      const inTotal = f.salaryIn + f.otherIncome;
      const used = inTotal > 0 ? pct(inTotal - f.left, inTotal) : 100;
      const fast = f.dailyBudget > 0 && f.spentDaily / f.dailyBudget > per.elapsed / per.days + 0.15;
      const status = over ? ['danger', 'status.overdraft'] : short ? ['danger', 'status.short'] : fast ? ['warn', 'status.fast'] : ['ok', 'status.ok'];
      const paidOut = f.fixedPaid + f.invest.deducted + f.savings.deducted;
      const recent = F.live(d.tx).slice().sort(byDateDesc).slice(0, 5);
      const e = p.emergency;
      return `
      <section class="card hero" aria-label="${esc(t('home.available'))}">
        <div class="hero-top"><span class="eyebrow">${t('home.available')}</span><span class="pill ${status[0]}">${t(status[1])}</span></div>
        <div class="big ${over ? 'neg' : ''}">${bigAmount(f.left)}</div>
        <p class="sub">${t('home.onlyPaid', { date: esc(ds(F.addDays(per.end, 1))) })}</p>
        ${f.pending >= 1 ? `<p class="bank-line"><span>${t('home.notPaid')} <b class="num">${fmt(f.pending)}</b></span><span>= ${t('home.afterAll')} <b class="num ${short ? 'neg' : ''}">${fmt(f.leftAfterAll)}</b>${!short && per.daysLeft > 0 ? ` · ${t('home.perDay', { amount: `<b class="num">${fmt(st.perDay)}</b>` })}` : ''}</span></p>` : ''}
        <div class="meter ${over ? 'over' : ''}" style="--c:var(--primary)" role="img" aria-label="${Math.round(used)} %"><i style="width:${used.toFixed(1)}%"></i></div>
        <dl class="stats">
          <div><dt>${t('home.paidOut')}</dt><dd class="num">${fmt(paidOut, { bare: true })}</dd></div>
          <div><dt>${t('home.spent')}</dt><dd class="num">${fmt(f.spentDaily, { bare: true })}</dd></div>
          <div><dt>${t('home.pending')}</dt><dd class="num">${fmt(f.pending, { bare: true })}</dd></div>
        </dl>
      </section>
      ${al.length ? `<section><div class="section-head"><h2>${t('home.watch')}</h2></div><div class="card notes">${al.map((a) => `<div class="note ${a.level}">${esc(alertText(a))}</div>`).join('')}</div></section>` : ''}
      ${calcHtml(st)}
      ${checksHtml(st)}
      ${fixedSection(st)}
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
      </section>`;
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
        <div class="row-btns"><button class="btn" data-action="new-tx">${t('tx.new')}</button><button class="btn" data-action="export-csv">${t('tx.export')}</button></div>
      </section>`;
    },

    plan(st) {
      const d = doc();
      if (!st.plan.salary) return VIEWS.home(st);
      const charges = F.live(d.fixed).filter((c) => +c.amount > 0).sort((a, b) => b.amount - a.amount);
      const total = charges.reduce((s, c) => s + (+c.amount || 0), 0);
      return `${nextMonthHtml(st)}
      <section>
        <div class="section-head"><h2>${t('plan.chargesTitle')}</h2><button class="link" data-action="new-fixed">${t('fixed.add')}</button></div>
        <div class="card flush">${charges.length ? `<ul class="list">${charges.map((c) => `<li><button class="row" data-action="edit-fixed" data-id="${esc(c.id)}">
            ${tile(c.cat, F.chargeEnv(c))}<span class="main"><span class="title">${esc(c.label)}</span><span class="meta">${esc(catLabel(c.cat))}${c.day ? ` · ${esc(c.day)}.` : ''}</span></span>
            <span class="num">${fmt(c.amount)}</span></button></li>`).join('')}</ul>
          <p class="small" style="text-align:right;padding:4px 0 12px">${t('plan.total', { amount: `<b class="num">${fmt(total)}</b>` })}</p>` : `<p class="empty">${t('fixed.empty')}</p>`}</div>
      </section>
      ${taxCard()}`;
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
    const p = { ...a };
    if (a.amount != null) p.amount = fmt(a.amount);
    if (a.perDay != null) p.perDay = fmt(a.perDay);
    if (a.names) p.names = a.names.join(', ');
    return t('alert.' + a.id, p);
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
      const when = x ? t('fixed.paidOn', { date: ds(x.date) }) : f0.planned ? `${t('fixed.plannedTag')} · ${catLabel(c.cat)}` : f0.partial ? t('fixed.partial', { amount: fmt(c.amount, { bare: true }) }) : c.day ? t('fixed.dueOn', { date: ds(F.dueDate(st.period, c.day)) }) : catLabel(c.cat);
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
        <div class="meter" style="--c:var(--fixed)"><i style="width:${pct(total - due, total).toFixed(1)}%"></i></div>
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
      return `<button class="hcol${m.offset === ui.offset ? ' on' : ''}" data-action="goto-period" data-o="${m.offset}" title="${esc(tip)}" aria-label="${esc(tip)}" aria-pressed="${m.offset === ui.offset}">
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
  function nextMonthHtml(st) {
    const n = F.nextMonth(doc());
    const fxCount = F.live(doc().fixed).filter((c) => +c.amount > 0 && F.chargeEnv(c) === 'fixed').length;
    const inv = F.live(doc().fixed).filter((c) => +c.amount > 0 && F.chargeEnv(c) === 'invest').map((c) => c.label).join(', ');
    return `<section>
      <div class="section-head"><h2 class="cap">${esc(mLong.format(asDate(n.start)))}</h2><span class="sub">${t('next.sub', { date: esc(ds(n.start)) })}</span></div>
      <div class="card calc"><div class="flow">
        ${row('income', t('next.salary'), fmt(n.salary), t('next.salaryNote'))}
        ${row('fixed', t('next.fixed'), fmt(-n.fixed), t('next.fixedNote', { n: fxCount }))}
        ${n.invest ? row('invest', t('calc.invest'), fmt(-n.invest), esc(inv)) : ''}
        ${n.planned.map((x) => `<button class="flow-row" data-action="edit-planned" data-id="${esc(x.id)}"><span class="key" style="--c:var(--fixed)"></span><span>${esc(x.label)}<small>${t('next.plannedNote', { cat: esc(catLabel(x.cat)) })}</small></span><span class="num">${fmt(-x.amount)}</span></button>`).join('')}
        ${row('', t('next.after'), `<span class="${n.after < 0 ? 'neg' : ''}">${fmt(n.after)}</span>`, n.plannedSum ? t('next.afterNote', { amount: fmt(n.plannedSum) }) : '', 'sum')}
        ${row('savings', t('next.savings'), fmt(-n.savings), n.savings ? t('next.savingsNote') : t('next.savingsNone'))}
        ${row('', t('next.daily'), `<span class="${n.daily < 0 ? 'neg' : ''}">${fmt(n.daily)}</span>`, n.daily > 0 ? t('next.dailyNote', { amount: fmt(n.perDay), days: n.days }) : '', 'total')}
      </div>
      ${n.carry < 0 ? `<p class="bank-line"><span>${t('next.carry', { amount: `<b class="neg num">${fmt(n.carry)}</b>` })}</span></p>` : ''}
      <button class="btn block" data-action="new-planned" data-month="${esc(n.month)}">${t('next.add')}</button>
      </div>
    </section>`;
  }

  // ---------- impôts ----------
  const TAX_DEFAULT = { status: 'single', children: 0, salaries: 12, other: 0, communeCoef: null, parishCoef: 0, pillar3a: 0, alimony: null, childcare: null, cantonalOverride: 0 };
  const taxCfg = () => ({ ...TAX_DEFAULT, ...(doc().settings.tax || {}) });
  const fixedYear = (cat) => F.live(doc().fixed).filter((c) => c.cat === cat).reduce((s, c) => s + (+c.amount || 0), 0) * 12;
  function taxInput(c) {
    return {
      salaryNet: (+doc().settings.salary || 0) * (+c.salaries || 12), other: +c.other || 0, status: c.status, children: +c.children || 0,
      alimony: c.alimony == null || c.alimony === '' ? fixedYear('pension') : +c.alimony,
      childcare: c.childcare == null || c.childcare === '' ? fixedYear('garde') : +c.childcare,
      pillar3a: +c.pillar3a || 0, canton: doc().settings.canton || 'FR', communeCoef: c.communeCoef, parishCoef: +c.parishCoef || 0, cantonalOverride: +c.cantonalOverride || 0,
    };
  }
  const taxCharges = () => F.live(doc().fixed).filter((c) => c.cat === 'impots');
  function taxCard() {
    if (!doc().settings.salary) return '';
    const r = T.estimate(taxInput(taxCfg()));
    const planned = taxCharges().reduce((s, c) => s + (+c.amount || 0), 0);
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
    return { status: fd.get('status'), children: n('children') || 0, salaries: +fd.get('salaries') || 12, other: n('other') || 0, alimony: n('alimony'), childcare: n('childcare'), communeCoef: n('communeCoef'), parishCoef: n('parishCoef') || 0, pillar3a: n('pillar3a') || 0, cantonalOverride: n('cantonalOverride') || 0 };
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
        <label class="field">${t('tax.p3a')}<input name="pillar3a" inputmode="decimal" value="${v(c.pillar3a || '')}" placeholder="0"></label>
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

  // ---------- compte et abonnement ----------
  function accountHtml() {
    const cfg = S.config, sess = S.session;
    const planLine = S.plan.tier === 'beta' ? `<p class="hint"><span class="pill beta">Bêta</span> ${t('plan.beta')}</p>`
      : `<p class="small">${t('plan.' + S.plan.tier)}${S.plan.tier === 'free' ? ` · ${t('plan.price', { month: cfg.priceMonth, year: cfg.priceYear })}` : ''}</p>`;
    let auth;
    if (!S.cloud) auth = `<p class="hint">${t('auth.local')} ${t('auth.unavailable')}</p>`;
    else if (sess) auth = `<p class="small">${t('auth.signedIn', { email: esc(sess.email || '') })}</p><div class="row-btns">${S.plan.tier === 'free' ? `<button class="btn primary" data-action="upgrade" data-i="month">${t('plan.upgrade')}</button>` : S.plan.tier === 'pro' ? `<button class="btn" data-action="manage-billing">${t('plan.manage')}</button>` : ''}<button class="btn" data-action="sign-out">${t('auth.signOut')}</button></div>`;
    else auth = `<p class="hint">${t('auth.local')}</p><form id="signIn" class="form"><label class="field">${t('auth.email')}<input name="email" type="email" autocomplete="email" required></label><button class="btn primary block">${t('auth.send')}</button></form>`;
    return `<section class="card form"><h2>${t('set.account')}</h2>${planLine}${auth}</section>`;
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
    openDialog(existing ? t('txd.edit') : t('txd.new'), `<div class="form">
      <div class="seg"><label><input type="radio" name="kind" value="expense" ${!isIncome ? 'checked' : ''}>${t('txd.expense')}</label><label><input type="radio" name="kind" value="income" ${isIncome ? 'checked' : ''}>${t('txd.income')}</label></div>
      <div class="grid2"><label class="field">${t('txd.amount')}<input name="amount" inputmode="decimal" value="${existing ? esc(Math.abs(existing.amount)) : ''}" autocomplete="off"></label>
      <label class="field">${t('txd.date')}<input name="date" type="date" value="${esc(existing ? existing.date : F.today())}"></label></div>
      <label class="field">${t('txd.label')}<input name="label" value="${esc(existing ? existing.label : '')}" autocomplete="off"></label>
      <div class="grid2"><label class="field">${t('txd.cat')}<select name="cat">${catOptions(existing ? existing.cat : 'autre')}</select></label>
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
      else F.addTx(d, { ...data, source: 'manual' });
      save(); toast(t('txd.saved'));
    });
  }

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
    const d = doc(), existing = c && c.id ? c : null;
    openDialog(existing ? t('fixedd.edit') : t('fixedd.new'), `<div class="form">
      <label class="field">${t('fixedd.label')}<input name="label" value="${esc(c ? c.label || '' : '')}" autocomplete="off"></label>
      <div class="grid2"><label class="field">${t('fixedd.amount')}<input name="amount" inputmode="decimal" value="${esc(existing ? existing.amount : '')}" autocomplete="off"></label>
      <label class="field">${t('fixedd.day')}<input name="day" type="number" min="1" max="31" value="${esc(existing && existing.day ? existing.day : '')}"></label></div>
      <label class="field">${t('txd.cat')}<select name="cat">${catOptions(c && c.cat ? c.cat : 'logement')}</select></label>
      <p class="hint">${t('fixedd.hint')}</p></div>`,
    `${existing ? `<button class="btn danger" value="delete">${t('dlg.delete')}</button>` : ''}<button class="btn primary" value="save">${t('dlg.save')}</button>`,
    (action, fd) => {
      const now = Date.now();
      if (action === 'delete') { Object.assign(existing, { deleted: true, updatedAt: now }); save(); return; }
      const label = String(fd.get('label') || '').trim(), amount = F.parseAmount(fd.get('amount'));
      if (!label || !(amount > 0)) { toast(t('fixedd.err')); return true; }
      const data = { label, amount, cat: fd.get('cat'), day: +fd.get('day') || null, updatedAt: now };
      if (existing) Object.assign(existing, data); else d.fixed.push({ id: F.uid(), ...data });
      F.relinkFixed(d);
      save();
    });
  }

  function plannedDialog(x) {
    const d = doc(), per = F.periodFor(d, F.today());
    const nextStart = F.addDays(per.end, 1);
    const months = [per.start, nextStart, F.addMonths(nextStart, 1), F.addMonths(nextStart, 2)].map((m) => m.slice(0, 7));
    const isNew = !x.id;
    openDialog(isNew ? t('planned.title') : t('planned.edit'), `<div class="form">
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
    if (!text) { toast(t('quick.err.empty')); return; }
    quickAdd(text, 'manual');
    inp.value = '';
  });
  function quickAdd(text, source) {
    const d = doc();
    const r = F.parseCommand(text, { learned: d.settings.learned });
    if (!r.ok) { toast(t('quick.err.' + (r.error || 'no-amount'))); return; }
    const acc = accounts().some((a) => a.id === d.settings.defaultAccount) ? d.settings.defaultAccount : null;
    const x = F.addTx(d, { date: r.date, amount: r.amount, label: r.label || catLabel(r.cat), cat: r.cat, accountId: acc, source });
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
    'new-fixed': () => fixedDialog(null),
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
    if (!el.closest('#view') || !el.name) return;
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
      setting({ salary: sal, canton: fd.get('canton') });
    } else if (ev.target.id === 'signIn') {
      ev.preventDefault();
      const email = String(new FormData(ev.target).get('email') || '').trim();
      S.signIn(email).then(() => toast(t('auth.sent', { email }))).catch(() => toast(t('auth.unavailable')));
    }
  });

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
  S.on(() => render());
  S.init();
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.App = { render, getDoc: doc, toast };
})();
