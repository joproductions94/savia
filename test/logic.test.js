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
  d.fixed = [{ id: 'loyer', label: 'Loyer', amount: 1000, cat: 'logement' }, { id: 'swl', label: 'Prévoyance Exemple', amount: 150, cat: 'invest' }];
  F.addTx(d, { date: '2026-10-20', amount: 3000, label: 'Employeur', cat: 'revenu' });
  F.addTx(d, { date: '2026-10-21', amount: -100, label: 'Migros', cat: 'courses' });
  F.addTx(d, { date: '2026-10-21', amount: -500, label: 'Logiciel pro', cat: 'autre', excluded: true });
  let f = F.monthState(d, '2026-10-22').flow;
  assert.deepStrictEqual([f.fixedPaid, f.left, f.pending, f.leftAfterAll], [0, 2900, 1150, 1750]);
  F.addTx(d, { date: '2026-10-22', amount: -1000, label: 'Loyer', cat: 'logement' });
  f = F.monthState(d, '2026-10-22').flow;
  assert.deepStrictEqual([f.fixedPaid, f.left, f.pending, f.leftAfterAll], [1000, 1900, 150, 1750]);
  F.addTx(d, { date: '2026-10-23', amount: -150, label: 'PREVOYANCE EXEMPLE SA', cat: 'invest' });
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
    '"2026-10-20";"4623.80";"";"";"";"Exemple SA";"Salaire";"income";"";"no";"no"\n' +
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

test('rentrées : reconnues dans les trois langues, ou forcées', () => {
  const t = '2026-11-25';
  for (const s of ['reçu 200 de Paul', 'vente vélo 150', 'Rückerstattung 80', 'Einnahme 50', 'rimborso 30', 'entrata 70', '+ 45 TWINT']) assert.ok(F.parseCommand(s, { today: t }).amount > 0, s);
  assert.ok(F.parseCommand('migros 20', { today: t, kind: 'income' }).amount === 20);
  assert.ok(F.parseCommand('remboursement 20', { today: t, kind: 'expense' }).amount === -20);
});

test('Apple Pay / Wallet : un paiement reçu par lien est ajouté une seule fois et confirmé par le relevé', () => {
  const d = doc();
  d.accounts = [{ id: 'n', name: 'Compte courant', kind: 'courant', balance: 100 }];
  d.settings.defaultAccount = 'n';
  const p = new URLSearchParams('amount=CHF%2012,50&merchant=Migros%20Centre&card=Visa&date=2026-11-24');
  const item = F.parseIngest(p, { today: '2026-11-25' });
  assert.deepStrictEqual([item.amount, item.cat, item.date, item.source], [-12.5, 'courses', '2026-11-24', 'wallet']);
  const x = F.ingest(d, item);
  assert.ok(x);
  assert.strictEqual(F.ingest(d, F.parseIngest(p, { today: '2026-11-25' })), null, 'doublon ignoré');
  assert.strictEqual(d.accounts[0].balance, 87.5);
  assert.strictEqual(F.parseIngest({ amount: '' }).ok, false);
  const rows = F.reconcile(d, 'n', [{ date: '2026-11-25', amount: -12.5, label: 'MIGROS CENTRE' }]);
  assert.strictEqual(rows[0].dup, 'probable');
});

test('la devise écrite après le montant ne reste pas dans le libellé', () => {
  for (const q of ['essence 70 fr.', 'essence 70 fr', 'essence 70 CHF', 'essence 70 francs']) {
    const r = F.parseCommand(q, { today: '2026-11-25' });
    assert.equal(r.amount, -70); assert.equal(r.label, 'Essence');
  }
  assert.equal(F.parseCommand('Fromagerie 12', { today: '2026-11-25' }).label, 'Fromagerie');
});

// ---------- factures annuelles, 3e pilier, économies ----------
function baseDoc() {
  const d = F.emptyDoc();
  Object.assign(d.settings, { salary: 6000, payday: 25, canton: 'FR', updatedAt: 1 });
  d.fixed = [{ id: 'loyer', label: 'Loyer', amount: 1800, cat: 'logement', updatedAt: 1 }];
  return d;
}

test('facture annuelle : un douzième réservé chaque mois, rien à payer hors échéance', () => {
  const d = baseDoc();
  d.fixed.push({ id: 'serafe', label: 'Serafe', amount: 335, cat: 'logement', freq: 'year', dueMonth: 4, updatedAt: 1 });
  const st = F.monthState(d, '2026-11-26');
  assert.equal(st.plan.provision, 27.92);
  assert.equal(st.flow.provision, 27.92);
  assert.ok(!st.fixed.some((f) => f.charge.id === 'serafe'), 'pas dans les charges de novembre');
  assert.equal(st.flow.fixedPending, 1800);
  assert.equal(st.flow.after, round(6000 - 27.92));
});

