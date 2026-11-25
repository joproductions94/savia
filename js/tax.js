/* Franko — estimation des impôts sur le revenu (Confédération + canton + commune + paroisse).
   IFD 2026 : barème officiel (art. 36 LIFD), vérifié sur l'exemple de l'AFC (personne seule, 60'000 → 671.40).
   Cantons : seuls ceux dont le barème est saisi ici sont estimés ; pour les autres, l'utilisateur indique ses acomptes. */
(function (root) {
  'use strict';
  const round2 = (x) => Math.round(x * 100) / 100;
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(/[’'\s]/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  // [seuil, impôt au seuil, taux marginal %]
  const IFD_SINGLE = [[15200, 0, 0.77], [33200, 138.6, 0.88], [43500, 229.2, 2.64], [58000, 612, 2.97], [76200, 1152.5, 5.94], [82100, 1502.95, 6.6], [108900, 3271.75, 8.8], [141500, 6140.55, 11], [185100, 10936.55, 13.2]];
  const IFD_MARRIED = [[29700, 0, 1], [53400, 237, 2], [61300, 395, 3], [79100, 929, 4], [94900, 1561, 5], [108600, 2246, 6], [120500, 2960, 7], [130500, 3660, 8], [138300, 4284, 9], [144200, 4815, 10], [148200, 5215, 11], [150300, 5446, 12], [152300, 5686, 13]];
  const IFD = { childCredit: 263, ded: { proRate: 0.03, proMin: 2000, proMax: 4000, ins: { single: 1800, married: 3600, child: 700 }, child: 6800, care: 25500 } };
  function ifdTax(income, married) {
    const t = married ? IFD_MARRIED : IFD_SINGLE;
    const y = Math.floor(Math.max(0, income) / 100) * 100;
    if (y <= t[0][0]) return 0;
    let tax = 0;
    for (let i = t.length - 1; i >= 0; i--) if (y > t[i][0]) { tax = t[i][1] + ((y - t[i][0]) * t[i][2]) / 100; break; }
    return round2(Math.min(tax, y * 0.115));
  }

  // Barèmes cantonaux : taux moyen de l'impôt de base selon le revenu imposable, coefficient cantonal, splitting.
  // exact: false = barème approché à partir des bornes légales (écart possible d'environ 10 %).
  const CANTONS = {
    FR: {
      name: 'Fribourg', exact: false, coef: 96, communeDefault: 80, splitting: 0.5,
      rates: [[0, 0], [5000, 1], [10000, 1.6], [20000, 3.1], [30000, 4.6], [40000, 5.9], [50000, 7], [60000, 7.9], [70000, 8.6], [80000, 9.2], [100000, 10.2], [125000, 11.2], [150000, 12], [175000, 12.8], [203900, 13.5]],
      ded: { ins: { single: 2450, married: 4900, child: 840 }, child: 9000, care: 10000 },
    },
  };
  const CANTON_LIST = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'];
  function rateAt(rates, income) {
    const y = Math.max(0, income);
    const last = rates[rates.length - 1];
    if (y >= last[0]) return last[1];
    for (let i = 1; i < rates.length; i++) {
      const [x1, r1] = rates[i], [x0, r0] = rates[i - 1];
      if (y <= x1) return r0 + ((r1 - r0) * (y - x0)) / (x1 - x0);
    }
    return 0;
  }

  // o : { salaryNet (annuel), other, status: 'single'|'married'|'parent', children, alimony, childcare, pillar3a,
  //       canton, communeCoef (%), parishCoef (%), cantonalOverride (impôt cantonal+communal annuel saisi à la main) }
  function estimate(o) {
    const sal = Math.max(0, num(o.salaryNet)), income = sal + Math.max(0, num(o.other));
    const kids = Math.max(0, Math.round(num(o.children)));
    const couple = o.status === 'married', family = couple || o.status === 'parent';
    const pro = sal > 0 ? round2(clamp(sal * IFD.ded.proRate, IFD.ded.proMin, IFD.ded.proMax)) : 0;
    const alimony = Math.max(0, num(o.alimony)), p3a = Math.max(0, num(o.pillar3a));
    const care = kids ? Math.max(0, num(o.childcare)) : 0;
    const sum = (x) => round2(Object.values(x).reduce((a, b) => a + b, 0));
    const ifdD = { pro, alimony, pillar3a: p3a, insurance: (couple ? IFD.ded.ins.married : IFD.ded.ins.single) + kids * IFD.ded.ins.child, children: kids * IFD.ded.child, childcare: Math.min(care, kids * IFD.ded.care) };
    const taxableIfd = Math.max(0, round2(income - sum(ifdD)));
    const ifd = round2(Math.max(0, ifdTax(taxableIfd, family) - (family ? kids * IFD.childCredit : 0)));
    const c = CANTONS[o.canton];
    const res = { income: round2(income), canton: o.canton, supported: !!c, exact: c ? c.exact : null, ded: { ifd: ifdD }, taxableIfd, ifd };
    if (c) {
      const frD = { pro, alimony, pillar3a: p3a, insurance: (couple ? c.ded.ins.married : c.ded.ins.single) + kids * c.ded.ins.child, children: kids * c.ded.child, childcare: Math.min(care, kids * c.ded.care) };
      const taxable = Math.max(0, round2(income - sum(frD)));
      const rate = rateAt(c.rates, family ? taxable * c.splitting : taxable);
      const base = round2((taxable * rate) / 100);
      const commCoef = o.communeCoef == null || o.communeCoef === '' ? c.communeDefault : num(o.communeCoef);
      Object.assign(res, { ded: { ifd: ifdD, canton: frD }, taxable, rate: round2(rate), base, cantonal: round2((base * c.coef) / 100), communal: round2((base * commCoef) / 100), parish: round2((base * num(o.parishCoef)) / 100), coef: c.coef, communeCoef: commCoef });
    } else {
      const manual = Math.max(0, num(o.cantonalOverride));
      Object.assign(res, { cantonal: manual, communal: 0, parish: 0, manual: true });
    }
    res.total = round2(res.ifd + res.cantonal + res.communal + res.parish);
    res.monthly = round2(res.total / 12);
    res.effective = income > 0 ? round2((res.total / income) * 100) : 0;
    return res;
  }
  const T = { ifdTax, estimate, rateAt, CANTONS, CANTON_LIST, IFD };
  if (typeof module === 'object' && module.exports) module.exports = T;
  else root.FrankoTax = T;
})(typeof globalThis !== 'undefined' ? globalThis : this);
