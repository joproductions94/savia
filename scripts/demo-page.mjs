// Transforme le build « demo » (un seul fichier) en page de démonstration autonome :
// on retire le squelette HTML, que l'hébergeur de l'aperçu ajoute lui-même.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-demo/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const keep = [
  ...head.matchAll(/<link rel="(?:preconnect|stylesheet)"[^>]*>/g),
  ...head.matchAll(/<style[\s\S]*?<\/style>/g),
  ...head.matchAll(/<script[\s\S]*?<\/script>/g)
].map(m => m[0]);

const page = ['<title>Savia</title>', ...keep, body.trim()].join('\n');
writeFileSync('dist-demo/savia.html', page);
console.log(`dist-demo/savia.html · ${(page.length / 1024).toFixed(0)} Ko`);
