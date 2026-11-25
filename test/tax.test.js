const test = require('node:test');
const assert = require('node:assert');
const T = require('../js/tax.js');

test('IFD 2026 : exemple officiel AFC et barème époux', () => {
  assert.strictEqual(T.ifdTax(60000, false), 671.4);
  assert.strictEqual(T.ifdTax(15200, false), 0);
  assert.strictEqual(T.ifdTax(2000000, false), 230000);
  assert.strictEqual(T.ifdTax(53400, true), 237);
});
test('Fribourg : déductions, splitting, coefficients', () => {
  const base = { salaryNet: 61200, status: 'single', alimony: 4200, canton: 'FR', communeCoef: 80 };
  const r = T.estimate(base);
  assert.strictEqual(r.supported, true);
  assert.strictEqual(r.cantonal, Math.round(r.base * 96) / 100);
  assert.ok(T.estimate({ ...base, alimony: 0 }).total > r.total);
  assert.ok(T.estimate({ ...base, status: 'parent', children: 1 }).total < r.total * 0.8);
});
test('canton sans barème : IFD exact + montant saisi', () => {
  const r = T.estimate({ salaryNet: 60000, canton: 'ZH', cantonalOverride: 4800 });
  assert.strictEqual(r.supported, false);
  assert.strictEqual(r.cantonal, 4800);
  assert.strictEqual(r.monthly, Math.round(((r.ifd + 4800) / 12) * 100) / 100);
});
