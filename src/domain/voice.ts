import { addDays, fromISO, toISO } from './dates';
import { canonical } from './ingredients';
import type { Assignee, Member, MemberId } from './types';

/* Transforme une phrase dictée en tâche, événement ou articles de courses. */

export type VoiceResult =
  | { kind: 'shopping'; items: string[]; transcript: string }
  | { kind: 'agenda'; title: string; itemKind: 'task' | 'event'; date: string; time: string | null; assignee: Assignee; transcript: string };

const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'");

const SHOPPING_LEAD = /^(?:(?:est-ce que tu peux |peux-tu |tu peux )?(?:ajoute[rz]?|rajoute[rz]?|mets?|achete[rz]?|acheter|il (?:nous )?faut (?:acheter )?|on a besoin d[e'] ?|il manque|note[rz]?))\s*/;
const SHOPPING_HINT = /\b(aux courses|a la liste|sur la liste|liste de courses|au panier)\b/;
const QTY = /^(?:\d+(?:[.,]\d+)?\s*|(?:une|un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|quelques|plusieurs)\s+)(?:(?:kg|kilos?|g|grammes?|litres?|l|paquets?|boites?|bouteilles?|pots?|sachets?|barquettes?|tranches?|bottes?|filets?)\s+)?(?:de |d')?/;
const ARTICLE = /^(?:(?:du|de la|des|de|le|la|les|un|une)\s+|de l'|l'|d')/;

function shoppingItems(text: string): string[] {
  let t = plain(text).replace(SHOPPING_LEAD, '');
  t = t.replace(/\b(?:aux courses|a la liste(?: de courses)?|sur la liste(?: de courses)?|au panier)\b/g, '');
  return t
    .split(/,|;| et | puis | aussi | avec /)
    .map(p => {
      let x = p.trim().replace(/[.!?]+$/, '');
      for (let i = 0; i < 3; i++) x = x.replace(QTY, '').replace(ARTICLE, '').trim();
      return x;
    })
    .filter(x => x.length > 1)
    .map(canonical);
}

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const EVENT_WORDS = /\b(rendez-vous|rdv|dentiste|medecin|docteur|pediatre|anniversaire|reunion|cours|diner chez|dejeuner chez|soiree|match|concert|vol|train|spectacle|cinema|coiffeur|veterinaire|entretien)\b/;
const TITLE_LEAD = /^(?:rappelle[- ](?:moi|nous)(?: de| d')?|n'oublie(?:z)? pas de|il faut(?: que je| qu'on)?|faut|pense[rz]? a|on doit|je dois|tu dois|ajoute[rz]?(?: un evenement| une tache)?|note[rz]?|planifie[rz]?)\s*/;

export function parseVoice(transcript: string, today: string, members: Member[], me: MemberId, context: 'auto' | 'shopping' | 'agenda' = 'auto'): VoiceResult {
  const text = transcript.trim();
  const p = plain(text);
  if (context === 'shopping' || (context === 'auto' && (SHOPPING_HINT.test(p) || /^(achete|acheter|il faut acheter|on a besoin|il manque)/.test(p)))) {
    return { kind: 'shopping', items: shoppingItems(text), transcript: text };
  }

  // On repère les morceaux (dates, heures, personnes) puis on les retire du titre.
  const cut: [number, number][] = [];
  const take = (re: RegExp) => { const m = re.exec(p); if (m) cut.push([m.index, m.index + m[0].length]); return m; };

  let date = today;
  let m: RegExpExecArray | null;
  if (take(/\b(?:apres-demain|apres demain)\b/)) date = addDays(today, 2);
  else if (take(/\bdemain(?: (?:matin|midi|soir|apres-midi))?\b/)) date = addDays(today, 1);
  else if (take(/\b(?:aujourd'hui|ce soir|ce matin|cet apres-midi)\b/)) date = today;
  else if ((m = take(new RegExp(`\\b(?:ce |le )?(${WEEKDAYS.join('|')})(?: prochain)?(?: (?:matin|midi|soir|apres-midi))?\\b`)))) {
    const target = WEEKDAYS.indexOf(m[1]);
    const delta = ((target - fromISO(today).getDay() + 7) % 7) || 7;
    date = addDays(today, delta);
  } else if ((m = take(new RegExp(`\\ble (\\d{1,2})(?:er)?(?: (${MONTHS.join('|')}))?\\b`)))) {
    const t = fromISO(today);
    const month = m[2] ? MONTHS.indexOf(m[2]) : t.getMonth();
    let d = new Date(t.getFullYear(), month, Number(m[1]));
    if (toISO(d) < today) d = m[2] ? new Date(t.getFullYear() + 1, month, Number(m[1])) : new Date(t.getFullYear(), month + 1, Number(m[1]));
    date = toISO(d);
  } else if (take(/\bla semaine prochaine\b/)) date = addDays(today, 7);

  let time: string | null = null;
  if ((m = take(/\b(?:a |vers )?(\d{1,2}) ?(?:h|heures?|:) ?(\d{2})?(?: et demie)?\b/))) {
    const h = Math.min(23, Number(m[1]));
    const min = m[2] ? Number(m[2]) : /et demie/.test(m[0]) ? 30 : 0;
    time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  } else if (take(/\b(?:a )?midi\b/)) time = '12:00';

  let assignee: Assignee = me;
  const named = members.filter(mb => new RegExp(`\\b${plain(mb.name)}\\b`).test(p));
  if (named.length > 1 || /\b(ensemble|tous les deux|nous deux)\b/.test(p)) assignee = 'both';
  else if (named.length === 1) assignee = named[0].id;
  for (const mb of named) take(new RegExp(`\\b(?:pour|a|avec)? ?${plain(mb.name)}\\b`));
  take(/\b(?:ensemble|tous les deux|nous deux)\b/);

  // Retire les morceaux reconnus du texte d'origine (mêmes positions que la version sans accents).
  let title = text;
  for (const [a, b] of cut.sort((x, y) => y[0] - x[0])) title = title.slice(0, a) + ' ' + title.slice(b);
  title = title.replace(/\s+/g, ' ').trim();
  const lead = TITLE_LEAD.exec(plain(title));
  if (lead) title = title.slice(lead[0].length);
  title = title.replace(/^(?:de |d'|d’)/i, '').replace(/\s+(?:a|à|pour|le|la|de)\s*$/i, '').replace(/[.,!?\s]+$/, '').trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    kind: 'agenda',
    title: title || 'Note vocale',
    itemKind: time || EVENT_WORDS.test(p) ? 'event' : 'task',
    date, time, assignee, transcript: text
  };
}
