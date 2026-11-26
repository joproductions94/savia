// Crée une nouvelle app à partir de ce modèle : node scripts/new-app.js "Nom de l'app" slug
// Remplace « MonApp » et « monapp » dans les fichiers du modèle, puis affiche la suite à faire.
const fs = require('fs');
const path = require('path');

const [name, slug] = process.argv.slice(2);
if (!name || !slug || !/^[a-z][a-z0-9-]{1,30}$/.test(slug)) {
  console.error('Usage : node scripts/new-app.js "Nom de l\'app" slug');
  console.error('  slug : minuscules, chiffres et tirets, 2 à 31 caractères (ex. « carnet-bebe »)');
  process.exit(1);
}
if (/[<>"`$\\]/.test(name)) { console.error('Le nom ne peut pas contenir < > " ` $ \\'); process.exit(1); }

const root = path.join(__dirname, '..');
const FILES = ['config.js', 'manifest.webmanifest', 'index.html', 'app.html', 'admin.html', 'legal.html', 'package.json'];
let changed = 0;
for (const f of FILES) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, 'utf8');
  let after = before.split('MonApp').join(name).split('monapp').join(slug);
  if (f === 'config.js') after = after.replace(/appName: '[^']*'/, `appName: '${name.replace(/'/g, "\\'")}'`).replace(/slug: '[^']*'/, `slug: '${slug}'`);
  if (after !== before) { fs.writeFileSync(p, after); changed++; console.log('  modifié  ' + f); }
}
const sw = path.join(root, 'sw.js');
fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/const CACHE = '[^']*'/, `const CACHE = '${slug}-v1'`));
console.log(`\n${changed} fichier(s) adapté(s) pour « ${name} ».`);
console.log(`
Suite :
  1. Votre logo : remplacez icons/icon.svg.
  2. Vos textes : js/i18n.js (app) et js/site.js (page publique), en FR, DE et IT.
  3. Votre métier : js/app.js (VIEWS.home et VIEWS.stats) et, si besoin, d'autres listes dans config.js (lists).
  4. Vos conditions : legal.html (raison sociale, adresse, contact, prix, for).
  5. npm test, puis npm run dev et ouvrez http://localhost:8080.
  6. En ligne : voir README.md, « Mettre en ligne ».`);
