const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('page publique : chaque texte existe dans les trois langues', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const { L } = require('../js/site.js');
  const keys = [...html.matchAll(/data-(?:i|list|i-aria)="([^"]+)"/g)].map((m) => m[1]);
  for (const l of ['fr', 'de', 'it']) for (const k of keys) assert.ok(L[l][k] != null, `${l} : ${k}`);
  for (const l of ['de', 'it']) assert.deepEqual(Object.keys(L[l]).sort(), Object.keys(L.fr).sort(), l);
});