test('facture annuelle au mois d’échéance : la réserve paie, seul le manque compte', () => {
  const d = baseDoc();
  // réserve commencée en février : février, mars, avril = 3/12 de 1200
  d.fixed.push({ id: 'rc', label: 'Assurance ménage RC', amount: 1200, cat: 'assurances', freq: 'year', dueMonth: 4, since: '2026-02', updatedAt: 1 });
  let st = F.monthState(d, '2026-04-26');
  const f = st.fixed.find((x) => x.charge.id === 'rc');
  assert.equal(f.covered, 300); assert.equal(f.short, 900);
  assert.equal(st.flow.fixedPending, 1800 + 900);
  F.addTx(d, { date: '2026-04-27', amount: -1200, label: 'Assurance ménage RC', cat: 'assurances', fixedId: 'rc' }, 2);
  st = F.monthState(d, '2026-04-27');
  assert.equal(st.flow.fixedPaid, 900, 'seule la part non réservée sort du mois');
  // l'année suivante, la réserve est pleine : rien ne pèse sur avril
  st = F.monthState(d, '2027-04-26');
  assert.equal(st.fixed.find((x) => x.charge.id === 'rc').short, 0);
});

test('mois prochain : le manque d’une facture annuelle est prévu', () => {
  const d = baseDoc();
  d.fixed.push({ id: 'auto', label: 'Assurance voiture', amount: 960, cat: 'assurances', freq: 'year', dueMonth: 12, since: '2026-11', updatedAt: 1 });
  const n = F.nextMonth(d, '2026-11-26');
  assert.equal(n.month, '2026-12');
  assert.equal(n.yearlyShort, 800); // 2/12 réservés (novembre, décembre)
});

test('3e pilier : versements de l’année, reste jusqu’au plafond', () => {
  const d = baseDoc();
  F.addTx(d, { date: '2026-03-10', amount: -2000, label: 'VIAC 3a', cat: 'invest' }, 1);
  F.addTx(d, { date: '2026-06-10', amount: -1000, label: 'Versement 3e pilier', cat: 'invest' }, 1);
  F.addTx(d, { date: '2025-12-20', amount: -7258, label: 'VIAC 3a', cat: 'invest' }, 1);
  F.addTx(d, { date: '2026-06-11', amount: -500, label: 'ETF courtier', cat: 'invest' }, 1);
  const r = F.pillar3a(d, '2026-11-26');
  assert.equal(r.max, 7258); assert.equal(r.paid, 3000); assert.equal(r.left, 4258); assert.equal(r.daysLeft, 35);
});

test('3e pilier : l’ordre permanent restant est compté comme prévu', () => {
  const d = baseDoc();
  d.fixed.push({ id: 'p3', label: '3e pilier Prévoyance Exemple', amount: 300, cat: 'invest', updatedAt: 1 });
  const r = F.pillar3a(d, '2026-11-26');
  assert.equal(r.scheduled, 600); // novembre et décembre pas encore versés
  assert.equal(r.left, 7258 - 600);
});

test('abonnements : montant stable sur plusieurs mois, pas les courses', () => {
  const d = baseDoc();
  for (const m of ['2026-08', '2026-09', '2026-10', '2026-11']) {
    F.addTx(d, { date: m + '-05', amount: -22.9, label: 'Netflix', cat: 'loisirs' }, 1);
    F.addTx(d, { date: m + '-06', amount: -45, label: 'Migros', cat: 'courses' }, 1);
    F.addTx(d, { date: m + '-16', amount: -80, label: 'Migros', cat: 'courses' }, 1);
  }
  const subs = F.subscriptions(d, '2026-11-26');
  assert.deepEqual(subs.map((x) => x.label), ['Netflix']);
  assert.equal(subs[0].yearly, 274.8);
});

test('dépassement : une catégorie au-dessus de sa moyenne à rythme égal', () => {
  const d = baseDoc();
  for (const [s, e] of [['2026-08-26', -200], ['2026-09-26', -220], ['2026-10-26', -180]]) F.addTx(d, { date: s, amount: e, label: 'Restaurant', cat: 'sorties' }, 1);
  F.addTx(d, { date: '2026-11-26', amount: -190, label: 'Restaurant', cat: 'sorties' }, 1);
  const o = F.overspend(d, '2026-12-03');
  assert.equal(o[0].cat, 'sorties');
  assert.ok(o[0].over > 100);
});

