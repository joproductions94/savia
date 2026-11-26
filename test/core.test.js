const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/core.js');

test('document vide : réglages et listes', () => {
  const d = C.emptyDoc();
  assert.deepEqual(C.LISTS, ['items']);
  assert.deepEqual(d.items, []);
  assert.equal(C.normalize(null).items.length, 0);
  assert.deepEqual(C.normalize({ settings: { a: 1 }, items: 'cassé' }).items, []);
});

test('ajout, modification, suppression puis restauration', () => {
  const d = C.emptyDoc();
  const x = C.add(d, 'items', { title: 'A' }, 1);
  C.update(d, 'items', x.id, { title: 'B' }, 2);
  assert.equal(C.live(d.items)[0].title, 'B');
  C.remove(d, 'items', x.id, 3);
  assert.equal(C.live(d.items).length, 0);
  assert.equal(d.items.length, 1, 'la suppression laisse une pierre tombale');
  C.restore(d, 'items', x.id, 4);
  assert.equal(C.live(d.items).length, 1);
});

test('fusion entre deux appareils : objet par objet, le plus récent gagne', () => {
  const a = C.emptyDoc(), b = C.emptyDoc();
  a.items = [{ id: '1', title: 'téléphone', updatedAt: 5 }, { id: '2', title: 'seulement A', updatedAt: 1 }];
  b.items = [{ id: '1', title: 'ordinateur', updatedAt: 9 }, { id: '3', title: 'seulement B', updatedAt: 2 }];
  a.settings = { lang: 'fr', updatedAt: 10 }; b.settings = { lang: 'de', updatedAt: 3 };
  const m = C.merge(a, b);
  assert.deepEqual(m.items.map((x) => x.title).sort(), ['ordinateur', 'seulement A', 'seulement B']);
  assert.equal(m.settings.lang, 'fr');
  assert.ok(C.sameDoc(C.merge(a, b), C.merge(b, a)), 'la fusion ne dépend pas de l’ordre');
});

test('une suppression se propage, même si l’autre appareil avait l’ancienne version', () => {
  const a = C.emptyDoc(), b = C.emptyDoc();
  a.items = [{ id: '1', title: 'x', updatedAt: 1 }];
  b.items = [{ id: '1', title: 'x', deleted: true, updatedAt: 2 }];
  assert.equal(C.live(C.merge(a, b).items).length, 0);
});

test('export CSV : en-tête, guillemets, BOM pour Excel', () => {
  const d = C.emptyDoc();
  C.add(d, 'items', { title: 'Dire "bonjour"', note: 'a;b' });
  const csv = C.toCSV(d, 'items', ['title', 'note']);
  assert.ok(csv.startsWith('﻿"title";"note"'));
  assert.ok(csv.includes('"Dire ""bonjour""";"a;b"'));
});
