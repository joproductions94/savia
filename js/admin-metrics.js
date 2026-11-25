/* Franko — métriques SaaS calculées à partir des données brutes de la fonction « admin ».
   Entrée : { users, subscriptions, events, activity } ; aucune donnée budgétaire. Fonctions pures, testées sous Node. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const r2 = (x) => Math.round(x * 100) / 100;
  const ts = (s) => (s ? Date.parse(s) : NaN);
  const PAYING = new Set(['active', 'past_due']);

  // Valeur mensuelle d'un abonnement (un abonnement annuel compte pour 1/12 par mois).
  function monthly(interval, amount, prices) {
    const p = prices || { month: 4.9, year: 49 };
    const a = amount != null && isFinite(+amount) ? +amount : interval === 'year' ? p.year : p.month;
    return interval === 'year' ? a / 12 : a;
  }

  // État de chaque utilisateur à une date, d'après l'historique des événements.
  function stateAt(events, at) {
    const state = new Map();
    for (const e of events) { if (ts(e.at) <= at) state.set(e.user_id, e); else break; }
    return state;
  }
  function mrrAt(events, at, prices) {
    let m = 0, n = 0;
    for (const e of stateAt(events, at).values()) if (e.status === 'active') { m += monthly(e.price_interval, e.amount_chf, prices); n++; }
    return { mrr: r2(m), paying: n };
  }
  const monthEnd = (y, m) => Date.UTC(y, m + 1, 1) - 1;

  function compute(data, opts) {
    const o = opts || {};
    const now = o.now != null ? o.now : Date.now();
    const prices = o.prices || { month: 4.9, year: 49 };
    const users = data.users || [], subs = data.subscriptions || [], activity = data.activity || [];
    const events = (data.events || []).slice().sort((a, b) => ts(a.at) - ts(b.at));
    const subBy = new Map(subs.map((s) => [s.user_id, s]));
    const actBy = new Map(activity.map((a) => [a.user_id, a]));

    // --- situation actuelle (table subscriptions, qui fait foi) ---
    let mrr = 0;
    const count = { active: 0, trialing: 0, past_due: 0, canceled: 0, free: 0, comp: 0 };
    const isOwner = (u) => (data.admins || []).includes(String(u.email || '').toLowerCase());
    const intervals = { month: 0, year: 0 };
    for (const u of users) {
      const s = subBy.get(u.id);
      let st = s && s.status && s.status !== 'none' ? s.status : 'free';
      if ((s && s.comp || isOwner(u)) && st !== 'active' && st !== 'trialing') st = 'comp';
      if (st === 'active') { mrr += monthly(s.price_interval, s.amount_chf, prices); intervals[s.price_interval === 'year' ? 'year' : 'month']++; }
      if (st in count) count[st]++; else if (st === 'unpaid' || st === 'incomplete' || st === 'incomplete_expired') count.past_due++; else count.free++;
    }
    mrr = r2(mrr);
    const paying = count.active;

    // --- il y a 30 jours (historique) ---
    const before = mrrAt(events, now - 30 * DAY, prices);
    // résiliations sur 30 jours : passage d'un statut payant à « canceled »
    const churned = events.filter((e) => ts(e.at) > now - 30 * DAY && ts(e.at) <= now && e.status === 'canceled' && PAYING.has(e.previous_status));
    const churnedMrr = r2(churned.reduce((s, e) => s + monthly(e.price_interval, e.amount_chf, prices), 0));
    const churnRate = before.paying > 0 ? churned.length / before.paying : 0;
    const newPaid = events.filter((e) => ts(e.at) > now - 30 * DAY && ts(e.at) <= now && e.status === 'active' && !PAYING.has(e.previous_status));
    // conversion des essais terminés sur 90 jours
    const trialEnds = events.filter((e) => ts(e.at) > now - 90 * DAY && ts(e.at) <= now && e.previous_status === 'trialing' && e.status !== 'trialing');
    const converted = trialEnds.filter((e) => e.status === 'active').length;

    const arpu = paying ? r2(mrr / paying) : 0;
    const ltv = churnRate > 0 ? r2(arpu / churnRate) : null;
    const isActive = (u) => {
      const a = actBy.get(u.id);
      return (a && ts(a.updated_at) > now - 30 * DAY) || ts(u.last_sign_in_at) > now - 30 * DAY;
    };
    const active30 = users.filter(isActive).length;
    const new30 = users.filter((u) => ts(u.created_at) > now - 30 * DAY).length;
    const newPrev30 = users.filter((u) => ts(u.created_at) > now - 60 * DAY && ts(u.created_at) <= now - 30 * DAY).length;

    // --- séries ---
    const d = new Date(now);
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const y = d.getUTCFullYear(), m = d.getUTCMonth() - i;
      const end = i === 0 ? now : monthEnd(y, m);
      const start = Date.UTC(y, m, 1);
      const at = mrrAt(events, end, prices);
      const inMonth = events.filter((e) => ts(e.at) >= start && ts(e.at) <= end);
      months.push({
        month: new Date(start).toISOString().slice(0, 7),
        mrr: i === 0 ? mrr : at.mrr,
        paying: i === 0 ? paying : at.paying,
        newMrr: r2(inMonth.filter((e) => e.status === 'active' && !PAYING.has(e.previous_status)).reduce((s, e) => s + monthly(e.price_interval, e.amount_chf, prices), 0)),
        churnedMrr: r2(inMonth.filter((e) => e.status === 'canceled' && PAYING.has(e.previous_status)).reduce((s, e) => s + monthly(e.price_interval, e.amount_chf, prices), 0)),
        signups: users.filter((u) => ts(u.created_at) >= start && ts(u.created_at) <= end).length,
      });
    }
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const end = now - i * 7 * DAY, start = end - 7 * DAY;
      weeks.push({ end: new Date(end).toISOString().slice(0, 10), signups: users.filter((u) => ts(u.created_at) > start && ts(u.created_at) <= end).length });
    }
    const tally = (list, key) => {
      const out = {};
      for (const x of list) { const k = (x && x[key]) || '—'; out[k] = (out[k] || 0) + 1; }
      return Object.entries(out).sort((a, b) => b[1] - a[1]);
    };

    // --- liste des clients ---
    const rows = users.map((u) => {
      const s = subBy.get(u.id) || {};
      const a = actBy.get(u.id) || {};
      let status = s.status && s.status !== 'none' ? s.status : 'free';
      const owner = isOwner(u);
      if ((s.comp || owner) && status !== 'active' && status !== 'trialing') status = 'comp';
      return {
        comp: !!s.comp, owner, compNote: s.comp_note || null,
        id: u.id, email: u.email || '', created_at: u.created_at, last_seen: [a.updated_at, u.last_sign_in_at].filter(Boolean).sort().pop() || null,
        status, interval: s.price_interval || null, mrr: status === 'active' ? r2(monthly(s.price_interval, s.amount_chf, prices)) : 0,
        renews: s.current_period_end || null, trial_end: s.trial_end || null, canceled_at: s.canceled_at || null, lang: a.lang || null, canton: a.canton || null,
      };
    }).sort((x, y) => ts(y.created_at) - ts(x.created_at));

    const recent = events.slice(-30).reverse().map((e) => ({ ...e, email: (users.find((u) => u.id === e.user_id) || {}).email || '' }));

    return {
      now, kpi: {
        mrr, arr: r2(mrr * 12), mrrPrev: before.mrr, mrrDelta: r2(mrr - before.mrr), paying, payingPrev: before.paying,
        trialing: count.trialing, pastDue: count.past_due, canceled: count.canceled, free: count.free, comp: count.comp, users: users.length,
        new30, newPrev30, active30, arpu, ltv, churnRate: r2(churnRate * 100), churned30: churned.length, churnedMrr, newPaid30: newPaid.length,
        trialConversion: trialEnds.length ? Math.round((converted / trialEnds.length) * 100) : null, trialEnded90: trialEnds.length,
        paidShare: users.length ? Math.round((paying / users.length) * 100) : 0,
      },
      intervals, months, weeks, langs: tally(rows, 'lang'), cantons: tally(rows, 'canton'), statuses: tally(rows, 'status'), rows, recent,
    };
  }

  // Données d'exemple déterministes, clairement marquées comme telles dans l'interface.
  function sample(now) {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const users = [], subscriptions = [], events = [], activity = [];
    const N = 260;
    for (let i = 0; i < N; i++) {
      const created = now - Math.floor(Math.pow(rnd(), 0.8) * 330) * DAY - Math.floor(rnd() * DAY);
      const id = 'u' + i;
      users.push({ id, email: `client${String(i + 1).padStart(3, '0')}@exemple.ch`, created_at: new Date(created).toISOString(), last_sign_in_at: new Date(created + rnd() * (now - created)).toISOString() });
      activity.push({ user_id: id, updated_at: new Date(created + Math.sqrt(rnd()) * (now - created)).toISOString(), lang: pick(['fr', 'fr', 'fr', 'de', 'de', 'it']), canton: pick(['FR', 'VD', 'GE', 'BE', 'ZH', 'NE', 'VS', 'TI', 'FR', 'VD']) });
      if (rnd() < 0.42) {
        const interval = rnd() < 0.3 ? 'year' : 'month';
        const amount = interval === 'year' ? 49 : 4.9;
        const t0 = created + Math.floor(rnd() * 5) * DAY;
        const ev = (status, prev, at) => { if (at <= now) events.push({ user_id: id, status, previous_status: prev, price_interval: interval, amount_chf: amount, at: new Date(at).toISOString() }); };
        ev('trialing', null, t0);
        let status = 'trialing';
        const tEnd = t0 + 30 * DAY;
        if (tEnd <= now) {
          if (rnd() < 0.68) {
            ev('active', 'trialing', tEnd); status = 'active';
            const cancelAt = tEnd + Math.floor(rnd() * 400) * DAY;
            if (rnd() < 0.3 && cancelAt <= now) { ev('canceled', 'active', cancelAt); status = 'canceled'; }
            else if (rnd() < 0.04) { ev('past_due', 'active', now - Math.floor(rnd() * 10) * DAY); status = 'past_due'; }
          } else { ev('canceled', 'trialing', tEnd); status = 'canceled'; }
        }
        subscriptions.push({ user_id: id, status, price_interval: interval, amount_chf: amount, created_at: new Date(t0).toISOString(), trial_end: new Date(tEnd).toISOString(), current_period_end: new Date(now + Math.floor(rnd() * 30) * DAY).toISOString(), canceled_at: status === 'canceled' ? new Date(now - rnd() * 90 * DAY).toISOString() : null });
      }
    }
    // le compte propriétaire et quelques Pro offerts (famille, testeurs)
    users.unshift({ id: 'owner', email: 'proprietaire@exemple.ch', created_at: new Date(now - 330 * DAY).toISOString(), last_sign_in_at: new Date(now - DAY).toISOString() });
    activity.push({ user_id: 'owner', updated_at: new Date(now - 3600e3).toISOString(), lang: 'fr', canton: 'FR' });
    for (const i of [3, 17, 41]) { const id = 'u' + i; const s0 = subscriptions.find((x) => x.user_id === id); if (s0) Object.assign(s0, { comp: true, comp_note: 'Testeur' }); else subscriptions.push({ user_id: id, status: 'none', comp: true, comp_note: 'Famille' }); }
    return { generatedAt: new Date(now).toISOString(), sample: true, admins: ['proprietaire@exemple.ch'], users, subscriptions, events, activity };
  }

  const M = { compute, monthly, mrrAt, sample };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else root.AdminMetrics = M;
})(typeof globalThis !== 'undefined' ? globalThis : this);
