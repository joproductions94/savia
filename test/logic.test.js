const test = require('node:test');
const assert = require('node:assert');
const F = require('../js/logic.js');

function doc(o) {
  const d = F.emptyDoc();
  Object.assign(d.settings, { salary: 4000, payday: 25 }, o && o.settings);
  return d;
}

test('montants et dates', () => {
  assert.strictEqual(F.parseAmount("1'234.50"), 1234.5);
  assert.strictEqual(F.parseAmount('1.234,50'), 1234.5);
  assert.strictEqual(F.parseAmount('-45.-'), -45);
  assert.strictEqual(F.parseAmount('CHF 12'), 12);
  assert.ok(isNaN(F.parseAmount('abc')));
  assert.strictEqual(F.parseDate('21.10.2026'), '2026-10-21');
  assert.strictEqual(F.parseDate('2026-10-21'), '2026-10-21');
  assert.strictEqual(F.parseDate('31.02.2026'), null);
  assert.strictEqual(F.addMonths('2026-01-31', 1), '2026-02-28');
  assert.strictEqual(F.fmt(-1234.5), '−1’234.50 CHF');
});

test('saisie rapide multilingue', () => {
  const t = '2026-11-25';
  const r = F.parseCommand('couches 24.90 coop', { today: t });
  assert.deepStrictEqual([r.amount, r.cat, r.date], [-24.9, 'bebe', t]);
  assert.strictEqual(F.parseCommand('hier 45 Migros', { today: t }).date, '2026-11-24');
  assert.strictEqual(F.parseCommand('Zahnarzt 120 gestern', { today: t }).cat, 'sante');
  assert.strictEqual(F.parseCommand('loyer 1’850', { today: t }).amount, -1850);
  assert.strictEqual(F.parseCommand('18 francs 50 boulangerie', { today: t }).amount, -18.5);
  assert.strictEqual(F.parseCommand('12.11 essence 60', { today: t }).date, '2026-11-12');
  assert.strictEqual(F.parseCommand('remboursement 50', { today: t }).amount, 50);
  assert.strictEqual(F.parseCommand('paysend 350', { today: t, learned: { paysend: 'pension' } }).cat, 'pension');
  assert.strictEqual(F.parseCommand('rien', { today: t }).ok, false);
});

test('répartition : charges réelles, contrat d’investissement, fonds d’urgence', () => {
  const p = F.plan({ salary: 5100, preset: 'famille', fixedCharges: [{ id: 'a', amount: 4264.58, cat: 'logement' }, { id: 'b', amount: 150, cat: 'invest' }] });
  assert.strictEqual(p.env.fixed, 4264.58);
  assert.strictEqual(p.env.invest, 150);
  assert.strictEqual(F.round2(p.env.fixed + p.env.invest + p.env.savings + p.env.daily), 5100);
  const q = F.plan({ salary: 6000, preset: 'famille' });
  assert.strictEqual(q.mode, 'percent');
  assert.ok(q.shifted > 0, 'sans fonds d’urgence, la moitié de l’investissement va à l’épargne');
});

test('mois budgétaire : du salaire reçu au suivant, nommé d’après le mois du salaire', () => {
  const d = doc();
  F.addTx(d, { date: '2026-10-20', amount: 4000, label: 'Employeur', cat: 'revenu' });
  let per = F.periodFor(d, '2026-11-05');
  assert.deepStrictEqual([per.start, per.end, F.salaryMonth(per)], ['2026-10-20', '2026-11-19', '2026-10']);
  F.addTx(d, { date: '2026-11-20', amount: 4000, label: 'Employeur', cat: 'revenu' });
  per = F.periodAt(d, 1, '2026-11-25');
  assert.deepStrictEqual([per.start, per.end], ['2026-10-20', '2026-11-19']);
  const older = F.periodAt(d, 2, '2026-11-25');
  assert.ok(older.end < '2026-10-20', 'pas de chevauchement');
});