test('rappels suisses : LAMal avant le 30 novembre, 3a avant le 31 décembre', () => {
  assert.deepEqual(F.swissReminders('2026-11-25').map((r) => r.id), ['lamal', 'p3a']);
  assert.deepEqual(F.swissReminders('2026-12-05').map((r) => r.id), ['p3a']);
  assert.deepEqual(F.swissReminders('2027-03-01').map((r) => r.id), ['taxReturn']);
});
function round(x) { return Math.round(x * 100) / 100; }

test('dépassement : pas d’alerte au début du mois sur une simple projection', () => {
  const d = baseDoc();
  for (const s of ['2026-08-26', '2026-09-26', '2026-10-26']) F.addTx(d, { date: s, amount: -300, label: 'Restaurant', cat: 'sorties' }, 1);
  F.addTx(d, { date: '2026-11-26', amount: -100, label: 'Restaurant', cat: 'sorties' }, 1);
  assert.deepEqual(F.overspend(d, '2026-11-27'), []);
});

test('abonnements : des courses régulières ne sont pas un abonnement', () => {
  const d = baseDoc();
  for (const m of ['2026-09', '2026-10', '2026-11']) F.addTx(d, { date: m + '-05', amount: -140, label: 'Migros', cat: 'courses' }, 1);
  assert.deepEqual(F.subscriptions(d, '2026-11-26'), []);
});

// ---------- 13e salaire, plafonds, objectifs, bilan ----------
test('un 13e salaire reçu à part ne commence pas un nouveau mois', () => {
  const d = baseDoc();
  F.addTx(d, { date: '2026-11-25', amount: 6000, label: 'Salaire', cat: 'revenu' }, 1);
  F.addTx(d, { date: '2026-12-15', amount: 6000, label: '13e salaire', cat: 'revenu' }, 1);
  F.addTx(d, { date: '2026-12-24', amount: 6000, label: 'Salaire', cat: 'revenu' }, 1);
  assert.deepEqual(F.salaryDates(d).map((x) => x.date), ['2026-11-25', '2026-12-24']);
  const st = F.monthState(d, '2026-12-16');
  assert.equal(st.period.start, '2026-11-25');
  assert.equal(st.flow.bonus, 6000);
});

test('salaire de novembre avec le 13e inclus : la part en plus est repérée', () => {
  const d = baseDoc();
  F.addTx(d, { date: '2026-11-25', amount: 12000, label: 'Salaire', cat: 'revenu' }, 1);
  const st = F.monthState(d, '2026-11-26');
  assert.equal(st.flow.bonus, 6000);
  F.addTx(d, { date: '2026-11-26', amount: -4000, label: '13e mis de côté', cat: 'epargne', bonusFor: st.period.start }, 1);
  assert.equal(F.monthState(d, '2026-11-26').flow.bonusSaved, 4000);
});

test('plafond par catégorie : presque atteint puis dépassé, avec alertes', () => {
  const d = baseDoc();
  d.settings.limits = { courses: 500, sorties: 0 };
  F.addTx(d, { date: '2026-11-26', amount: -440, label: 'Migros', cat: 'courses' }, 1);
  let l = F.limitsState(d, '2026-11-27');
  assert.equal(l.length, 1); assert.equal(l[0].level, 'near'); assert.equal(l[0].left, 60);
  assert.ok(F.alerts(d, '2026-11-27').some((a) => a.id === 'limit-near' && a.cat === 'courses'));
  F.addTx(d, { date: '2026-11-27', amount: -100, label: 'Coop', cat: 'courses' }, 1);
  l = F.limitsState(d, '2026-11-27');
  assert.equal(l[0].level, 'over');
  assert.ok(F.alerts(d, '2026-11-27').some((a) => a.id === 'limit-over' && a.amount === 40));
});

test('objectif d’épargne : versé, reste, montant par mois', () => {
  const d = baseDoc();
  d.goals = [{ id: 'g1', label: 'Vacances', target: 3000, month: '2027-06', updatedAt: 1 }];
  F.addTx(d, { date: '2026-11-26', amount: -600, label: 'Vacances', cat: 'epargne', goalId: 'g1' }, 1);
  const g = F.goalsState(d, '2026-11-27')[0];
  assert.equal(g.saved, 600); assert.equal(g.left, 2400);
  assert.equal(g.monthsLeft, 8); // novembre à juin
  assert.equal(g.perMonth, 300);
  // l'épargne vers l'objectif compte comme épargne du mois
  assert.equal(F.monthState(d, '2026-11-27').flow.savings.deducted, 600);
});

