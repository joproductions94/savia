import { describe, expect, it } from 'vitest';
import { rankRecipes, fridgeMatch } from './suggest';
import { dinnerBudget, estimateKcal, portionFor, scaledQty } from './nutrition';
import { canonical, normalize } from './ingredients';
import { RECIPES, recipeById } from './recipes';
import { addDays, isoWeek, startOfWeek } from './dates';
import type { Member } from './types';

const jo: Member = { id: 'a', name: 'Jo', color: 'amber', diet: { enabled: false, kcalDay: 0, dinnerShare: 0.35 }, exclusions: [] };
const sam: Member = { id: 'b', name: 'Sam', color: 'violet', diet: { enabled: true, kcalDay: 1600, dinnerShare: 0.35 }, exclusions: [] };
const salmon = recipeById('saumon-patate-douce')!;

describe('ingrédients', () => {
  it('reconnaît un produit saisi sans accent ni majuscule', () => {
    expect(canonical('epinard')).toBe('Épinards');
    expect(canonical('oeufs')).toBe('Œufs');
    expect(normalize('Tomates')).toBe(normalize('tomate'));
  });
  it('garde tel quel un produit inconnu', () => {
    expect(canonical('mangue')).toBe('Mangue');
  });
  it('toutes les recettes utilisent des ingrédients connus', () => {
    for (const r of RECIPES) for (const i of r.ing) expect(canonical(i.n), `${r.id}: ${i.n}`).toBe(i.n);
  });
});

describe('portions et régime', () => {
  it('ne change rien sans régime', () => {
    expect(portionFor(salmon, jo)).toMatchObject({ factor: 1, kcal: 650, budget: null });
  });
  it('reste sous le budget du dîner avec la variante légère', () => {
    expect(dinnerBudget(sam)).toBe(560);
    const p = portionFor(salmon, sam);
    expect(p.swap).not.toBeNull();
    expect(p.kcal).toBeLessThanOrEqual(560 * 1.05);
    expect(p.fits).toBe(true);
  });
  it('ne pousse pas à manger plus que la recette', () => {
    const light = recipeById('soupe-lentilles')!;
    expect(portionFor(light, sam).factor).toBe(1);
  });
  it('met les quantités à l’échelle', () => {
    expect(scaledQty({ n: 'Saumon', q: 130, u: 'g' }, 0.75)).toBe('100 g');
    expect(scaledQty({ n: 'Œufs', q: 3, u: 'pièce' }, 0.5)).toBe('1,5 pièce');
    expect(scaledQty({ n: 'Œufs', q: 3, u: 'pièce' }, 1)).toBe('3 pièces');
  });
  it('estime les calories journalières', () => {
    expect(estimateKcal({ sex: 'femme', age: 35, heightCm: 168, weightKg: 65, activity: 1.375, goal: 'perdre' })).toBe(1600);
  });
});

describe('propositions', () => {
  const fridge = ['Œufs', 'Courgette', 'Tomates', 'Oignon'];
  it('met en avant ce qu’on peut cuisiner avec le frigo', () => {
    const [first] = rankRecipes({ members: [jo, sam], fridge });
    expect(first.recipe.id).toBe('tortilla-courgette');
    expect(first.missing).toEqual([]);
  });
  it('ignore les produits de placard', () => {
    expect(fridgeMatch(salmon, ['Saumon', 'Patate douce', 'Brocoli', 'Citron']).missing).toEqual([]);
  });
  it('respecte les exclusions de chacun', () => {
    const veg = { ...jo, exclusions: ['vegetarien' as const] };
    const ranked = rankRecipes({ members: [veg, sam], fridge });
    expect(ranked.every(r => !r.recipe.tags.some(t => ['viande', 'volaille', 'poisson', 'porc'].includes(t)))).toBe(true);
  });
  it('propose plus léger après « trop lourd »', () => {
    const heavy = recipeById('spaghetti-bolognaise')!;
    const [next] = rankRecipes({ members: [jo, sam], fridge, exclude: [heavy.id], reason: 'lourd', rejected: heavy });
    expect(next.recipe.kcal).toBeLessThan(heavy.kcal);
  });
  it('propose plus rapide après « trop long »', () => {
    const slow = recipeById('poulet-roti')!;
    const [next] = rankRecipes({ members: [jo, sam], fridge: [], exclude: [slow.id], reason: 'long', rejected: slow });
    expect(next.recipe.minutes).toBeLessThan(slow.minutes);
  });
  it('évite ce qu’on a mangé récemment', () => {
    const [first] = rankRecipes({ members: [jo, sam], fridge, recent: ['tortilla-courgette'] });
    expect(first.recipe.id).not.toBe('tortilla-courgette');
  });
});

describe('dates', () => {
  it('commence la semaine le lundi', () => {
    expect(startOfWeek('2026-10-25')).toBe('2026-10-19');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(isoWeek('2026-10-19')).toBe(43);
  });
});
