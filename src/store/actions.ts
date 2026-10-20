import { relativeDay } from '../domain/dates';
import { canonical, isStaple, normalize } from '../domain/ingredients';
import { recipeById, RECIPES } from '../domain/recipes';
import { rankRecipes } from '../domain/suggest';
import type { AgendaItem, Assignee, DinnerDay, HouseState, MealLog, Member, MemberId, RejectReason } from '../domain/types';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const memberOf = (s: HouseState, id: MemberId): Member => s.members.find(m => m.id === id) ?? s.members[0];
export const otherOf = (s: HouseState, id: MemberId): Member => s.members.find(m => m.id !== id) ?? s.members[0];
export const nameOf = (s: HouseState, a: Assignee) => (a === 'both' ? 'Tous les deux' : memberOf(s, a).name);

export function emptyState(): HouseState {
  return { version: 1, onboarded: false, members: [], me: '', items: [], notices: [], shopping: [], fridge: [], dinners: {}, meals: [] };
}

/** Prévient l'autre (ou les autres) personne(s) concernée(s) ; jamais l'auteur. */
export function notify(d: HouseState, from: MemberId, to: Assignee, text: string) {
  const targets = to === 'both' ? d.members.map(m => m.id) : [to];
  for (const t of targets) {
    if (t === from) continue;
    d.notices.unshift({ id: uid(), to: t, from, text, at: Date.now(), read: false });
  }
  d.notices = d.notices.slice(0, 80);
}

/* ---------- agenda ---------- */

export function addItem(d: HouseState, item: Omit<AgendaItem, 'id' | 'done' | 'createdBy'>, by: MemberId, tell: boolean) {
  d.items.push({ ...item, id: uid(), done: false, createdBy: by });
  if (tell) {
    const when = `${relativeDay(item.date)}${item.time ? ' à ' + item.time : ''}`;
    notify(d, by, item.assignee, `${memberOf(d, by).name} vous a confié « ${item.title} » pour ${when}.`);
  }
}

export function moveItem(d: HouseState, id: string, date: string, by: MemberId): boolean {
  const it = d.items.find(i => i.id === id);
  if (!it || it.date === date) return false;
  it.date = date;
  notify(d, by, it.assignee, `${memberOf(d, by).name} a déplacé « ${it.title} » à ${relativeDay(date)}.`);
  return true;
}

export function toggleItem(d: HouseState, id: string, by: MemberId) {
  const it = d.items.find(i => i.id === id);
  if (!it) return;
  it.done = !it.done;
  if (it.done) notify(d, by, it.assignee, `${memberOf(d, by).name} a fait « ${it.title} ».`);
}

export function nudgeItem(d: HouseState, id: string, by: MemberId) {
  const it = d.items.find(i => i.id === id);
  if (!it) return;
  const to = it.assignee === 'both' ? otherOf(d, by).id : it.assignee;
  notify(d, by, to, `${memberOf(d, by).name} vous rappelle « ${it.title} » (${relativeDay(it.date)}${it.time ? ', ' + it.time : ''}).`);
}

export const deleteItem = (d: HouseState, id: string) => { d.items = d.items.filter(i => i.id !== id); };

/* ---------- dîner ---------- */

export function recentDinners(s: HouseState, before: string): string[] {
  return Object.values(s.dinners)
    .filter(x => x.date < before && x.status !== 'pending')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(x => x.recipeId);
}

export const fridgeNames = (s: HouseState) => s.fridge.map(f => f.name);

const freshVotes = (s: HouseState) => Object.fromEntries(s.members.map(m => [m.id, null])) as DinnerDay['votes'];

export function ensureDinner(d: HouseState, date: string) {
  if (d.dinners[date]) return;
  const [best] = rankRecipes({ members: d.members, fridge: fridgeNames(d), recent: recentDinners(d, date) });
  d.dinners[date] = { date, recipeId: (best?.recipe ?? RECIPES[0]).id, votes: freshVotes(d), rejected: [], status: 'pending' };
}

export function voteYes(d: HouseState, date: string, by: MemberId): 'confirmed' | 'waiting' {
  const day = d.dinners[date];
  const r = recipeById(day.recipeId)!;
  day.votes[by] = 'yes';
  if (d.members.every(m => day.votes[m.id] === 'yes')) {
    day.status = 'confirmed';
    notify(d, by, 'both', `Dîner confirmé : ${r.name}.`);
    return 'confirmed';
  }
  notify(d, by, 'both', `${memberOf(d, by).name} a dit oui pour le dîner : ${r.name}. Il manque votre vote.`);
  return 'waiting';
}

