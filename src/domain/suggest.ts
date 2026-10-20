import { isPerishable, isStaple, normalize } from './ingredients';
import { EXCLUDES, RECIPES, type Recipe } from './recipes';
import { portionFor } from './nutrition';
import type { Member, RejectReason } from './types';

export interface Ranked {
  recipe: Recipe;
  score: number;
  have: string[];
  missing: string[];
  /** Produits fragiles du frigo que la recette permet d'utiliser. */
  rescues: string[];
  fitsDiets: boolean;
}

export interface RankInput {
  members: Member[];
  /** Noms des produits présents dans le frigo et le placard. */
  fridge: string[];
  /** Recettes cuisinées ces derniers jours, la plus récente en premier. */
  recent?: string[];
  exclude?: string[];
  /** Motif du refus et recette refusée : oriente la proposition suivante. */
  reason?: RejectReason;
  rejected?: Recipe;
  recipes?: Recipe[];
}

export const allowedFor = (members: Member[]) => (r: Recipe) =>
  members.every(m => m.exclusions.every(x => !EXCLUDES[x].some(t => r.tags.includes(t))));

export function fridgeMatch(recipe: Recipe, fridge: string[]) {
  const stock = new Set(fridge.map(normalize));
  const needed = recipe.ing.map(i => i.n).filter(n => !isStaple(n));
  const have = needed.filter(n => stock.has(normalize(n)));
  const missing = needed.filter(n => !stock.has(normalize(n)));
  return { have, missing, rescues: have.filter(isPerishable), ratio: needed.length ? have.length / needed.length : 1 };
}

export function rankRecipes(input: RankInput): Ranked[] {
  const { members, fridge, recent = [], exclude = [], reason, rejected } = input;
  const pool = (input.recipes ?? RECIPES).filter(r => !exclude.includes(r.id)).filter(allowedFor(members));
  return pool
    .map(recipe => {
      const { have, missing, rescues, ratio } = fridgeMatch(recipe, fridge);
      const fitsDiets = members.every(m => portionFor(recipe, m).fits);
      let score = ratio * 4 + rescues.length * 0.5 - missing.length * 0.3;
      const ago = recent.indexOf(recipe.id);
      if (ago >= 0 && ago < 5) score -= ago < 3 ? 6 : 3;
      if (!fitsDiets) score -= 1.5;
      if (reason && rejected) {
        if (reason === 'lourd') score += recipe.kcal < rejected.kcal ? (rejected.kcal - recipe.kcal) / 100 : -4;
        if (reason === 'long') score += recipe.minutes < rejected.minutes ? (rejected.minutes - recipe.minutes) / 10 : -4;
        if (reason === 'recent' && recipe.protein === rejected.protein) score -= 3;
        if (reason === 'envie' && recipe.protein === rejected.protein) score -= 2;
      }
      return { recipe, score, have, missing, rescues, fitsDiets };
    })
    .sort((a, b) => b.score - a.score);
}
