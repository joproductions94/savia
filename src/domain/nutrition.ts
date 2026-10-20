import type { Member } from './types';
import type { Recipe, RecipeIngredient } from './recipes';

export interface Portion {
  /** Multiplicateur appliqué aux quantités de la recette. */
  factor: number;
  kcal: number;
  /** Calories prévues pour le dîner de cette personne, si elle suit un régime. */
  budget: number | null;
  swap: string | null;
  fits: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const step = (v: number) => Math.round(v * 20) / 20;

export function dinnerBudget(m: Member): number | null {
  return m.diet.enabled && m.diet.kcalDay > 0 ? Math.round(m.diet.kcalDay * m.diet.dinnerShare) : null;
}

/**
 * Portion adaptée : on ne dépasse pas le budget du dîner. On propose d'abord la
 * variante légère de la recette, puis on réduit la portion (jamais sous 0,5).
 */
export function portionFor(recipe: Recipe, m: Member): Portion {
  const budget = dinnerBudget(m);
  if (budget === null) return { factor: 1, kcal: recipe.kcal, budget: null, swap: null, fits: true };
  let base = recipe.kcal;
  let swap: string | null = null;
  if (recipe.swap && recipe.kcal > budget) {
    base = recipe.kcal - recipe.swap.saves;
    swap = recipe.swap.text;
  }
  const factor = step(clamp(budget / base, 0.5, 1));
  const kcal = Math.round((base * factor) / 10) * 10;
  return { factor, kcal, budget, swap, fits: kcal <= budget * 1.05 };
}

export function scaledQty(i: RecipeIngredient, factor: number): string {
  const v = i.q * factor;
  if (i.u === 'g' || i.u === 'ml') return `${Math.round(v / 5) * 5} ${i.u}`;
  const r = Math.round(v * 4) / 4;
  const txt = Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, '').replace('.', ',');
  const unit = r >= 2 && (i.u === 'pièce' || i.u === 'boîte') ? `${i.u}s` : i.u;
  return `${txt} ${unit}`;
}

export type Sex = 'femme' | 'homme';
export type Activity = 1.2 | 1.375 | 1.55 | 1.725;
export type Goal = 'perdre' | 'maintenir' | 'prendre';

export interface BodyInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}

/** Estimation Mifflin-St Jeor, arrondie à 50 kcal. */
export function estimateKcal(b: BodyInput): number {
  const bmr = 10 * b.weightKg + 6.25 * b.heightCm - 5 * b.age + (b.sex === 'homme' ? 5 : -161);
  const goal = b.goal === 'perdre' ? 0.85 : b.goal === 'prendre' ? 1.1 : 1;
  return Math.round((bmr * b.activity * goal) / 50) * 50;
}
