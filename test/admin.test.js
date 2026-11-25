const test = require('node:test');
const assert = require('node:assert');
const M = require('../js/admin-metrics.js');
const DAY = 86400000, now = Date.UTC(2026, 10, 25, 12);
const iso = (d) => new Date(now - d * DAY).toISOString();

test('MRR : mensuel et annuel (1/12), essais et résiliés exclus', () => {
  const data = {
    users: [{ id: 'a', created_at: iso(100) }, { id: 'b', created_at: iso(90) }, { id: 'c', created_at: iso(10) }, { id: 'd', created_at: iso(200) }, { id: 'e', created_at: iso(5) }],
    subscriptions: [
      { user_id: 'a', status: 'active', price_interval: 'month', amount_chf: 4.9 },
      { user_id: 'b', status: 'active', price_interval: 'year', amount_chf: 49 },
      { user_id: 'c', status: 'trialing', price_interval: 'month' },
      { user_id: 'd', status: 'canceled', price_interval: 'month' },
    ],
    events: [
      { user_id: 'a', status: 'active', previous_status: 'trialing', price_interval: 'month', amount_chf: 4.9, at: iso(70) },
      { user_id: 'b', status: 'active', previous_status: 'trialing', price_interval: 'year', amount_chf: 49, at: iso(60) },
      { user_id: 'd', status: 'active', previous_status: 'trialing', price_interval: 'month', amount_chf: 4.9, at: iso(150) },
      { user_id: 'd', status: 'canceled', previous_status: 'active', price_interval: 'month', amount_chf: 4.9, at: iso(10) },
      { user_id: 'c', status: 'trialing', previous_status: null, price_interval: 'month', at: iso(10) },
    ],
    activity: [{ user_id: 'a', updated_at: iso(2), lang: 'fr', canton: 'FR' }, { user_id: 'e', updated_at: iso(1), lang: 'de', canton: 'ZH' }],
  };
  const r = M.compute(data, { now });
  assert.strictEqual(r.kpi.mrr, Math.round((4.9 + 49 / 12) * 100) / 100);
  assert.strictEqual(r.kpi.arr, Math.round(r.kpi.mrr * 12 * 100) / 100);
  assert.deepStrictEqual([r.kpi.paying, r.kpi.trialing, r.kpi.canceled, r.kpi.free, r.kpi.users], [2, 1, 1, 1, 5]);
  assert.strictEqual(r.kpi.payingPrev, 3, 'il y a 30 jours : a, b et d payaient');
  assert.strictEqual(r.kpi.churned30, 1);
  assert.strictEqual(r.kpi.churnRate, 33.33);
  assert.strictEqual(r.kpi.new30, 2);
  assert.strictEqual(r.kpi.active30, 2);
  assert.strictEqual(r.months.length, 12);
  assert.strictEqual(r.months[11].mrr, r.kpi.mrr);
  assert.deepStrictEqual(r.intervals, { month: 1, year: 1 });
  assert.strictEqual(r.rows.find((x) => x.id === 'b').mrr, 4.08);
});
test('données d’exemple : cohérentes et marquées', () => {
  const s = M.sample(now);
  assert.strictEqual(s.sample, true);
  const r = M.compute(s, { now });
  assert.ok(r.kpi.users === 260 && r.kpi.paying > 20 && r.kpi.mrr > 0);
  assert.ok(r.months.every((m) => m.mrr >= 0));
});