test('seuls les paiements faits sont comptés', () => {
  const d = doc({ settings: { salary: 3000 } });
  d.fixed = [{ id: 'loyer', label: 'Loyer', amount: 1000, cat: 'logement' }, { id: 'swl', label: 'Swisslife', amount: 150, cat: 'invest' }];
  F.addTx(d, { date: '2026-10-20', amount: 3000, label: 'Employeur', cat: 'revenu' });
  F.addTx(d, { date: '2026-10-21', amount: -100, label: 'Migros', cat: 'courses' });
  F.addTx(d, { date: '2026-10-21', amount: -500, label: 'Logiciel pro', cat: 'autre', excluded: true });
  let f = F.monthState(d, '2026-10-22').flow;
  assert.deepStrictEqual([f.fixedPaid, f.left, f.pending, f.leftAfterAll], [0, 2900, 1150, 1750]);
  F.addTx(d, { date: '2026-10-22', amount: -1000, label: 'Loyer', cat: 'logement' });
  f = F.monthState(d, '2026-10-22').flow;
  assert.deepStrictEqual([f.fixedPaid, f.left, f.pending, f.leftAfterAll], [1000, 1900, 150, 1750]);
  F.addTx(d, { date: '2026-10-23', amount: -150, label: 'SWISS LIFE SA', cat: 'invest' });
  const st = F.monthState(d, '2026-10-23');
  assert.strictEqual(st.flow.invest.deducted, 150);
  assert.strictEqual(st.flow.pending, 0);
  assert.strictEqual(st.checks.invest.done, true);
});

test('épargne : comptée seulement une fois cochée ; rien proposé quand il ne reste rien', () => {
  const d = doc({ settings: { salary: 3000 } });
  d.fixed = [{ id: 'loyer', label: 'Loyer', amount: 1500, cat: 'logement' }];
  F.addTx(d, { date: '2026-10-20', amount: 3000, label: 'Employeur', cat: 'revenu' });
  let st = F.monthState(d, '2026-10-22');
  assert.strictEqual(st.flow.savings.deducted, 0);
  F.setCheck(d, st.period.start, 'savings', true);
  st = F.monthState(d, '2026-10-22');
  assert.strictEqual(st.flow.savings.deducted, st.flow.savings.planned);
  F.addTx(d, { date: '2026-10-21', amount: -1400, label: 'Divers', cat: 'autre' });
  assert.strictEqual(F.monthState(d, '2026-10-22').flow.savings.planned, 0);
});

test('acomptes de même catégorie sans double comptage', () => {
  const d = doc();
  d.fixed = [{ id: 'imp', label: 'Impôts', amount: 600, cat: 'impots' }, { id: 'lam', label: 'Assurance maladie', amount: 365, cat: 'assurances' }];
  F.addTx(d, { date: '2026-10-20', amount: 4000, label: 'Employeur', cat: 'revenu' });
  F.addTx(d, { date: '2026-10-22', amount: -255, label: 'État de Fribourg', cat: 'impots', env: 'fixed' });
  F.addTx(d, { date: '2026-10-22', amount: -91.3, label: 'Sanitas', cat: 'assurances', env: 'fixed' });
  const st = F.monthState(d, '2026-10-23');
  assert.deepStrictEqual(st.fixed.map((f) => [f.charge.id, f.partial]), [['imp', 255], ['lam', 91.3]]);
  assert.strictEqual(st.flow.fixedPaid, 346.3);
  assert.strictEqual(st.flow.fixedPending, 345 + 273.7);
});

