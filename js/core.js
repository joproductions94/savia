/* Cœur des données, commun à toutes les apps du modèle.
   Un « document » par utilisateur : des réglages et des listes d'objets. Chaque objet porte un id et un updatedAt ;
   deux appareils qui modifient le même document se rejoignent objet par objet (le plus récent gagne),
   et une suppression est une « pierre tombale » (deleted: true) pour qu'elle se propage aussi. */
(function (root) {
  'use strict';
  const cfg = (root && root.APP_CONFIG) || {};
  // Les listes du document. Ajoutez les vôtres dans config.js (lists: ['items', 'tags']).
  const LISTS = Array.isArray(cfg.lists) && cfg.lists.length ? cfg.lists.slice() : ['items'];

  const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(/[’'\s]/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
  const uid = () => (root && root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const live = (list) => (list || []).filter((x) => x && !x.deleted);
  const touch = (x, now) => { x.updatedAt = now || Date.now(); return x; };
  const pad = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  function emptyDoc() {
    const d = { v: 1, settings: { updatedAt: 0 }, updatedAt: 0 };
    for (const k of LISTS) d[k] = [];
    return d;
  }
  function normalize(d) {
    const e = emptyDoc();
    if (!d || typeof d !== 'object' || !d.settings) return e;
    const out = { ...e, ...d, settings: { ...e.settings, ...d.settings } };
    for (const k of LISTS) out[k] = Array.isArray(d[k]) ? d[k] : [];
    return out;
  }
  const newer = (a, b) => (num(b && b.updatedAt) > num(a && a.updatedAt) ? b : a);
  function mergeList(a, b) {
    const by = new Map();
    for (const x of a || []) if (x && x.id) by.set(x.id, x);
    for (const x of b || []) if (x && x.id) by.set(x.id, by.has(x.id) ? newer(by.get(x.id), x) : x);
    return [...by.values()];
  }
  function merge(local, remote) {
    if (!remote || !remote.settings) return local;
    if (!local || !local.settings) return remote;
    const out = { ...local, settings: newer(local.settings, remote.settings), updatedAt: Math.max(num(local.updatedAt), num(remote.updatedAt)) };
    for (const k of LISTS) out[k] = mergeList(local[k], remote[k]);
    return out;
  }
  function sameDoc(a, b) {
    const byId = (l) => [...(l || [])].sort((x, y) => (x.id < y.id ? -1 : 1));
    const canon = (d) => JSON.stringify([d.settings, ...LISTS.map((k) => byId(d[k]))]);
    return canon(a) === canon(b);
  }
  // Ajout, modification, suppression dans une liste du document.
  function add(doc, list, obj, now) { const x = touch({ id: uid(), ...obj }, now); (doc[list] = doc[list] || []).push(x); return x; }
  function update(doc, list, id, patch, now) { const x = (doc[list] || []).find((y) => y.id === id && !y.deleted); if (x) touch(Object.assign(x, patch), now); return x; }
  function remove(doc, list, id, now) { const x = (doc[list] || []).find((y) => y.id === id); if (x) touch(Object.assign(x, { deleted: true }), now); return x; }
  function restore(doc, list, id, now) { const x = (doc[list] || []).find((y) => y.id === id); if (x) touch(Object.assign(x, { deleted: false }), now); return x; }
  function toCSV(doc, list, cols) {
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    return '﻿' + [cols.map(q).join(';')].concat(live(doc[list]).map((x) => cols.map((c) => q(x[c])).join(';'))).join('\r\n');
  }

  const Core = { LISTS, num, uid, live, touch, today, emptyDoc, normalize, merge, mergeList, sameDoc, add, update, remove, restore, toCSV };
  if (typeof module === 'object' && module.exports) module.exports = Core;
  else root.Core = Core;
})(typeof globalThis !== 'undefined' ? globalThis : this);