export const REASON_LABEL: Record<RejectReason, string> = {
  lourd: 'Trop lourd',
  long: 'Trop long à faire',
  recent: 'Mangé récemment',
  envie: 'Pas envie'
};

export function rejectDinner(d: HouseState, date: string, by: MemberId, reason: RejectReason): string {
  const day = d.dinners[date];
  const old = recipeById(day.recipeId)!;
  day.rejected = [...new Set([...day.rejected, old.id])];
  let ranked = rankRecipes({ members: d.members, fridge: fridgeNames(d), recent: recentDinners(d, date), exclude: day.rejected, reason, rejected: old });
  if (!ranked.length) {
    day.rejected = [old.id];
    ranked = rankRecipes({ members: d.members, fridge: fridgeNames(d), exclude: day.rejected, reason, rejected: old });
  }
  const next = ranked[0]?.recipe ?? old;
  day.recipeId = next.id;
  day.votes = freshVotes(d);
  day.status = 'pending';
  notify(d, by, 'both', `${memberOf(d, by).name} préfère autre chose (${REASON_LABEL[reason].toLowerCase()}). Nouvelle idée : ${next.name}.`);
  return next.name;
}

export function proposeDinner(d: HouseState, date: string, by: MemberId, recipeId: string) {
  const day = d.dinners[date];
  if (day.recipeId !== recipeId) day.rejected = [...new Set([...day.rejected, day.recipeId])];
  day.recipeId = recipeId;
  day.votes = freshVotes(d);
  day.votes[by] = 'yes';
  day.status = 'pending';
  notify(d, by, 'both', `${memberOf(d, by).name} propose pour le dîner : ${recipeById(recipeId)!.name}.`);
}

/** Le plat est cuisiné : les produits frais utilisés sortent du frigo. */
export function markCooked(d: HouseState, date: string) {
  const day = d.dinners[date];
  const used = new Set(recipeById(day.recipeId)!.ing.map(i => normalize(i.n)));
  d.fridge = d.fridge.filter(f => !used.has(normalize(f.name)));
  day.status = 'cooked';
}

/* ---------- courses et frigo ---------- */

export function addShopping(d: HouseState, names: string[], from: string | null, by: MemberId): string[] {
  const added: string[] = [];
  for (const raw of names) {
    const name = canonical(raw);
    if (!name || d.shopping.some(s => normalize(s.name) === normalize(name))) continue;
    d.shopping.push({ id: uid(), name, from, addedBy: by });
    added.push(name);
  }
  if (added.length) notify(d, by, 'both', `${memberOf(d, by).name} a ajouté ${added.join(', ')} aux courses.`);
  return added;
}

export function addFridge(d: HouseState, raw: string): string | null {
  const name = canonical(raw);
  if (!name || d.fridge.some(f => normalize(f.name) === normalize(name))) return null;
  d.fridge.push({ id: uid(), name, addedAt: Date.now() });
  return name;
}

/** Article acheté : il quitte la liste et entre au frigo (sauf produits ménagers). */
export function buyItem(d: HouseState, id: string): string | null {
  const s = d.shopping.find(x => x.id === id);
  if (!s) return null;
  d.shopping = d.shopping.filter(x => x.id !== id);
  const name = canonical(s.name);
  if (!isStaple(name) && !['Papier ménage', 'Liquide vaisselle'].includes(name)) addFridge(d, name);
  return name;
}

export const removeFridge = (d: HouseState, id: string) => { d.fridge = d.fridge.filter(f => f.id !== id); };
export const removeShopping = (d: HouseState, id: string) => { d.shopping = d.shopping.filter(f => f.id !== id); };

export function missingFor(s: HouseState, recipeId: string): string[] {
  const stock = new Set(s.fridge.map(f => normalize(f.name)));
  return recipeById(recipeId)!.ing.map(i => i.n).filter(n => !isStaple(n) && !stock.has(normalize(n)));
}

export const inShopping = (s: HouseState, name: string) => s.shopping.some(x => normalize(x.name) === normalize(name));


/* ---------- journal des repas ---------- */

export const mealKcal = (lines: { grams: number; kcal100: number }[]) => Math.round(lines.reduce((t, l) => t + (l.grams * l.kcal100) / 100, 0));

export function dayKcal(s: HouseState, memberId: MemberId, date: string): number {
  return s.meals.filter(m => m.memberId === memberId && m.date === date).reduce((t, m) => t + mealKcal(m.lines), 0);
}

export function saveMeal(d: HouseState, log: MealLog) {
  d.meals = [log, ...d.meals.filter(m => m.id !== log.id)];
}

export const deleteMeal = (d: HouseState, id: string) => { d.meals = d.meals.filter(m => m.id !== id); };
