const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const I = require('../js/i18n.js');

test('les trois langues ont exactement les mêmes clés', () => {
  const fr = Object.keys(I.DICTS.fr).sort();
  for (const l of ['de', 'it']) assert.deepEqual(Object.keys(I.DICTS[l]).sort(), fr, l);
});

test('chaque texte utilisé par l’app existe', () => {
  const src = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8');
  const used = new Set([...src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.-]+)'/g)].map((m) => m[1]).concat([...src.matchAll(/data-t="([a-zA-Z0-9_.-]+)"/g)].map((m) => m[1])));
  const missing = [...used].filter((k) => !k.endsWith('.') && !(k in I.DICTS.fr)); // « set.theme. » + k : préfixe dynamique
  assert.deepEqual(missing, []);
});

test('les paramètres sont remplacés', () => {
  I.setLang('de');
  assert.equal(I.t('auth.signedIn', { email: 'a@b.ch' }), 'Angemeldet: a@b.ch');
  I.setLang('fr');
});
