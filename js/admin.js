/* Tableau de bord administrateur : chiffres clés, graphiques et liste des clients. */
(function () {
  'use strict';
  const S = window.Store, M = window.AdminMetrics;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const chf = (v, d = 2) => Math.abs(v).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  const money = (v, d) => (v < 0 ? '−' : '') + chf(v, d);
  const dFmt = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
  const mFmt = new Intl.DateTimeFormat('fr-CH', { month: 'short', timeZone: 'UTC' });
  const mLong = new Intl.DateTimeFormat('fr-CH', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const day = (s) => (s ? dFmt.format(new Date(s)) : '—');
  const STATUS = { active: 'Payant', trialing: 'Essai', past_due: 'Impayé', canceled: 'Résilié', comp: 'Pro offert', free: 'Gratuit' };
  const prices = { month: +(S.config.priceMonth || 4.9), year: +(S.config.priceYear || 49) };
  const view = { q: '', status: 'all', sort: 'created_at', dir: -1, page: 0 };
  let R = null, raw = null, mode = 'sample';

  // ---------- chargement ----------
  async function load() {
    $('#root').innerHTML = '<p class="muted">Chargement…</p>';
    if (!S.cloud) { raw = M.sample(Date.now()); return show('sample'); }
    if (!S.session) return login();
    try {
      await S.sync().catch(() => {});
      const r = await fetch(S.config.supabaseUrl + '/functions/v1/admin', { method: 'POST', headers: { apikey: S.config.supabaseAnonKey, Authorization: 'Bearer ' + S.session.access_token } });
      if (r.status === 403) return message('Accès réservé', `Le compte ${esc(S.session.email || '')} n’est pas administrateur. Ajoutez son adresse au secret ADMIN_EMAILS de la fonction « admin ».`);
      if (r.status === 401) { await S.signOut(); return login(); }
      if (!r.ok) throw new Error(String(r.status));
      raw = await r.json();
      show('live');
    } catch (e) {
      message('Données indisponibles', 'La fonction « admin » ne répond pas. Vérifiez qu’elle est déployée et que ses secrets sont renseignés.');
    }
  }
  function login() {
    $('#root').innerHTML = `<form class="card login" id="login"><h1 style="font-size:1.3rem">Accès administrateur</h1>
      <p class="small muted">Recevez un lien de connexion à l’adresse enregistrée comme administrateur.</p>
      <input name="email" type="email" required autocomplete="email" placeholder="vous@exemple.ch" aria-label="Adresse e-mail">
      <button class="btn primary">Recevoir le lien</button><p class="small muted" id="loginMsg"></p></form>`;
    $('#login').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const email = new FormData(ev.target).get('email');
      try { await S.signIn(email); $('#loginMsg').textContent = `Lien envoyé à ${email}. Ouvrez-le sur cet appareil.`; } catch (e) { $('#loginMsg').textContent = 'Envoi impossible pour le moment.'; }
    });
  }
  function message(title, text) { $('#root').innerHTML = `<div class="card login"><h1 style="font-size:1.3rem">${esc(title)}</h1><p class="muted">${text}</p></div>`; }

  // ---------- rendu ----------
  function show(m) {
    mode = m;
    R = M.compute(raw, { prices });
    const k = R.kpi;
    $('#stamp').textContent = (mode === 'sample' ? 'Exemple · ' : 'Mis à jour ') + new Date(raw.generatedAt).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
    const delta = (v, unit, inverse) => {
      if (v == null || !isFinite(v)) return '';
      const cls = v === 0 ? 'flat' : (v > 0) !== !!inverse ? 'up' : 'down';
      return `<span class="delta ${cls}">${v > 0 ? '▲' : v < 0 ? '▼' : '='} ${v > 0 ? '+' : ''}${unit === 'chf' ? money(v) : v}${unit === 'chf' ? ' CHF' : ''} <span class="muted">sur 30 j</span></span>`;
    };
    const kpi = (label, value, unit, extra) => `<div class="card kpi"><span class="label">${label}</span><span class="value">${value}${unit ? `<small>${unit}</small>` : ''}</span>${extra || ''}</div>`;
    $('#root').innerHTML = `
      ${mode === 'sample' ? '<p class="banner"><b>Données d’exemple.</b> Ce tableau de bord se remplit avec vos vrais clients dès que Supabase est connecté (config.js) et que votre adresse figure dans ADMIN_EMAILS.</p>' : ''}
      <section class="kpis" aria-label="Chiffres clés">
        ${kpi('Revenu mensuel récurrent (MRR)', money(k.mrr), 'CHF', delta(k.mrrDelta, 'chf'))}
        ${kpi('Revenu annuel (ARR)', money(k.arr, 0), 'CHF', `<span class="small muted">MRR × 12</span>`)}
        ${kpi('Abonnés payants', k.paying, '', delta(k.paying - k.payingPrev))}
        ${kpi('En essai', k.trialing, '', `<span class="small muted">${k.trialConversion == null ? 'conversion : pas encore de recul' : `${k.trialConversion} % convertis (90 j)`}</span>`)}
        ${kpi('Utilisateurs', k.users, '', `<span class="small muted">+${k.new30} sur 30 j · ${k.paidShare} % payants · ${k.comp} Pro offert(s)</span>`)}
        ${kpi('Actifs sur 30 jours', k.active30, '', `<span class="small muted">${k.users ? Math.round((k.active30 / k.users) * 100) : 0} % des comptes</span>`)}
        ${kpi('Résiliations (30 j)', `${k.churnRate}`, '%', `<span class="small muted">${k.churned30} client(s) · −${money(k.churnedMrr)} CHF MRR</span>`)}
        ${kpi('Revenu moyen par client (ARPU)', money(k.arpu), 'CHF/mois')}
        ${kpi('Valeur d’un client (LTV)', k.ltv == null ? '—' : money(k.ltv, 0), k.ltv == null ? '' : 'CHF', `<span class="small muted">ARPU ÷ taux de résiliation</span>`)}
        ${kpi('Impayés', k.pastDue, '', `<span class="small muted">${k.canceled} résilié(s) au total</span>`)}
      </section>
      <section class="grid2">
        <div class="card"><div class="card-head"><h2>MRR sur 12 mois</h2><span class="sub">fin de chaque mois, en CHF</span></div><div class="chart" id="chMrr"></div></div>
        <div class="card"><div class="card-head"><h2>Mouvements du MRR</h2><span class="sub">par mois, en CHF</span></div>
          <div class="legend"><span style="--c:var(--s1)">Nouveaux abonnements</span><span style="--c:var(--s2)">Résiliations</span></div><div class="chart" id="chMoves"></div></div>
      </section>
      <section class="grid3">
        <div class="card"><div class="card-head"><h2>Inscriptions</h2><span class="sub">par semaine</span></div><div class="chart" id="chSign"></div></div>
        <div class="card"><div class="card-head"><h2>Statut des comptes</h2><span class="sub">${k.users} comptes</span></div>${statusBlock()}</div>
        <div class="card"><div class="card-head"><h2>Formules payantes</h2><span class="sub">${k.paying} abonnés</span></div>${planBlock()}</div>
      </section>
      <section class="grid3">
        <div class="card"><div class="card-head"><h2>Dernière activité</h2><span class="sub">abonnements</span></div><div class="feed">${feed()}</div></div>
        <div class="card"><div class="card-head"><h2>Langues</h2></div>${barsBlock(R.langs, { fr: 'Français', de: 'Deutsch', it: 'Italiano' })}</div>
        <div class="card"><div class="card-head"><h2>Cantons</h2></div>${barsBlock(R.cantons.slice(0, 8))}</div>
      </section>
      <section>
        <div class="card"><div class="card-head"><h2>Clients</h2><span class="sub" id="countRows"></span></div>
          <div class="tools"><input type="search" id="q" placeholder="Rechercher un e-mail" aria-label="Rechercher un e-mail" value="${esc(view.q)}">
            ${['all', 'active', 'trialing', 'past_due', 'canceled', 'comp', 'free'].map((s) => `<button class="chip" data-status="${s}" aria-pressed="${view.status === s}">${s === 'all' ? 'Tous' : STATUS[s]}</button>`).join('')}</div>
          <div class="table" id="tbl"></div></div>
      </section>`;
    lineChart($('#chMrr'), R.months.map((m) => ({ x: m.month, y: m.mrr, tip: `<b>${mLong.format(new Date(m.month + '-01T00:00:00Z'))}</b><br>MRR ${money(m.mrr)} CHF<br>${m.paying} abonné(s)` })));
    divChart($('#chMoves'), R.months);
    barChart($('#chSign'), R.weeks.map((w) => ({ x: w.end, y: w.signups, tip: `<b>Semaine du ${day(new Date(Date.parse(w.end) - 6 * 86400000))}</b><br>${w.signups} inscription(s)` })));
    table();
  }

  function statusBlock() {
    const order = ['active', 'trialing', 'past_due', 'canceled', 'comp', 'free'];
    const col = { active: 'var(--good)', trialing: 'var(--s1)', past_due: 'var(--warn)', canceled: 'var(--bad)', comp: 'var(--s2)', free: 'var(--faint)' };
    const n = Object.fromEntries(R.statuses);
    const total = R.rows.length || 1;
    return `<div class="seg" role="img" aria-label="Répartition des statuts">${order.filter((s) => n[s]).map((s) => `<i style="flex:${n[s]};background:${col[s]}" title="${STATUS[s]} : ${n[s]}"></i>`).join('')}</div>
      <div class="bars">${order.map((s) => `<div class="b"><span class="pill ${s}">${STATUS[s]}</span><span class="track"><i style="width:${((n[s] || 0) / total) * 100}%;background:${col[s]}"></i></span><span class="num">${n[s] || 0}</span></div>`).join('')}</div>`;
  }
  function planBlock() {
    const { month, year } = R.intervals, t = month + year || 1;
    const mrrM = month * prices.month, mrrY = year * (prices.year / 12);
    return `<div class="seg" role="img" aria-label="Mensuel ${month}, annuel ${year}"><i style="flex:${month || 0.0001};background:var(--s1)"></i><i style="flex:${year || 0.0001};background:var(--s2)"></i></div>
      <div class="legend" style="margin-bottom:10px"><span style="--c:var(--s1)">Mensuel ${prices.month.toFixed(2)}</span><span style="--c:var(--s2)">Annuel ${prices.year}</span></div>
      <div class="bars"><div class="b"><span>Mensuel</span><span class="track"><i style="width:${(month / t) * 100}%"></i></span><span class="num">${month} · ${money(mrrM)} CHF</span></div>
      <div class="b"><span>Annuel</span><span class="track"><i style="width:${(year / t) * 100}%;background:var(--s2)"></i></span><span class="num">${year} · ${money(mrrY)} CHF</span></div></div>
      <p class="small muted" style="margin-top:10px">Montants en MRR : un abonnement annuel compte pour 1/12 par mois.</p>`;
  }
  function barsBlock(list, names) {
    if (!list.length) return '<p class="small muted">Pas encore de données.</p>';
    const max = Math.max(...list.map((x) => x[1]));
    return `<div class="bars">${list.map(([k, v]) => `<div class="b"><span>${esc((names && names[k]) || k)}</span><span class="track"><i style="width:${(v / max) * 100}%"></i></span><span class="num">${v}</span></div>`).join('')}</div>`;
  }
  function feed() {
    if (!R.recent.length) return '<p class="small muted">Aucun événement pour l’instant.</p>';
    const label = (e) => e.status === 'active' && e.previous_status === 'trialing' ? 'Essai converti' : e.status === 'active' ? 'Abonnement actif' : e.status === 'trialing' ? 'Essai démarré' : e.status === 'canceled' ? (e.previous_status === 'trialing' ? 'Essai non converti' : 'Résiliation') : e.status === 'past_due' ? 'Paiement en échec' : e.status;
    return R.recent.slice(0, 8).map((e) => `<div><span class="pill ${e.status === 'trialing' ? 'trialing' : e.status === 'active' ? 'active' : e.status === 'past_due' ? 'past_due' : 'canceled'}">${esc(label(e))}</span><span class="who">${esc(e.email)}</span><span class="small muted">${day(e.at)}</span></div>`).join('');
  }

  // ---------- tableau des clients ----------
  function filtered() {
    const q = view.q.trim().toLowerCase();
    return R.rows.filter((r) => (view.status === 'all' || r.status === view.status) && (!q || r.email.toLowerCase().includes(q)))
      .sort((a, b) => { const x = a[view.sort], y = b[view.sort]; return (x == null) - (y == null) || (x < y ? -1 : x > y ? 1 : 0) * view.dir; });
  }
  function table() {
    const list = filtered(), per = 25, pages = Math.max(1, Math.ceil(list.length / per));
    view.page = Math.min(view.page, pages - 1);
    const rows = list.slice(view.page * per, view.page * per + per);
    const th = (key, label, cls) => `<th scope="col" class="${cls || ''}"><button data-sort="${key}">${label}${view.sort === key ? (view.dir < 0 ? ' ↓' : ' ↑') : ''}</button></th>`;
    $('#countRows').textContent = `${list.length} sur ${R.rows.length}`;
    $('#tbl').innerHTML = `<table><thead><tr>${th('email', 'E-mail')}${th('status', 'Statut')}${th('interval', 'Formule')}${th('mrr', 'MRR', 'r')}${th('created_at', 'Inscription')}${th('last_seen', 'Dernière activité')}${th('renews', 'Échéance')}${th('canton', 'Canton')}<th scope="col" class="r">Pro offert</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.email)}</td><td><span class="pill ${r.status in STATUS ? r.status : 'free'}">${STATUS[r.status] || esc(r.status)}</span></td>
      <td>${r.interval === 'year' ? 'Annuel' : r.interval === 'month' ? 'Mensuel' : '—'}</td><td class="r num">${r.mrr ? money(r.mrr) : '—'}</td><td>${day(r.created_at)}</td><td>${day(r.last_seen)}</td>
      <td>${r.status === 'trialing' ? 'fin d’essai ' + day(r.trial_end) : r.status === 'active' || r.status === 'past_due' ? day(r.renews) : '—'}</td><td>${esc(r.canton || '—')}</td><td class="r">${compCell(r)}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">Aucun client ne correspond.</td></tr>'}</tbody></table>
      <div class="pager"><span>Page ${view.page + 1} / ${pages}</span><span><button class="btn" data-page="-1" ${view.page === 0 ? 'disabled' : ''}>Précédent</button> <button class="btn" data-page="1" ${view.page >= pages - 1 ? 'disabled' : ''}>Suivant</button></span></div>`;
  }

  function compCell(r) {
    if (r.owner) return '<span class="small muted">propriétaire</span>';
    const note = r.compNote ? `<span class="small muted">${esc(r.compNote)}</span> ` : '';
    return r.comp ? `${note}<button class="btn small" data-comp="${esc(r.id)}" data-on="0">Retirer</button>` : `<button class="btn small" data-comp="${esc(r.id)}" data-on="1">Offrir Pro</button>`;
  }
  async function setComp(id, on) {
    const row = R.rows.find((x) => x.id === id);
    if (!row) return;
    let note = '';
    if (on) { note = prompt(`Offrir Pro à ${row.email} ? Note facultative (famille, testeur…)`, ''); if (note === null) return; }
    else if (!confirm(`Retirer le Pro offert à ${row.email} ?`)) return;
    if (mode === 'sample') { // exemple : modifie seulement les données affichées
      const s0 = raw.subscriptions.find((x) => x.user_id === id);
      if (s0) Object.assign(s0, { comp: on, comp_note: on ? note || null : null }); else raw.subscriptions.push({ user_id: id, status: 'none', comp: on, comp_note: note || null });
      return show('sample');
    }
    try {
      const r = await fetch(S.config.supabaseUrl + '/functions/v1/admin', { method: 'POST', headers: { apikey: S.config.supabaseAnonKey, Authorization: 'Bearer ' + S.session.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'comp', userId: id, on, note }) });
      if (!r.ok) throw new Error(String(r.status));
      await load();
    } catch (e) { alert('Modification impossible pour le moment.'); }
  }

  // ---------- graphiques (SVG, une seule échelle, survol avec info-bulle) ----------
  let W = 640;
  const PAD = { l: 52, r: 12, t: 12, b: 26 };
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function frame(el, H, yMin, yMax, labels, fmt) {
    const ih = H - PAD.t - PAD.b, iw = W - PAD.l - PAD.r;
    const y = (v) => PAD.t + ih - ((v - yMin) / (yMax - yMin || 1)) * ih;
    const ticks = yMin < 0 ? [yMin, 0, yMax] : [0, yMax / 2, yMax];
    let g = ticks.map((v) => `<line class="${v === 0 ? 'base' : 'gridl'}" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${PAD.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('');
    const step = iw / labels.length;
    labels.forEach((l, i) => { if (labels.length <= 12 || i % 2 === 0) g += `<text class="axis" x="${PAD.l + step * i + step / 2}" y="${H - 8}" text-anchor="middle">${l}</text>`; });
    return { y, step, ih, iw, g };
  }
  function attachTips(el) {
    const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; el.appendChild(tip);
    const svg = el.querySelector('svg'), cross = svg.querySelector('.cross'), vw = +svg.viewBox.baseVal.width;
    const on = (ev) => {
      const h = ev.target.closest('.hit'); if (!h) return;
      const box = el.getBoundingClientRect(), sb = svg.getBoundingClientRect(), k = sb.width / vw;
      tip.innerHTML = h.dataset.tip; tip.hidden = false;
      tip.style.left = Math.min(box.width - 70, Math.max(70, (+h.dataset.cx) * k)) + 'px';
      tip.style.top = (+h.dataset.cy) * k + 'px';
      if (cross) { cross.setAttribute('x1', h.dataset.cx); cross.setAttribute('x2', h.dataset.cx); cross.style.display = ''; }
    };
    svg.addEventListener('pointermove', on); svg.addEventListener('pointerdown', on);
    svg.addEventListener('pointerleave', () => { tip.hidden = true; if (cross) cross.style.display = 'none'; });
  }
  function lineChart(el, pts) {
    W = el.clientWidth < 520 ? 380 : 640; const H = el.clientWidth < 520 ? 240 : 230, max = niceMax(Math.max(...pts.map((p) => p.y)) * 1.1);
    const f = frame(el, H, 0, max, pts.map((p) => mFmt.format(new Date(p.x + '-01T00:00:00Z')).replace('.', '')), (v) => chf(v, 0));
    const xs = pts.map((p, i) => PAD.l + f.step * i + f.step / 2);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${xs[i].toFixed(1)} ${f.y(p.y).toFixed(1)}`).join(' ');
    const area = `${line} L${xs[xs.length - 1].toFixed(1)} ${f.y(0)} L${xs[0].toFixed(1)} ${f.y(0)} Z`;
    const last = pts[pts.length - 1];
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="MRR sur 12 mois, actuellement ${money(last.y)} CHF">${f.g}
      <path d="${area}" fill="var(--s1)" fill-opacity=".12"/><path d="${line}" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <line class="cross" y1="${PAD.t}" y2="${H - PAD.b}" style="display:none"/>
      <circle cx="${xs[xs.length - 1]}" cy="${f.y(last.y)}" r="5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>
      <text class="axis" x="${xs[xs.length - 1] - 8}" y="${f.y(last.y) - 10}" text-anchor="end" style="fill:var(--ink);font-weight:700">${money(last.y)}</text>
      ${pts.map((p, i) => `<rect class="hit" x="${xs[i] - f.step / 2}" y="${PAD.t}" width="${f.step}" height="${f.ih}" data-cx="${xs[i]}" data-cy="${f.y(p.y)}" data-tip="${esc(p.tip)}"/>`).join('')}</svg>`;
    attachTips(el);
  }
  function barChart(el, pts) {
    W = 360; const H = 220, max = niceMax(Math.max(1, ...pts.map((p) => p.y)));
    const f = frame(el, H, 0, max, pts.map((p, i) => (i % 3 === 2 ? new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short' }).format(new Date(p.x)).replace('.', '') : '')), (v) => Math.round(v));
    const bw = Math.min(26, f.step * 0.6);
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Inscriptions par semaine">${f.g}
      ${pts.map((p, i) => { const cx = PAD.l + f.step * i + f.step / 2, y0 = f.y(0), y1 = f.y(p.y), h = Math.max(0, y0 - y1); return `${h ? `<path d="M${cx - bw / 2} ${y0} V${y1 + Math.min(4, h)} Q${cx - bw / 2} ${y1} ${cx - bw / 2 + 4} ${y1} H${cx + bw / 2 - 4} Q${cx + bw / 2} ${y1} ${cx + bw / 2} ${y1 + Math.min(4, h)} V${y0} Z" fill="var(--s1)"/>` : ''}<rect class="hit" x="${cx - f.step / 2}" y="${PAD.t}" width="${f.step}" height="${f.ih}" data-cx="${cx}" data-cy="${y1}" data-tip="${esc(p.tip)}"/>`; }).join('')}</svg>`;
    attachTips(el);
  }
  function divChart(el, months) {
    W = el.clientWidth < 520 ? 380 : 480; const H = 250;
    const top = niceMax(Math.max(1, ...months.map((m) => m.newMrr))), bot = niceMax(Math.max(1, ...months.map((m) => m.churnedMrr)));
    const f = frame(el, H, -bot, top, months.map((m) => mFmt.format(new Date(m.month + '-01T00:00:00Z')).replace('.', '')), (v) => (v < 0 ? '−' : '') + chf(Math.abs(v), 0));
    const bw = Math.min(14, f.step * 0.32);
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Nouveaux abonnements et résiliations par mois, en CHF de MRR">${f.g}
      ${months.map((m, i) => {
        const cx = PAD.l + f.step * i + f.step / 2, z = f.y(0), up = f.y(m.newMrr), dn = f.y(-m.churnedMrr);
        const tip = `<b>${mLong.format(new Date(m.month + '-01T00:00:00Z'))}</b><br><i style="background:var(--s1)"></i>Nouveaux +${money(m.newMrr)} CHF<br><i style="background:var(--s2)"></i>Résiliations −${money(m.churnedMrr)} CHF<br>Net ${money(m.newMrr - m.churnedMrr)} CHF`;
        return `${m.newMrr ? `<rect x="${cx - bw - 1}" y="${up}" width="${bw}" height="${Math.max(1, z - up)}" rx="3" fill="var(--s1)"/>` : ''}${m.churnedMrr ? `<rect x="${cx + 1}" y="${z}" width="${bw}" height="${Math.max(1, dn - z)}" rx="3" fill="var(--s2)"/>` : ''}<rect class="hit" x="${cx - f.step / 2}" y="${PAD.t}" width="${f.step}" height="${f.ih}" data-cx="${cx}" data-cy="${up}" data-tip="${esc(tip)}"/>`;
      }).join('')}</svg>`;
    attachTips(el);
  }

  // ---------- interactions ----------
  document.addEventListener('input', (ev) => { if (ev.target.id === 'q') { view.q = ev.target.value; view.page = 0; table(); } });
  document.addEventListener('click', (ev) => {
    const st = ev.target.closest('[data-status]');
    if (st) { view.status = st.dataset.status; view.page = 0; document.querySelectorAll('[data-status]').forEach((b) => b.setAttribute('aria-pressed', b === st)); table(); return; }
    const so = ev.target.closest('[data-sort]');
    if (so) { const k = so.dataset.sort; view.dir = view.sort === k ? -view.dir : k === 'email' ? 1 : -1; view.sort = k; table(); return; }
    const cp = ev.target.closest('[data-comp]');
    if (cp) { setComp(cp.dataset.comp, cp.dataset.on === '1'); return; }
    const pg = ev.target.closest('[data-page]');
    if (pg) { view.page += +pg.dataset.page; table(); }
  });
  $('#refresh').addEventListener('click', load);
  $('#exportBtn').addEventListener('click', () => {
    if (!R) return;
    const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const lines = ['email;statut;formule;mrr_chf;inscription;derniere_activite;echeance;canton;langue'].concat(filtered().map((r) => [q(r.email), r.status, r.interval || '', r.mrr.toFixed(2), r.created_at || '', r.last_seen || '', r.renews || '', r.canton || '', r.lang || ''].join(';')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `${S.config.slug || 'app'}-clients-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
  });

  S.init();
  load();
})();
