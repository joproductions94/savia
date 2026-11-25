const test = require('node:test');
const assert = require('node:assert');
const I = require('../js/i18n.js');
const F = require('../js/logic.js');

test('toutes les clés françaises existent en allemand et en italien', () => {
  const skip = new Set(['app.name', 'quick.added', 'imp.fixed', 'next.title']);
  for (const lang of ['de', 'it']) {
    const missing = Object.keys(I.DICTS.fr).filter((k) => !skip.has(k) && !(k in I.DICTS[lang]));
    assert.deepStrictEqual(missing, [], lang + ' : clés manquantes');
  }
});
test('chaque catégorie et chaque alerte a un texte', () => {
  for (const c of F.CATS) assert.ok(I.DICTS.fr['cat.' + c.id], c.id);
  for (const id of ['setup', 'fixed-over', 'fixed-late', 'short', 'pace', 'overdraft', 'big']) assert.ok(I.DICTS.fr['alert.' + id], id);
});
test('paramètres remplacés', () => {
  I.setLang('de');
  assert.strictEqual(I.t('fixed.paidCount', { paid: 2, total: 5 }), '2/5 bezahlt');
  I.setLang('fr');
});