test('dépenses prévues : dans leur mois seulement, payées une fois', () => {
  const d = doc();
  d.fixed = [{ id: 'loyer', label: 'Loyer', amount: 1000, cat: 'logement' }];
  d.planned = [{ id: 'cad', month: '2026-11', label: 'Cadeau', amount: 120, cat: 'cadeaux' }];
  F.addTx(d, { date: '2026-10-20', amount: 4000, label: 'Employeur', cat: 'revenu' });
  assert.strictEqual(F.monthState(d, '2026-11-05').fixed.filter((f) => f.planned).length, 0);
  const nm = F.nextMonth(d, '2026-11-05');
  assert.strictEqual(nm.month, '2026-11');
  assert.strictEqual(nm.plannedSum, 120);
  F.addTx(d, { date: '2026-11-20', amount: 4000, label: 'Employeur', cat: 'revenu' });
  let st = F.monthState(d, '2026-11-21');
  assert.strictEqual(st.flow.pending, 1120);
  F.addTx(d, { date: '2026-11-22', amount: -120, label: 'Cadeau', cat: 'cadeaux', fixedId: 'cad' });
  st = F.monthState(d, '2026-11-23');
  assert.strictEqual(st.flow.fixedPaid, 120);
  assert.strictEqual(st.flow.pending, 1000);
});

test('diviser un paiement : la part loyer paie la charge, le solde ne bouge pas', () => {
  const d = doc();
  d.accounts = [{ id: 'neon', name: 'Neon', kind: 'courant', balance: 2000 }];
  d.fixed = [{ id: 'loyer', label: 'Loyer', amount: 1000, cat: 'logement' }];
  const t = F.addTx(d, { date: '2026-10-22', amount: -1075, label: 'Melanie Alarcon', cat: 'autre', accountId: 'neon' });
  assert.strictEqual(d.accounts[0].balance, 925);
  const parts = F.splitTx(d, t.id, [{ label: 'Loyer', amount: 1000, cat: 'logement' }, { label: 'Crèche', amount: 50, cat: 'garde' }, { label: 'Dette', amount: 25, cat: 'autre' }]);
  assert.strictEqual(parts.length, 3);
  assert.strictEqual(parts[0].fixedId, 'loyer');
  assert.strictEqual(d.accounts[0].balance, 925);
  assert.throws(() => F.splitTx(d, parts[1].id, [{ label: 'a', amount: 10 }, { label: 'b', amount: 10 }]), /split-sum/);
});

test('relevé CSV (Neon) : lecture, doublons, saisie manuelle confirmée, charge fixe, hors budget', () => {
  const csv = '"Date";"Amount";"Original amount";"Original currency";"Exchange rate";"Description";"Subject";"Category";"Tags";"Wise";"Spaces"\n' +
    '"2026-10-20";"4623.80";"";"";"";"KBD Parquets Sarl";"Salaire";"income";"";"no";"no"\n' +
    '"2026-10-21";"-172.96";"";"";"";"EDIBS BUSINESS SCHOOL";"";"education";"";"no";"no"\n' +
    '"2026-10-21";"-16.90";"";"";"";"HBO";"";"entertainment";"";"no";"no"\n' +
    '"2026-10-06";"-19.87";"";"";"";"WINDSOR.AI";"";"shopping";"";"no";"no"\n' +
    '"2026-10-08";"-350.00";"";"";"";"James Ortega";"Comida";"transfers";"";"no";"no"\n';
  const p = F.parseStatement(csv);
  assert.ok(p.ok);
  assert.strictEqual(p.rows.length, 5);
  assert.strictEqual(p.rows[4].label, 'James Ortega · Comida');
  const d = doc();
  d.accounts = [{ id: 'neon', name: 'Neon', kind: 'courant', balance: 0 }];
  d.fixed = [{ id: 'ecole', label: 'École', amount: 172.96, cat: 'formation' }];
  d.settings.excludedWords = { windsor: true };
  F.addTx(d, { date: '2026-10-08', amount: -350, label: 'Comida', cat: 'courses' });
  const rows = F.reconcile(d, 'neon', p.rows);
  assert.strictEqual(rows[1].fixedId, 'ecole');
  assert.strictEqual(rows[3].excluded, true);
  assert.strictEqual(rows[4].dup, 'probable');
  const r = F.applyImport(d, 'neon', rows);
  assert.deepStrictEqual([r.added, r.linked], [4, 1]);
  const again = F.reconcile(d, 'neon', p.rows);
  assert.ok(again.every((x) => x.dup === 'exact'), 'réimporter le même relevé ne crée rien');
});