test('objectifs : synchronisés entre appareils', () => {
  const a = baseDoc(), b = baseDoc();
  a.goals = [{ id: 'g1', label: 'Vacances', target: 3000, updatedAt: 5 }];
  b.goals = [{ id: 'g1', label: 'Vacances Italie', target: 3500, updatedAt: 9 }, { id: 'g2', label: 'Voiture', target: 8000, updatedAt: 2 }];
  const m = F.merge(a, b);
  assert.deepEqual(m.goals.map((g) => g.label).sort(), ['Vacances Italie', 'Voiture']);
});

test('bilan sur douze mois : taux d’épargne des mois terminés', () => {
  const d = baseDoc();
  for (const m of ['2026-08', '2026-09', '2026-10']) {
    F.addTx(d, { date: m + '-25', amount: 6000, label: 'Salaire', cat: 'revenu' }, 1);
    F.addTx(d, { date: m + '-26', amount: -1800, label: 'Loyer', cat: 'logement', fixedId: 'loyer' }, 1);
    F.addTx(d, { date: m + '-28', amount: -2700, label: 'Migros', cat: 'courses' }, 1);
  }
  F.addTx(d, { date: '2026-11-25', amount: 6000, label: 'Salaire', cat: 'revenu' }, 1);
  const r = F.yearReview(d, '2026-11-27');
  assert.equal(r.months, 3);
  assert.equal(r.income, 18000); assert.equal(r.kept, 4500); assert.equal(r.rate, 25);
  assert.equal(r.cats[0].cat, 'courses'); assert.equal(r.cats[0].perMonth, 2700);
});

test('bilan : les mois d’avant le premier revenu ne comptent pas', () => {
  const d = baseDoc();
  F.addTx(d, { date: '2026-03-15', amount: -1500, label: 'VIAC 3a', cat: 'invest' }, 1);
  for (const m of ['2026-09', '2026-10']) F.addTx(d, { date: m + '-25', amount: 6000, label: 'Salaire', cat: 'revenu' }, 1);
  F.addTx(d, { date: '2026-11-25', amount: 6000, label: 'Salaire', cat: 'revenu' }, 1);
  const r = F.yearReview(d, '2026-11-27');
  assert.equal(r.months, 2); assert.equal(r.perMonth.income, 6000);
});

// ---------- facture QR, prévision du solde, dossier impôts ----------
const QR_SAMPLE = ['SPC', '0200', '1', 'CH4431999123000889012', 'S', 'Robert Schneider AG', 'Rue du Lac', '1268', '2501', 'Biel', 'CH',
  '', '', '', '', '', '', '', '1949.75', 'CHF', 'S', 'Pia-Maria Rutschmann-Schnyder', 'Grosse Marktgasse', '28', '9400', 'Rorschach', 'CH',
  'QRR', '210000000003139471430009017', 'Order of 15 June 2020', 'EPD', '//S1/10/10201409/11/200701/20/140.000-53/30/102673831/31/200615/32/7.7/33/7.7:4.00/40/0:30'].join('\r\n');

test('facture QR : lecture du contenu SIX (exemple officiel)', () => {
  const b = F.parseQrBill(QR_SAMPLE);
  assert.equal(b.ok, true);
  assert.equal(b.iban, 'CH4431999123000889012');
  assert.equal(b.creditor.name, 'Robert Schneider AG'); assert.equal(b.creditor.city, 'Biel');
  assert.equal(b.amount, 1949.75); assert.equal(b.currency, 'CHF');
  assert.equal(b.refType, 'QRR'); assert.equal(b.ref, '210000000003139471430009017');
  assert.equal(b.invoiceDate, '2020-07-01'); assert.equal(b.dueDate, '2020-07-31');
});

test('facture QR : refus propre des contenus invalides', () => {
  assert.equal(F.parseQrBill('https://exemple.ch').error, 'not-qr-bill');
  assert.equal(F.parseQrBill(QR_SAMPLE.replace('CH4431999123000889012', 'CH4431999123000889013')).error, 'iban');
  assert.equal(F.parseQrBill(QR_SAMPLE.replace('\r\nEPD', '\r\nXXX')).error, 'trailer');
  // sans montant (le payeur le saisit) et adresse combinée « K »
  const k = QR_SAMPLE.replace('1949.75', '').replace('\r\nS\r\nRobert Schneider AG\r\nRue du Lac\r\n1268\r\n2501\r\nBiel', '\r\nK\r\nRobert Schneider AG\r\nRue du Lac 1268\r\n2501 Biel\r\n\r\n');
  const b = F.parseQrBill(k);
  assert.equal(b.ok, true); assert.equal(b.amount, null); assert.equal(b.creditor.city, 'Biel');
});

