/* Franko — logique métier pure (aucun accès au DOM). Fonctionne dans le navigateur (window.F) et sous Node (require).
   Tous les montants sont en CHF ; les dates sont des chaînes AAAA-MM-JJ. Les textes affichés sont traduits par l'interface :
   la logique ne renvoie que des identifiants (catégories, alertes) et des nombres. */
(function (root) {
  'use strict';

  // ---------- outils ----------
  const num = (v) => {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    const n = parseFloat(String(v == null ? '' : v).replace(/[’'\s ]/g, '').replace(',', '.'));
    return isFinite(n) ? n : 0;
  };
  const round2 = (x) => Math.round(num(x) * 100) / 100;
  const r05 = (x) => Math.round(num(x) * 20) / 20; // arrondi suisse aux 5 centimes
  const cents = (x) => Math.round(num(x) * 100);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const uid = () => (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const live = (list) => (list || []).filter((x) => x && !x.deleted);
  const pad = (n) => String(n).padStart(2, '0');

  function validDate(y, m, d) {
    const t = new Date(Date.UTC(y, m - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  }
  function today() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function addDays(s, n) { const [y, m, d] = s.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); }
  function diffDays(a, b) { return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000); }
  function addMonths(s, n) {
    const [y, m, d] = s.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1 + n, 1));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    return validDate(t.getUTCFullYear(), t.getUTCMonth() + 1, Math.min(d, last));
  }
  function fmt(x, opts) {
    const v = num(x);
    const s = Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '’');
    return (v < 0 ? '−' : opts && opts.sign && v > 0 ? '+' : '') + s + (opts && opts.bare ? '' : ' CHF');
  }
  // Montant écrit à la main ou lu dans un relevé : « 1'234.50 », « 1 234,50 », « -45.- », « CHF 12 ».
  function parseAmount(s) {
    let t = String(s == null ? '' : s).trim().replace(/chf|fr\.?/gi, '').replace(/\.-$/, '').replace(/[’'\s ]/g, '');
    const neg = /^[-−–(]/.test(t) || /[-−–)]$/.test(t);
    t = t.replace(/[-−–()+]/g, '');
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); // 1.234,50
    else t = t.replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    const v = parseFloat(t);
    return neg ? -v : v;
  }
  function parseDate(s, ref) {
    const t = String(s || '').trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return validDate(+m[1], +m[2], +m[3]);
    m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/);
    if (m) { let y = +m[3]; if (y < 100) y += 2000; return validDate(y, +m[2], +m[1]); }
    m = t.match(/^(\d{1,2})[./](\d{1,2})\.?$/);
    if (m && ref) { const y = +ref.slice(0, 4); let d = validDate(y, +m[2], +m[1]); if (d && d > ref) d = validDate(y - 1, +m[2], +m[1]); return d; }
    return null;
  }

  // ---------- catégories ----------
  // env : enveloppe par défaut (fixed = charges fixes, daily = quotidien, savings = épargne, invest = investissement).
  // kw : mots-clés FR / DE / IT / EN / ES, comparés sans accents.
  const CATS = [
    { id: 'logement', env: 'fixed', kw: ['loyer', 'miete', 'affitto', 'rent', 'alquiler', 'electricite', 'strom', 'elettricita', 'chauffage', 'heizung', 'romande energie', 'groupe e', 'sig', 'ewz', 'bkw', 'serafe', 'charges locatives', 'nebenkosten'] },
    { id: 'assurances', env: 'fixed', kw: ['lamal', 'assurance', 'caisse maladie', 'krankenkasse', 'versicherung', 'assicurazione', 'cassa malati', 'helsana', 'css', 'swica', 'sanitas', 'groupe mutuel', 'assura', 'visana', 'concordia', 'kpt', 'atupri', 'sympany', 'mobiliere', 'axa', 'helvetia', 'zurich', 'vaudoise', 'generali', 'baloise', 'insurance', 'seguro'] },
    { id: 'garde', env: 'fixed', kw: ['creche', 'garderie', 'nounou', 'maman de jour', 'uape', 'apems', 'parascolaire', 'kita', 'krippe', 'tagesmutter', 'hort', 'asilo nido', 'nido', 'daycare', 'babysitter', 'guarderia'] },
    { id: 'pension', env: 'fixed', kw: ['pension alimentaire', 'contribution d entretien', 'unterhalt', 'alimente', 'alimenti', 'child support', 'manutencion', 'manutention', 'pension alimenticia'] },
    { id: 'formation', env: 'fixed', kw: ['ecole', 'ecolage', 'formation', 'universite', 'etudes', 'pret d etudes', 'schule', 'ausbildung', 'studium', 'kurs', 'scuola', 'formazione', 'universita', 'school', 'tuition', 'course', 'escuela'] },
    { id: 'telecom', env: 'fixed', kw: ['swisscom', 'salt', 'sunrise', 'wingo', 'yallo', 'quickline', 'init7', 'internet', 'telephone', 'natel', 'handy', 'telefono', 'abonnement mobile', 'wifi', 'phone'] },
    { id: 'impots', env: 'fixed', kw: ['impot', 'impots', 'steuer', 'steuern', 'imposta', 'imposte', 'tax', 'impuesto', 'contributions', 'steueramt'] },
    { id: 'credit', env: 'fixed', kw: ['leasing', 'credit', 'kredit', 'credito', 'pret', 'darlehen', 'prestito', 'cembra', 'powerpay', 'cashgate', 'bank now', 'klarna', 'loan'] },
    { id: 'courses', env: 'daily', kw: ['courses', 'migros', 'coop', 'denner', 'aldi', 'lidl', 'volg', 'spar', 'manor food', 'epicerie', 'supermarche', 'boulangerie', 'boucherie', 'einkauf', 'lebensmittel', 'backerei', 'metzgerei', 'spesa', 'alimentari', 'panetteria', 'groceries', 'supermercado', 'comida'] },
    { id: 'bebe', env: 'daily', kw: ['couches', 'couche', 'bebe', 'lait infantile', 'biberon', 'windeln', 'baby', 'pannolini', 'neonato', 'diaper', 'panal'] },
    { id: 'sante', env: 'daily', kw: ['pharmacie', 'medecin', 'docteur', 'dentiste', 'pediatre', 'hopital', 'physio', 'amavita', 'sun store', 'apotheke', 'arzt', 'zahnarzt', 'spital', 'farmacia', 'medico', 'dentista', 'ospedale', 'pharmacy', 'doctor', 'dentist'] },
    { id: 'transport', env: 'daily', kw: ['essence', 'carburant', 'cff', 'sbb', 'ffs', 'tpf', 'tpg', 'tl ', 'bus', 'train', 'parking', 'peage', 'vignette', 'garage', 'taxi', 'uber', 'mobility', 'eni', 'shell', 'avia', 'tamoil', 'socar', 'migrol', 'agrola', 'esso', 'bp ', 'benzin', 'tankstelle', 'zug', 'parkhaus', 'benzina', 'treno', 'fuel', 'gasolina', 'voiture', 'auto', 'carro'] },
    { id: 'sorties', env: 'daily', kw: ['restaurant', 'resto', 'cafe', 'bar', 'take away', 'pizza', 'kebab', 'mcdonald', 'burger king', 'starbucks', 'beizli', 'ristorante', 'pizzeria', 'trattoria', 'brunch', 'lunch', 'dinner', 'restaurante', 'sumup'] },
    { id: 'loisirs', env: 'daily', kw: ['cinema', 'kino', 'sport', 'piscine', 'fitness', 'netflix', 'spotify', 'disney', 'hbo', 'youtube', 'apple', 'playstation', 'steam', 'zoo', 'musee', 'museum', 'museo', 'livre', 'buch', 'libro', 'jouet', 'spielzeug', 'giocattolo', 'vacances', 'ferien', 'vacanze', 'hotel'] },
    { id: 'vetements', env: 'daily', kw: ['vetement', 'habits', 'chaussures', 'h&m', 'zara', 'c&a', 'zalando', 'kleider', 'schuhe', 'vestiti', 'scarpe', 'clothes', 'ropa'] },
    { id: 'maison', env: 'daily', kw: ['ikea', 'meuble', 'bricolage', 'jumbo', 'hornbach', 'obi', 'do it', 'pfister', 'conforama', 'galaxus', 'digitec', 'interdiscount', 'fust', 'media markt', 'mediamarkt', 'mobel', 'mobili', 'household'] },
    { id: 'cadeaux', env: 'daily', kw: ['cadeau', 'anniversaire', 'geschenk', 'geburtstag', 'regalo', 'compleanno', 'gift', 'birthday'] },
    { id: 'epargne', env: 'savings', kw: ['epargne', 'fonds d urgence', 'sparen', 'sparkonto', 'risparmio', 'savings', 'ahorro'] },
    { id: 'invest', env: 'invest', kw: ['investissement', '3e pilier', 'pilier 3a', '3a', 'swisslife', 'swiss life', 'viac', 'frankly', 'finpension', 'truewealth', 'selma', 'saeule 3a', 'vorsorge', 'pilastro', 'investimento', 'etf', 'invest'] },
    { id: 'revenu', env: null, income: true, kw: ['salaire', 'lohn', 'gehalt', 'salario', 'stipendio', 'salary', 'sueldo', 'remboursement', 'ruckerstattung', 'rimborso', 'refund', 'allocations familiales', 'kinderzulage', 'assegni familiari'] },
    { id: 'autre', env: 'daily', kw: [] },
  ];
  const CAT_BY_ID = Object.fromEntries(CATS.map((c) => [c.id, c]));
  const ENVS = ['fixed', 'daily', 'savings', 'invest'];
  const envOf = (cat) => (CAT_BY_ID[cat] ? CAT_BY_ID[cat].env : 'daily');
  // Une charge fixe de catégorie « investissement » ou « épargne » remplit cette enveloppe (Swisslife, 3a, ordre permanent).
  const chargeEnv = (c) => { const e = envOf(c && c.cat); return e === 'invest' || e === 'savings' ? e : 'fixed'; };

  const FILLER = new Set(['sa', 'ag', 'gmbh', 'sarl', 'sàrl', 'the', 'les', 'des', 'der', 'die', 'das', 'und', 'pour', 'chez', 'via', 'neon', 'twint', 'paiement', 'zahlung', 'pagamento', 'payment', 'achat', 'kauf', 'acquisto', 'carte', 'karte', 'debit', 'ordre', 'auftrag', 'virement', 'envoye', 'www', 'com']);
  // Mot du libellé qui sert de clé d'apprentissage (« Mediamarkt Crissier » → « mediamarkt »).
  function keyWord(label) {
    return fold(label).split(/[^a-z0-9&]+/).find((w) => w.length >= 3 && !/^\d+$/.test(w) && !FILLER.has(w)) || null;
  }
  // Catégorie d'un libellé : d'abord ce que l'utilisateur a appris à l'app, puis le mot-clé le plus long trouvé.
  const KW = CATS.flatMap((c) => c.kw.map((k) => ({ cat: c.id, k: k.trim(), re: new RegExp('(^| )' + k.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( |$)') })))
    .sort((a, b) => b.k.length - a.k.length);
  function categorize(text, learned) {
    const t = fold(text).replace(/[^a-z0-9&]+/g, ' ').trim();
    if (learned) for (const w of t.split(' ')) if (w && learned[w]) return learned[w];
    const hit = KW.find((x) => x.re.test(t));
    return hit ? hit.cat : 'autre';
  }

  // ---------- répartition ----------
  // Pourcentages appliqués à ce qui reste après les charges fixes réelles (ou au salaire, sans charges saisies).
  const PRESETS = {
    famille: { fixed: 50, daily: 25, savings: 13, invest: 12 },
    classique: { fixed: 50, daily: 30, savings: 10, invest: 10 },
    serre: { fixed: 60, daily: 25, savings: 10, invest: 5 },
  };
  function normSplit(s) {
    const o = {}; let t = 0;
    for (const k of ENVS) { o[k] = Math.max(0, num(s && s[k])); t += o[k]; }
    if (!t) return { ...PRESETS.famille };
    for (const k of ENVS) o[k] = (o[k] * 100) / t;
    return o;
  }
  function plan(settings) {
    const s = settings || {};
    const salary = round2(Math.max(0, num(s.salary)));
    const preset = PRESETS[s.preset] ? s.preset : s.preset === 'perso' ? 'perso' : 'famille';
    const split = normSplit(preset === 'perso' ? s.split : PRESETS[preset]);
    const charges = live(s.fixedCharges).filter((c) => num(c.amount) > 0);
    const sumOf = (k) => round2(charges.filter((c) => chargeEnv(c) === k).reduce((t, c) => t + num(c.amount), 0));
    const fixedTotal = sumOf('fixed'), investFixed = sumOf('invest'), savingsFixed = sumOf('savings');
    const mode = charges.length ? 'actual' : 'percent';
    const env = {};
    if (mode === 'actual') {
      env.fixed = fixedTotal;
      const rest = Math.max(0, round2(salary - fixedTotal));
      const w = split.daily + split.savings + split.invest;
      env.invest = investFixed > 0 ? investFixed : w > 0 ? r05((rest * split.invest) / w) : 0;
      if (savingsFixed > 0) env.savings = savingsFixed;
      else if (investFixed > 0) env.savings = split.savings + split.daily > 0 ? r05((Math.max(0, rest - env.invest) * split.savings) / (split.savings + split.daily)) : 0;
      else env.savings = w > 0 ? r05((rest * split.savings) / w) : 0;
      env.daily = round2(rest - env.savings - env.invest);
    } else {
      let used = 0;
      for (const k of ['fixed', 'savings', 'invest']) { env[k] = r05((salary * split[k]) / 100); used += env[k]; }
      env.daily = round2(salary - used);
    }
    const months = clamp(Math.round(num(s.emergencyMonths) || 6), 3, 6);
    const needs = round2(env.fixed + Math.max(0, env.daily));
    const target = r05(needs * months);
    const fund = round2(Math.max(0, num(s.emergencyFund)));
    let shifted = 0;
    if (fund < target && env.invest > 0 && !investFixed) { // un contrat (3e pilier) ne se coupe pas en deux
      shifted = r05(env.invest / 2);
      env.invest = round2(env.invest - shifted);
      env.savings = round2(env.savings + shifted);
    }
    const covered = needs > 0 ? Math.floor((fund / needs) * 10) / 10 : 0;
    return {
      salary, preset, split, env, shifted, mode, fixedTotal, investFixed, savingsFixed,
      overBy: round2(Math.max(0, fixedTotal + investFixed + savingsFixed - salary)),
      afterFixed: round2(salary - env.fixed),
      emergency: { fund, target, months, needs, covered, level: covered < 3 ? 'low' : covered < months ? 'building' : 'ok' },
    };
  }

  // ---------- mois budgétaires ----------
  // Sans salaire repéré : du jour de paie au jour de paie suivant.
  function period(dateStr, payday) {
    const pd = clamp(Math.round(num(payday) || 25), 1, 28);
    const [y, m, d] = dateStr.split('-').map(Number);
    let start = d >= pd ? validDate(y, m, pd) : addMonths(validDate(y, m, pd), -1);
    const end = addDays(addMonths(start, 1), -1);
    return { start, end, days: diffDays(end, start) + 1, daysLeft: diffDays(end, dateStr) + 1, elapsed: diffDays(dateStr, start) + 1, salaryTx: null };
  }
  // Salaires reçus : crédits d'au moins 60 % du salaire indiqué (1000 CHF sinon), espacés d'au moins 20 jours.
  function salaryDates(doc) {
    const sal = num(doc.settings && doc.settings.salary);
    const min = sal > 0 ? sal * 0.6 : 1000;
    const out = [];
    for (const x of live(doc.tx).filter((t) => t.amount >= min && !t.transfer && !t.excluded).sort((a, b) => (a.date < b.date ? -1 : 1))) {
      if (!out.length || diffDays(x.date, out[out.length - 1].date) >= 20) out.push(x);
    }
    return out;
  }
  // Mois budgétaire qui contient « dateStr » : du salaire reçu à la veille du suivant (ou jour de paie fixe).
  function periodFor(doc, dateStr) {
    const s = (doc && doc.settings) || {};
    if (s.periodMode !== 'payday') {
      let last = null, next = null;
      for (const x of salaryDates(doc)) { if (x.date <= dateStr) last = x; else if (!next) next = x; }
      if (last && diffDays(dateStr, last.date) <= 45) {
        const start = last.date;
        const planned = addDays(addMonths(start, 1), -1);
        const end = next ? addDays(next.date, -1) : planned >= dateStr ? planned : dateStr;
        return { start, end, days: diffDays(end, start) + 1, daysLeft: diffDays(end, dateStr) + 1, elapsed: diffDays(dateStr, start) + 1, salaryTx: last };
      }
    }
    return period(dateStr, s.payday);
  }
  // Période « offset » mois en arrière ; sa fin ne déborde jamais sur la période suivante.
  function periodAt(doc, offset, todayStr) {
    let per = periodFor(doc, todayStr || today());
    for (let i = 0; i < offset; i++) {
      const next = per.start;
      per = periodFor(doc, addDays(next, -1));
      if (per.end >= next) per = { ...per, end: addDays(next, -1) };
    }
    return per;
  }
  // Le mois d'une période est celui où arrive le salaire (20 oct. – 19 nov. = octobre).
  const salaryMonth = (per) => per.start.slice(0, 7);

  // ---------- mouvements ----------
  const touch = (x, now) => Object.assign(x, { updatedAt: now || Date.now() });
  function adjustBalance(doc, accountId, delta, now) {
    const a = live(doc.accounts).find((x) => x.id === accountId);
    if (a) { a.balance = round2(num(a.balance) + delta); touch(a, now); }
  }
  function addTx(doc, t, now) {
    doc.tx = doc.tx || [];
    const tx = touch({ id: uid(), source: 'manual', transfer: false, ...t, amount: round2(t.amount) }, now);
    delete tx.skipBalance;
    const ex = doc.settings && doc.settings.excludedWords;
    if (tx.excluded === undefined && ex && ex[keyWord(tx.label)]) tx.excluded = true; // « pas payé avec cet argent », appris
    if (!tx.excluded) delete tx.excluded;
    if (!tx.env && tx.amount < 0) tx.env = envOf(tx.cat);
    linkFixed(doc, tx);
    doc.tx.push(tx);
    if (tx.accountId && !t.skipBalance) adjustBalance(doc, tx.accountId, tx.amount, now);
    return tx;
  }
  function updateTx(doc, id, patch, now) {
    const tx = doc.tx.find((x) => x.id === id && !x.deleted);
    if (!tx) return null;
    if (tx.accountId) adjustBalance(doc, tx.accountId, -tx.amount, now);
    Object.assign(tx, patch, { amount: round2(patch.amount != null ? patch.amount : tx.amount) });
    if (!tx.excluded) delete tx.excluded;
    if (tx.accountId) adjustBalance(doc, tx.accountId, tx.amount, now);
    return touch(tx, now);
  }
  function deleteTx(doc, id, now) {
    const tx = (doc.tx || []).find((x) => x.id === id);
    if (!tx || tx.deleted) return;
    if (tx.accountId) adjustBalance(doc, tx.accountId, -tx.amount, now);
    tx.deleted = true;
    touch(tx, now);
  }

  // ---------- charges fixes ----------
  const plannedFor = (doc, month) => live(doc.planned).filter((p) => p.month === month && num(p.amount) > 0);
  // Une dépense correspond-elle à une charge ? 3 = montant exact et nom ; 2 = montant proche et nom ; 1 = montant exact seul.
  function matchFixed(doc, tx, paidIds, learned) {
    if (!(tx.amount < 0)) return null;
    const amt = -tx.amount;
    const text = fold(tx.bankLabel || tx.label), squeezed = text.replace(/\s+/g, '');
    let best = null, bestScore = 0, exactOnly = [];
    for (const c of live(doc.fixed)) {
      if (paidIds && paidIds.has(c.id)) continue;
      const a = num(c.amount); if (!(a > 0)) continue;
      const w = keyWord(c.label);
      const named = (w && (text.includes(w) || squeezed.includes(w))) || (tx.cat && tx.cat !== 'autre' && tx.cat === c.cat);
      const exact = cents(a) === cents(amt);
      const close = Math.abs(a - amt) <= Math.max(5, a * (named ? 0.25 : 0.1));
      const score = exact && named ? 3 : close && named ? 2 : exact ? 1 : 0;
      if (score === 1) exactOnly.push(c);
      if (score > bestScore) { best = c; bestScore = score; }
    }
    if (bestScore === 1 && exactOnly.length > 1) return null; // ambigu : deux charges du même montant
    return bestScore ? best : null;
  }
  function linkFixed(doc, tx) {
    if (tx.fixedId || !(tx.amount < 0) || tx.transfer || tx.excluded) return;
    const per = periodFor(doc, tx.date || today());
    const paid = new Set(live(doc.tx).filter((x) => x.fixedId && x.date >= per.start && x.date <= per.end).map((x) => x.fixedId));
    const c = matchFixed(doc, tx, paid, doc.settings && doc.settings.learned);
    if (c) { tx.fixedId = c.id; tx.env = chargeEnv(c); }
  }
  // Après un import ou une correction : relie aux charges les paiements qui ne le sont pas encore.
  function relinkFixed(doc, now) {
    let n = 0;
    for (const t of live(doc.tx).sort((a, b) => (a.date < b.date ? -1 : 1))) {
      if (t.fixedId || !(t.amount < 0) || t.transfer || t.excluded) continue;
      const before = t.fixedId;
      linkFixed(doc, t);
      if (t.fixedId !== before) { touch(t, now); n++; }
    }
    return n;
  }
  // État des charges d'une période : payée (mouvement relié), acompte (paiement de même catégorie), ou à payer.
  function fixedStatus(doc, per) {
    const inPer = live(doc.tx).filter((x) => !x.excluded && x.date >= per.start && x.date <= per.end);
    const tx = inPer.filter((x) => x.fixedId);
    const list = live(doc.fixed).filter((c) => num(c.amount) > 0)
      .sort((a, b) => (num(a.day) || 99) - (num(b.day) || 99) || num(b.amount) - num(a.amount))
      .map((c) => ({ charge: c, kind: chargeEnv(c), paid: tx.find((x) => x.fixedId === c.id) || null, partial: 0, planned: false }));
    for (const p of plannedFor(doc, salaryMonth(per))) list.push({ charge: p, kind: 'fixed', paid: tx.find((x) => x.fixedId === p.id) || null, partial: 0, planned: true });
    const pools = {};
    for (const x of inPer) if (!x.fixedId && x.amount < 0 && !x.transfer && (x.env || envOf(x.cat)) === 'fixed') pools[x.cat] = round2((pools[x.cat] || 0) - x.amount);
    for (const f of list) {
      if (f.paid || f.planned || f.kind !== 'fixed' || !pools[f.charge.cat]) continue;
      f.partial = round2(Math.min(num(f.charge.amount), pools[f.charge.cat]));
      pools[f.charge.cat] = round2(pools[f.charge.cat] - f.partial);
    }
    list.extra = round2(Object.values(pools).reduce((s2, v) => s2 + v, 0));
    return list;
  }
  function dueDate(per, day) {
    const d = clamp(Math.round(num(day)), 1, 31);
    let [y, m] = per.start.split('-').map(Number);
    for (let i = 0; i < 2; i++) {
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const c = validDate(y, m, Math.min(d, last));
      if (c >= per.start && c <= per.end) return c;
      m++; if (m > 12) { m = 1; y++; }
    }
    return per.end;
  }
  function setCheck(doc, periodStart, key, value, now) {
    doc.checks = doc.checks || [];
    let c = doc.checks.find((x) => x.id === periodStart);
    if (!c) { c = { id: periodStart }; doc.checks.push(c); }
    c[key] = !!value;
    return touch(c, now);
  }

  // ---------- état du mois ----------
  // Principe : seuls les paiements faits sont comptés. Ce qui n'est pas payé reste « à payer », à part.
  function monthState(doc, todayStr) {
    const t = todayStr || today();
    const p = plan({ ...doc.settings, emergencyFund: emergencyFund(doc), fixedCharges: doc.fixed });
    const per = periodFor(doc, t);
    const spent = { fixed: 0, daily: 0, savings: 0, invest: 0 };
    const kindOf = Object.fromEntries(live(doc.fixed).map((c) => [c.id, chargeEnv(c)]).concat(live(doc.planned).map((x) => [x.id, 'fixed'])));
    let income = 0;
    for (const x of live(doc.tx)) {
      if (x.date < per.start || x.date > per.end || x.excluded) continue;
      if (x.amount > 0) { if (!x.transfer) income += x.amount; continue; }
      const e = (x.fixedId && kindOf[x.fixedId]) || x.env || envOf(x.cat);
      if (!e || (x.transfer && e !== 'savings' && e !== 'invest')) continue;
      spent[e] = round2(spent[e] - x.amount);
    }
    const fixed = fixedStatus(doc, per);
    const contract = { invest: p.investFixed > 0, savings: p.savingsFixed > 0, daily: false };
    const rec = live(doc.checks).find((c) => c.id === per.start) || {};
    const checks = {};
    for (const k of ['invest', 'savings', 'daily']) {
      const auto = k !== 'daily' && p.env[k] > 0 && spent[k] >= p.env[k] - 0.5;
      checks[k] = { auto, manual: !contract[k] && !!rec[k], contract: contract[k] };
      checks[k].done = checks[k].auto || checks[k].manual;
    }
    const salaryIn = per.salaryTx ? per.salaryTx.amount : p.salary;
    const otherIncome = round2(Math.max(0, income - (per.salaryTx ? per.salaryTx.amount : 0)));
    const fx = fixed.filter((f) => f.kind === 'fixed');
    const fixedPlanned = round2(fx.reduce((s2, f) => s2 + Math.max(num(f.charge.amount), f.paid ? -f.paid.amount : 0), 0) + (fixed.extra || 0));
    const fixedPaid = round2(fx.reduce((s2, f) => s2 + (f.paid ? -f.paid.amount : f.partial || 0), 0) + (fixed.extra || 0));
    const fixedPending = round2(fx.filter((f) => !f.paid).reduce((s2, f) => s2 + num(f.charge.amount) - (f.partial || 0), 0));
    const actual = p.mode === 'actual';
    const plannedAfter = round2(salaryIn + otherIncome - (actual ? fixedPlanned : p.env.fixed));
    const after = round2(salaryIn + otherIncome - (actual ? fixedPaid : p.env.fixed));
    // propositions recalculées sur ce qui reste vraiment : rien à épargner quand il ne reste rien
    const room = Math.max(0, plannedAfter);
    const ratio = (a, b) => (b > 0 ? clamp(a / b, 0, 1) : 0);
    const planned = { invest: p.env.invest, savings: p.env.savings };
    if (actual) {
      if (!contract.invest) planned.invest = r05(p.env.invest * ratio(room, p.afterFixed));
      if (!contract.savings) {
        const inv = contract.invest ? p.investFixed : planned.invest;
        planned.savings = Math.min(r05(p.env.savings * ratio(room - inv, p.afterFixed - inv)), r05(Math.max(0, room - inv - spent.daily)));
      }
    }
    const ded = (k) => round2(!contract[k] && checks[k].done ? Math.max(planned[k], spent[k]) : spent[k]);
    const pendingOf = (k) => (contract[k] && !checks[k].auto ? round2(Math.max(0, planned[k] - spent[k])) : 0);
    const flow = {
      salaryIn: round2(salaryIn), salaryDate: per.salaryTx ? per.salaryTx.date : null, salaryLabel: per.salaryTx ? per.salaryTx.label : '',
      otherIncome, fixedPaid: actual ? fixedPaid : p.env.fixed, fixedPlanned: actual ? fixedPlanned : p.env.fixed, after, plannedAfter,
      invest: { planned: planned.invest, deducted: ded('invest'), done: checks.invest.done, contract: contract.invest, pending: pendingOf('invest') },
      savings: { planned: planned.savings, deducted: ded('savings'), done: checks.savings.done, contract: contract.savings, pending: pendingOf('savings') },
      spentDaily: spent.daily,
      fixedPending: actual ? fixedPending : 0,
    };
    flow.forDaily = round2(after - flow.invest.deducted - flow.savings.deducted);
    flow.pending = round2(flow.fixedPending + flow.invest.pending + flow.savings.pending);
    flow.dailyBudget = round2(flow.forDaily - flow.pending);
    flow.left = round2(flow.forDaily - spent.daily); // disponible maintenant
    flow.leftAfterAll = round2(flow.left - flow.pending); // une fois tout payé
    const perDay = per.daysLeft > 0 ? Math.max(0, r05(flow.leftAfterAll / per.daysLeft)) : 0;
    return { plan: p, period: per, month: salaryMonth(per), spent, perDay, income: round2(income), fixed, checks, flow };
  }

  // Alertes : identifiant + paramètres, le texte est traduit par l'interface.
  function alerts(doc, todayStr) {
    const st = monthState(doc, todayStr);
    const out = [];
    const { plan: p, period: per, spent, flow } = st;
    if (!p.salary) return [{ level: 'info', id: 'setup' }];
    if (p.overBy > 0) out.push({ level: 'danger', id: 'fixed-over', amount: p.overBy });
    const t = todayStr || today();
    const late = st.fixed.filter((f) => !f.paid && !f.planned && num(f.charge.day) > 0 && dueDate(per, f.charge.day) < t);
    if (late.length) out.push({ level: 'warn', id: 'fixed-late', names: late.slice(0, 3).map((f) => f.charge.label) });
    if (flow.leftAfterAll < 0) out.push({ level: 'danger', id: 'short', amount: -flow.leftAfterAll });
    const pace = per.elapsed / per.days;
    if (flow.dailyBudget > 0 && spent.daily <= flow.dailyBudget && spent.daily / flow.dailyBudget > pace + 0.15 && per.elapsed >= 3) {
      out.push({ level: 'warn', id: 'pace', used: Math.round((spent.daily / flow.dailyBudget) * 100), elapsed: Math.round(pace * 100), perDay: st.perDay });
    }
    for (const a of live(doc.accounts)) if (num(a.balance) < 0) out.push({ level: 'danger', id: 'overdraft', name: a.name, amount: a.balance });
    const big = live(doc.tx).filter((x) => x.date >= per.start && x.date <= per.end && x.amount < 0 && !x.transfer && !x.excluded && !x.fixedId && (x.env || envOf(x.cat)) === 'daily' && -x.amount >= Math.max(150, p.env.daily * 0.15));
    if (big.length) out.push({ level: 'info', id: 'big', count: big.length, names: big.slice(0, 2).map((x) => x.label) });
    return out;
  }

  function emergencyFund(doc) {
    const acc = live(doc.accounts).filter((a) => a.kind === 'urgence');
    return acc.length ? round2(acc.reduce((t, a) => t + num(a.balance), 0)) : num(doc.settings && doc.settings.emergencyFund);
  }

  // ---------- mois par mois ----------
  function history(doc, max, todayStr) {
    const tx = live(doc.tx).filter((t) => !t.excluded && !t.transfer);
    if (!tx.length) return [];
    const first = tx.reduce((m, t) => (t.date < m ? t.date : m), todayStr || today());
    const kindOf = Object.fromEntries(live(doc.fixed).map((c) => [c.id, chargeEnv(c)]).concat(live(doc.planned).map((x) => [x.id, 'fixed'])));
    const out = [];
    for (let o = 0; o < (max || 6); o++) {
      const per = periodAt(doc, o, todayStr);
      if (per.end < first) break;
      const m = { offset: o, start: per.start, end: per.end, month: salaryMonth(per), income: 0, fixed: 0, daily: 0, invest: 0, savings: 0 };
      for (const t of tx) {
        if (t.date < per.start || t.date > per.end) continue;
        if (t.amount > 0) { m.income += t.amount; continue; }
        const e = (t.fixedId && kindOf[t.fixedId]) || t.env || envOf(t.cat) || 'daily';
        m[e] -= t.amount;
      }
      for (const k of ['income', 'fixed', 'daily', 'invest', 'savings']) m[k] = round2(m[k]);
      m.spent = round2(m.fixed + m.daily + m.invest + m.savings);
      m.net = round2(m.income - m.spent);
      out.push(m);
    }
    return out.reverse();
  }

  // Mois suivant : salaire indiqué dans les réglages, charges, contrats et dépenses prévues pour ce mois.
  function nextMonth(doc, todayStr) {
    const st = monthState(doc, todayStr);
    const p = st.plan;
    const start = addDays(st.period.end, 1);
    const month = start.slice(0, 7);
    const planned = plannedFor(doc, month);
    const plannedSum = round2(planned.reduce((t, x) => t + num(x.amount), 0));
    const after = round2(p.salary - p.env.fixed - p.env.invest - plannedSum);
    const savings = Math.min(p.env.savings, Math.max(0, after));
    const daily = round2(after - savings);
    const days = diffDays(addDays(addMonths(start, 1), -1), start) + 1;
    return { start, month, salary: p.salary, fixed: p.env.fixed, invest: p.env.invest, planned, plannedSum, after, savings, daily, days, perDay: daily > 0 ? r05(daily / days) : 0, carry: Math.min(0, st.flow.leftAfterAll) };
  }

  // ---------- diviser un paiement ----------
  function splitTx(doc, id, parts, now) {
    const orig = doc.tx.find((x) => x.id === id && !x.deleted);
    if (!orig) throw new Error('not-found');
    const sign = orig.amount < 0 ? -1 : 1;
    const clean = parts.map((p) => ({ label: String(p.label || '').trim(), amount: round2(Math.abs(num(p.amount))), cat: CAT_BY_ID[p.cat] ? p.cat : 'autre' })).filter((p) => p.amount > 0);
    if (clean.length < 2) throw new Error('split-two');
    const total = clean.reduce((s, p) => s + cents(p.amount), 0);
    if (total !== Math.abs(cents(orig.amount))) throw new Error('split-sum');
    const group = orig.splitGroup || uid();
    const base = { date: orig.date, accountId: orig.accountId, source: orig.source || 'manual', bankConfirmed: orig.bankConfirmed || undefined, bankLabel: orig.bankLabel || orig.label, splitGroup: group, splitTotal: orig.splitTotal || orig.amount, skipBalance: true };
    orig.deleted = true; touch(orig, now); // le solde ne change pas : on ne fait que répartir
    return clean.map((p) => addTx(doc, { ...base, amount: sign * p.amount, label: p.label || orig.label, cat: p.cat, env: sign < 0 ? envOf(p.cat) : null }, now));
  }
  function splitRuleFor(doc, row) {
    const rules = doc.settings && doc.settings.splitRules;
    const r = rules && rules[keyWord(row.label)];
    return r && cents(r.total) === cents(Math.abs(row.amount)) && row.amount < 0 ? r : null;
  }

  // ---------- saisie rapide ----------
  const WORD_NUM = { un: 1, une: 1, deux: 2, trois: 3, ein: 1, eine: 1, zwei: 2, drei: 3, uno: 1, due: 2, tre: 3 };
  // « couches 24.90 coop », « hier 45 Migros », « loyer 1'850 », « 18 francs 50 », « Zahnarzt 120 gestern ».
  function parseCommand(text, opts) {
    const o = opts || {};
    const ref = o.today || today();
    let s = ' ' + String(text || '').trim() + ' ';
    if (!s.trim()) return { ok: false, error: 'empty' };
    let date = ref;
    const f = fold(s);
    if (/\b(avant-hier|vorgestern|l'altro ieri|altroieri|anteayer)\b/.test(f)) date = addDays(ref, -2);
    else if (/\b(hier|gestern|ieri|yesterday|ayer)\b/.test(f)) date = addDays(ref, -1);
    const dm = s.match(/\s(\d{1,2})[./](\d{1,2})\.?(?=\s)/);
    if (dm) { const d = parseDate(`${dm[1]}.${dm[2]}`, ref); if (d) { date = d; s = s.replace(dm[0], ' '); } }
    s = s.replace(/\b(avant-hier|vorgestern|altroieri|anteayer|hier|gestern|ieri|yesterday|ayer|aujourd'hui|heute|oggi|today|hoy)\b/gi, ' ');
    // « 18 francs 50 »
    s = s.replace(/(\d+)\s*(?:francs?|franken|franchi|chf|fr\.)\s*(\d{1,2})(?!\d)/i, '$1.$2');
    const amounts = [...s.matchAll(/(?:^|[\s(])[-−]?(\d{1,3}(?:[’'\s]\d{3})+|\d+)(?:[.,](\d{1,2}))?(?:\.-)?(?=[\s).,]|$)/g)];
    if (!amounts.length) return { ok: false, error: 'no-amount' };
    const a = amounts[amounts.length - 1];
    const amount = parseFloat(a[1].replace(/[’'\s]/g, '') + (a[2] ? '.' + a[2] : ''));
    let label = (s.slice(0, a.index) + ' ' + s.slice(a.index + a[0].length)).replace(/\b(chf|francs?|franken|franchi|fr\.)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    const income = /\b(salaire|lohn|stipendio|salary|remboursement|ruckerstattung|rimborso|refund|recu|erhalten|ricevuto|\+)\b/.test(fold(label)) || /^\+/.test(String(text).trim());
    label = label.replace(/^\+\s*/, '');
    label = label.charAt(0).toUpperCase() + label.slice(1);
    const cat = income ? 'revenu' : categorize(label, o.learned);
    return { ok: amount > 0, amount: income ? amount : -amount, label: label || (income ? 'Revenu' : ''), cat, date, income, error: amount > 0 ? null : 'no-amount' };
  }

  // ---------- relevés bancaires (CSV) ----------
  function detectDelimiter(text) {
    const head = text.split(/\r?\n/).slice(0, 5).join('\n');
    const c = (ch) => (head.match(new RegExp(ch === '|' ? '\\|' : ch, 'g')) || []).length;
    return [';', ',', '\t', '|'].sort((a, b) => c(b) - c(a))[0];
  }
  function splitCSV(text, delim) {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; continue; }
      if (ch === '"') q = true;
      else if (ch === delim) { row.push(cur.trim()); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur.trim()); if (row.some((x) => x)) rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    row.push(cur.trim()); if (row.some((x) => x)) rows.push(row);
    return rows;
  }
  const H = {
    date: /^(date|datum|data|buchungsdatum|date de comptabilisation|date comptable|transaction date|booking date|valuta|date valeur|data contabile)/,
    label: /(libelle|texte|description|beschreibung|buchungstext|text|descrizione|testo|details|motif|avis|beneficiaire|empfanger|destinatario|payee|merchant|zahlungsempfanger|designation)/,
    note: /(communication|mitteilung|comunicazione|subject|reference|referenz|riferimento|notes?|message|zahlungszweck)/,
    amount: /^(montant|betrag|importo|amount|montant chf|betrag chf)/,
    debit: /(debit|belastung|addebito|sortie|ausgang|lastschrift|withdrawal)/,
    credit: /(credit|gutschrift|accredito|entree|eingang|deposit)/,
    bankCat: /^(categorie|kategorie|categoria|category)/,
  };
  const BANK_CATS = [[/transport|mobilit|verkehr|trasport/, 'transport'], [/sant|gesund|health/, 'sante'], [/loisir|freizeit|tempo libero|entertain|leisure/, 'loisirs'], [/restaur|gastro|bars?\b/, 'sorties'], [/logement|wohnen|abitazione|housing/, 'logement'], [/assur|versich|insur/, 'assurances'], [/vetement|kleid|abbigl|cloth/, 'vetements']];
  function parseStatement(text) {
    const delim = detectDelimiter(text);
    const rows = splitCSV(String(text || '').replace(/^﻿/, ''), delim);
    let hi = rows.findIndex((r) => r.some((c) => H.date.test(fold(c))) && r.some((c) => H.amount.test(fold(c)) || H.debit.test(fold(c))));
    if (hi < 0) return { ok: false, error: 'no-header', rows: [] };
    const head = rows[hi].map(fold);
    const col = (re, not) => head.findIndex((h, i) => re.test(h) && !(not || []).includes(i));
    const iDate = col(H.date), iAmt = col(H.amount), iDeb = col(H.debit), iCre = col(H.credit, [iDeb]);
    const iLabel = col(H.label, [iDate]), iNote = col(H.note, [iLabel]), iCat = col(H.bankCat);
    const out = [];
    for (const r of rows.slice(hi + 1)) {
      const date = parseDate(r[iDate]);
      if (!date) continue;
      let amount = NaN;
      if (iAmt >= 0 && r[iAmt]) amount = parseAmount(r[iAmt]);
      else {
        const d = iDeb >= 0 ? parseAmount(r[iDeb]) : NaN, c = iCre >= 0 ? parseAmount(r[iCre]) : NaN;
        if (isFinite(d) && d !== 0) amount = -Math.abs(d); else if (isFinite(c) && c !== 0) amount = Math.abs(c);
      }
      if (!isFinite(amount) || amount === 0) continue;
      let label = (iLabel >= 0 ? r[iLabel] : '') || '';
      const note = iNote >= 0 ? r[iNote] : '';
      if (note && fold(note) !== fold(label)) label = label ? `${label} · ${note}` : note;
      label = label.replace(/\s+/g, ' ').trim().slice(0, 90) || '—';
      let hint = null;
      if (iCat >= 0 && r[iCat]) { const bc = fold(r[iCat]); const m = BANK_CATS.find(([re]) => re.test(bc)); if (m) hint = m[1]; }
      out.push({ date, label, amount: round2(amount), hint });
    }
    return out.length ? { ok: true, rows: out } : { ok: false, error: 'no-rows', rows: [] };
  }
  // Rapprochement d'un relevé : doublons, saisies faites à la main, charges fixes, virements, hors budget, répartitions.
  function reconcile(doc, accountId, rows) {
    const all = live(doc.tx);
    const groups = new Map();
    for (const t of all) if (t.splitGroup) {
      const g = groups.get(t.splitGroup) || { id: 'g:' + t.splitGroup, amount: num(t.splitTotal), date: t.date, accountId: t.accountId, source: t.source, bankConfirmed: true, parts: [] };
      g.parts.push(t); g.bankConfirmed = g.bankConfirmed && !!t.bankConfirmed; if (t.fixedId) g.fixedId = g.fixedId || t.fixedId;
      groups.set(t.splitGroup, g);
    }
    const tx = all.filter((t) => !t.splitGroup).concat([...groups.values()]);
    const others = live(doc.accounts).filter((a) => a.id !== accountId);
    const used = new Set();
    const learned = doc.settings && doc.settings.learned;
    return rows.map((r) => {
      const out = { ...r };
      const exact = tx.find((t) => !used.has(t.id) && t.accountId === accountId && (t.source === 'import' || t.bankConfirmed) && t.date === r.date && cents(t.amount) === cents(r.amount));
      if (exact) { out.dup = 'exact'; out.matchId = exact.id; used.add(exact.id); }
      else {
        const prob = tx.find((t) => !used.has(t.id) && !t.bankConfirmed && t.source !== 'import' && Math.sign(t.amount) === Math.sign(r.amount) &&
          ((cents(t.amount) === cents(r.amount) && Math.abs(diffDays(t.date, r.date)) <= 3) ||
           (t.fixedId && Math.abs(diffDays(t.date, r.date)) <= 20 && Math.abs(t.amount - r.amount) <= Math.abs(r.amount) * 0.1)));
        if (prob) { out.dup = 'probable'; out.matchId = prob.id; used.add(prob.id); if (prob.fixedId) out.fixedId = prob.fixedId; }
      }
      let cat = r.amount > 0 ? 'revenu' : categorize(r.label, learned);
      if (cat === 'autre' && r.hint && r.amount < 0) cat = r.hint;
      if (r.amount < 0 && CAT_BY_ID[cat] && CAT_BY_ID[cat].income) cat = 'autre';
      out.cat = cat;
      out.transfer = others.some((a) => { const w = keyWord(a.name); return w && fold(r.label).includes(w); }) || /\b(virement interne|ubertrag|giroconto|own account|compte epargne)\b/.test(fold(r.label));
      if (!out.dup && r.amount < 0 && !out.transfer) {
        const per = periodFor(doc, r.date);
        const paid = new Set(all.filter((x) => x.fixedId && x.date >= per.start && x.date <= per.end).map((x) => x.fixedId));
        const c = matchFixed(doc, { amount: r.amount, label: r.label, cat }, paid, learned);
        if (c) out.fixedId = c.id;
      }
      const ex = doc.settings && doc.settings.excludedWords;
      if (ex && ex[keyWord(r.label)]) { out.excluded = true; delete out.fixedId; }
      const rule = !out.dup && splitRuleFor(doc, r);
      if (rule) { out.split = rule.parts; delete out.fixedId; }
      out.selected = out.dup !== 'exact';
      return out;
    });
  }
  function applyImport(doc, accountId, rows, now) {
    let added = 0, linked = 0, fixedPaid = 0;
    for (const r of rows) {
      if (!r.selected || r.dup === 'exact') continue;
      if (r.dup === 'probable' && r.matchId && r.matchId.startsWith('g:')) {
        for (const t of live(doc.tx).filter((x) => 'g:' + x.splitGroup === r.matchId)) {
          if (t.accountId) adjustBalance(doc, t.accountId, -t.amount, now);
          Object.assign(t, { accountId, date: r.date, bankConfirmed: true, bankLabel: r.label });
          touch(t, now);
          if (t.fixedId) fixedPaid++;
        }
        linked++; continue;
      }
      if (r.dup === 'probable' && r.matchId) {
        const t = doc.tx.find((x) => x.id === r.matchId);
        if (t) {
          if (t.accountId) adjustBalance(doc, t.accountId, -t.amount, now);
          Object.assign(t, { accountId, date: r.date, amount: r.amount, bankConfirmed: true, bankLabel: r.label });
          touch(t, now); linked++; if (t.fixedId) fixedPaid++;
        }
        continue;
      }
      const fx = r.fixedId && live(doc.fixed).find((c) => c.id === r.fixedId);
      const t = addTx(doc, { date: r.date, amount: r.amount, label: r.label, cat: r.cat, env: fx ? chargeEnv(fx) : r.amount < 0 ? envOf(r.cat) : null, fixedId: r.fixedId || undefined, excluded: r.excluded || undefined, accountId, source: 'import', transfer: !!r.transfer, bankConfirmed: true, skipBalance: true }, now);
      added++;
      if (t.fixedId) fixedPaid++;
      if (r.split) { const parts = splitTx(doc, t.id, r.split, now); for (const x of parts) if (x.fixedId) fixedPaid++; }
    }
    return { added, linked, fixedPaid };
  }

  // ---------- fusion entre appareils (« la dernière modification gagne », élément par élément) ----------
  function newer(a, b) {
    const ta = num(a && a.updatedAt), tb = num(b && b.updatedAt);
    if (ta !== tb) return tb > ta ? b : a;
    if (!!(b && b.deleted) !== !!(a && a.deleted)) return a && a.deleted ? a : b;
    return JSON.stringify(b) > JSON.stringify(a) ? b : a;
  }
  function mergeList(a, b) {
    const map = new Map();
    for (const x of a || []) map.set(x.id, x);
    for (const y of b || []) map.set(y.id, map.has(y.id) ? newer(map.get(y.id), y) : y);
    return [...map.values()];
  }
  const LISTS = ['accounts', 'fixed', 'checks', 'planned', 'tx'];
  function merge(local, remote) {
    if (!remote || !remote.settings) return local;
    if (!local || !local.settings) return remote;
    const out = { v: 2, settings: newer(local.settings, remote.settings), updatedAt: Math.max(num(local.updatedAt), num(remote.updatedAt)) };
    for (const k of LISTS) out[k] = mergeList(local[k], remote[k]);
    return out;
  }
  function sameDoc(a, b) {
    const byId = (l) => [...(l || [])].sort((x, y) => (x.id < y.id ? -1 : 1));
    const canon = (d) => JSON.stringify([d.settings, ...LISTS.map((k) => byId(d[k]))]);
    return canon(a) === canon(b);
  }
  function emptyDoc() {
    return {
      v: 2,
      settings: { salary: 0, salaries: 12, payday: 25, periodMode: 'salary', preset: 'famille', split: { ...PRESETS.famille }, emergencyMonths: 6, emergencyFund: 0, canton: 'FR', learned: {}, excludedWords: {}, splitRules: {}, updatedAt: 0 },
      accounts: [], fixed: [], checks: [], planned: [], tx: [], updatedAt: 0,
    };
  }

  function toCSV(doc) {
    const acc = Object.fromEntries((doc.accounts || []).map((a) => [a.id, a.name]));
    const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const lines = [['date', 'label', 'amount', 'category', 'account', 'transfer', 'excluded', 'source'].join(';')];
    for (const x of live(doc.tx).sort((a, b) => (a.date < b.date ? -1 : 1))) lines.push([x.date, q(x.label), x.amount.toFixed(2), x.cat, q(acc[x.accountId] || ''), x.transfer ? 1 : 0, x.excluded ? 1 : 0, x.source || ''].join(';'));
    return '﻿' + lines.join('\r\n') + '\r\n';
  }

  const F = {
    CATS, CAT_BY_ID, ENVS, PRESETS,
    num, round2, r05, fold, uid, live, today, addDays, diffDays, addMonths, fmt, parseAmount, parseDate,
    envOf, chargeEnv, keyWord, categorize, plan, period, salaryDates, periodFor, periodAt, salaryMonth,
    addTx, updateTx, deleteTx, matchFixed, relinkFixed, fixedStatus, plannedFor, dueDate, setCheck,
    monthState, alerts, emergencyFund, history, nextMonth, splitTx, splitRuleFor, parseCommand,
    detectDelimiter, splitCSV, parseStatement, reconcile, applyImport, merge, sameDoc, emptyDoc, toCSV,
  };
  if (typeof module === 'object' && module.exports) module.exports = F;
  else root.F = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