test('fusion entre appareils : la dernière modification gagne, suppressions comprises', () => {
  const a = doc(), b = doc();
  a.tx = [{ id: '1', label: 'A', amount: -1, date: '2026-10-01', updatedAt: 5 }];
  b.tx = [{ id: '1', label: 'A', amount: -1, date: '2026-10-01', deleted: true, updatedAt: 6 }, { id: '2', label: 'B', amount: -2, date: '2026-10-02', updatedAt: 1 }];
  b.planned = [{ id: 'p', month: '2026-12', label: 'Garage', amount: 300, updatedAt: 1 }];
  const m = F.merge(a, b);
  assert.deepStrictEqual(F.live(m.tx).map((t) => t.id), ['2']);
  assert.strictEqual(F.live(m.planned).length, 1);
  assert.ok(F.sameDoc(m, F.merge(m, a)));
});

test('mois par mois', () => {
  const d = doc();
  F.addTx(d, { date: '2026-09-20', amount: 4000, label: 'Employeur', cat: 'revenu' });
  F.addTx(d, { date: '2026-09-25', amount: -500, label: 'Migros', cat: 'courses' });
  F.addTx(d, { date: '2026-10-20', amount: 4000, label: 'Employeur', cat: 'revenu' });
  F.addTx(d, { date: '2026-10-22', amount: -1000, label: 'Loyer', cat: 'logement' });
  F.addTx(d, { date: '2026-10-23', amount: -99, label: 'Pro', cat: 'autre', excluded: true });
  const h = F.history(d, 6, '2026-11-05');
  assert.deepStrictEqual(h.map((m) => [m.month, m.income, m.spent, m.net]), [['2026-09', 4000, 500, 3500], ['2026-10', 4000, 1000, 3000]]);
});

test('alertes : identifiants seulement (texte traduit par l’interface)', () => {
  const d = doc({ settings: { salary: 3000 } });
  d.fixed = [{ id: 'l', label: 'Loyer', amount: 2900, cat: 'logement' }];
  F.addTx(d, { date: '2026-10-20', amount: 3000, label: 'Employeur', cat: 'revenu' });
  F.addTx(d, { date: '2026-10-21', amount: -300, label: 'Divers', cat: 'autre' });
  const ids = F.alerts(d, '2026-10-22').map((a) => a.id);
  assert.ok(ids.includes('short'));
  assert.ok(ids.includes('big'));
});

test('rythme du quotidien : cumul jour par jour et catégories (hors charges, virements, hors budget)', () => {
  const d = doc();
  d.fixed = [{ id: 'l', label: 'Loyer', amount: 1000, cat: 'logement' }];
  F.addTx(d, { date: '2026-10-20', amount: 4000, label: 'Employeur', cat: 'revenu' });
  F.addTx(d, { date: '2026-10-20', amount: -40, label: 'Migros', cat: 'courses' });
  F.addTx(d, { date: '2026-10-22', amount: -60, label: 'Coop', cat: 'courses' });
  F.addTx(d, { date: '2026-10-22', amount: -25, label: 'Cinéma', cat: 'loisirs' });
  F.addTx(d, { date: '2026-10-22', amount: -1000, label: 'Loyer', cat: 'logement' });
  F.addTx(d, { date: '2026-10-22', amount: -99, label: 'Pro', cat: 'autre', excluded: true });
  const per = F.periodFor(d, '2026-10-23');
  const s = F.dailySeries(d, per, '2026-10-23');
  assert.deepStrictEqual(s.cum, [40, 40, 125, 125]);
  assert.deepStrictEqual(s.byCat, [['courses', 100], ['loisirs', 25]]);
  assert.strictEqual(s.days, 31);
});