test('facture QR → dépense prévue dans le mois de l’échéance, puis réglée par le relevé', () => {
  const d = baseDoc();
  const bill = { ...F.parseQrBill(QR_SAMPLE), dueDate: '2026-12-28' };
  const pl = F.billToPlanned(d, bill, '2026-11-27');
  assert.equal(pl.month, '2026-12'); assert.equal(pl.amount, 1949.75); assert.equal(pl.dup, null);
  d.planned.push({ id: 'qr1', label: pl.label, amount: pl.amount, cat: pl.cat, month: pl.month, qr: pl.qr, updatedAt: 1 });
  assert.ok(F.billToPlanned(d, bill, '2026-11-27').dup, 'la même facture n’est pas ajoutée deux fois');
  assert.equal(F.nextMonth(d, '2026-11-27').plannedSum, 1949.75);
  // payée en avance, en novembre : le relevé porte la référence
  const tx = F.addTx(d, { date: '2026-11-28', amount: -1949.75, label: 'Robert Schneider', bankLabel: 'QR 21 00000 00003 13947 14300 09017', cat: 'autre' }, 2);
  assert.equal(tx.fixedId, 'qr1');
  assert.equal(F.nextMonth(d, '2026-11-28').plannedSum, 0, 'plus rien à payer en décembre');
  assert.ok(!F.monthState(d, '2026-12-26').fixed.some((x) => x.charge.id === 'qr1'));
});

test('prévision : le point bas arrive avec la charge datée, et le conseil par jour', () => {
  const d = baseDoc();
  d.accounts = [{ id: 'a', name: 'Neon', kind: 'courant', balance: 2000, updatedAt: 1 }];
  d.fixed[0].day = 1; // loyer le 1er
  d.fixed.push({ id: 'lamal', label: 'Assurance maladie', amount: 450, cat: 'assurances', day: 5, updatedAt: 1 });
  F.addTx(d, { date: '2026-11-25', amount: 6000, label: 'Salaire', cat: 'revenu', skipBalance: true }, 1);
  for (let i = 0; i < 5; i++) F.addTx(d, { date: F.addDays('2026-11-25', i), amount: -30, label: 'Migros', cat: 'courses', skipBalance: true }, 1);
  const fc = F.forecast(d, '2026-11-30');
  assert.equal(fc.fromAccounts, true); assert.equal(fc.start, 2000);
  assert.equal(fc.perDay, 25); // 150 dépensés en 6 jours
  const dec1 = fc.points.find((x) => x.date === '2026-12-01');
  assert.equal(dec1.balance, 2000 - 25 - 1800);
  assert.equal(fc.firstNegative.date, '2026-12-05');
  assert.equal(fc.firstNegative.cause, 'Assurance maladie');
  assert.ok(fc.cutPerDay > 0);
});

test('dossier impôts : déductions de l’année civile', () => {
  const d = baseDoc();
  const add = (date, amount, label, cat) => F.addTx(d, { date, amount, label, cat }, 1);
  for (let m = 1; m <= 12; m++) add(`2025-${String(m).padStart(2, '0')}-25`, 6000, 'Salaire', 'revenu');
  add('2025-12-10', 6000, '13e salaire', 'revenu');
  add('2025-03-01', -7258, 'VIAC 3a', 'invest');
  add('2025-04-01', -1100, 'Crèche Les Lutins', 'garde');
  add('2025-05-01', -5200, 'Dentiste', 'sante');
  add('2025-06-01', -150, 'Caritas', 'dons');
  add('2026-01-05', -500, 'Dentiste', 'sante');
  const r = F.taxDossier(d, 2025);
  assert.equal(r.income.total, 78000); assert.equal(r.income.salaries, 12); assert.equal(r.income.bonus, 6000);
  assert.equal(r.items.p3a.total, 7258);
  assert.equal(r.items.childcare.total, 1100);
  assert.equal(r.items.health.total, 5200); assert.equal(r.items.health.threshold, 3900); assert.equal(r.items.health.deductible, 1300);
  assert.equal(r.items.donations.deductible, 150);
  assert.equal(F.categorize('Don Croix-Rouge'), 'dons');
});
