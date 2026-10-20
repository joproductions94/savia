export type Aisle =
  | 'Fruits et légumes'
  | 'Boulangerie'
  | 'Boucherie'
  | 'Poissonnerie'
  | 'Produits frais'
  | 'Épicerie'
  | 'Surgelés'
  | 'Ménage'
  | 'Autres';

export const AISLE_ORDER: Aisle[] = [
  'Fruits et légumes', 'Boulangerie', 'Boucherie', 'Poissonnerie', 'Produits frais', 'Épicerie', 'Surgelés', 'Ménage', 'Autres'
];

export interface IngredientInfo {
  aisle: Aisle;
  /** Prix indicatif d'un achat en CHF. */
  price: number;
  /** Se garde peu de temps : à cuisiner en priorité. */
  perishable?: boolean;
  /** Toujours au placard (huile, épices…) : ni compté ni ajouté aux courses. */
  staple?: boolean;
  /** Calories pour 100 g (ou 100 ml). */
  kcal100: number;
  /** Poids moyen d'une pièce ou d'une boîte égouttée, en grammes. */
  gPerUnit?: number;
}

const FL = 'Fruits et légumes' as const;
const PF = 'Produits frais' as const;
const EP = 'Épicerie' as const;

export const INGREDIENTS: Record<string, IngredientInfo> = {
  'Brocoli': { aisle: FL, price: 2.5, perishable: true, kcal100: 34 },
  'Patate douce': { aisle: FL, price: 2.2, perishable: true, kcal100: 86 },
  'Citron': { aisle: FL, price: 0.6, kcal100: 29, gPerUnit: 60 },
  'Épinards': { aisle: FL, price: 2.95, perishable: true, kcal100: 23 },
  'Oignon': { aisle: FL, price: 0.4, kcal100: 40, gPerUnit: 110 },
  'Ail': { aisle: FL, price: 0.8, kcal100: 149, gPerUnit: 5 },
  'Courgette': { aisle: FL, price: 1.2, perishable: true, kcal100: 17, gPerUnit: 200 },
  'Tomates': { aisle: FL, price: 2.5, perishable: true, kcal100: 18, gPerUnit: 120 },
  'Tomates cerises': { aisle: FL, price: 3.5, perishable: true, kcal100: 18 },
  'Roquette': { aisle: FL, price: 2.2, perishable: true, kcal100: 25 },
  'Champignons': { aisle: FL, price: 3.2, perishable: true, kcal100: 22 },
  'Salade verte': { aisle: FL, price: 1.9, perishable: true, kcal100: 15 },
  'Poivron': { aisle: FL, price: 1.5, perishable: true, kcal100: 31, gPerUnit: 160 },
  'Carotte': { aisle: FL, price: 0.4, kcal100: 41, gPerUnit: 80 },
  'Poireau': { aisle: FL, price: 1.8, perishable: true, kcal100: 31, gPerUnit: 150 },
  'Haricots verts': { aisle: FL, price: 3.4, perishable: true, kcal100: 31 },
  'Pommes de terre': { aisle: FL, price: 2.9, kcal100: 77 },
  'Avocat': { aisle: FL, price: 1.6, perishable: true, kcal100: 160, gPerUnit: 150 },
  'Gingembre': { aisle: FL, price: 1.1, kcal100: 80 },
  'Pommes': { aisle: FL, price: 3.2, kcal100: 52, gPerUnit: 180 },
  'Bananes': { aisle: FL, price: 2.4, perishable: true, kcal100: 89, gPerUnit: 120 },
  'Pain': { aisle: 'Boulangerie', price: 3.2, perishable: true, kcal100: 265 },
  'Tortillas': { aisle: 'Boulangerie', price: 3.5, kcal100: 310, gPerUnit: 40 },
  'Pâte brisée': { aisle: PF, price: 2.4, perishable: true, kcal100: 420, gPerUnit: 230 },
  'Blanc de poulet': { aisle: 'Boucherie', price: 9.8, perishable: true, kcal100: 110 },
  'Cuisses de poulet': { aisle: 'Boucherie', price: 6.5, perishable: true, kcal100: 190, gPerUnit: 220 },
  'Bœuf haché': { aisle: 'Boucherie', price: 7.9, perishable: true, kcal100: 215 },
  'Lardons': { aisle: 'Boucherie', price: 3.4, perishable: true, kcal100: 300 },
  'Saumon': { aisle: 'Poissonnerie', price: 9.8, perishable: true, kcal100: 208 },
  'Cabillaud': { aisle: 'Poissonnerie', price: 10.5, perishable: true, kcal100: 82 },
  'Œufs': { aisle: PF, price: 4.2, kcal100: 143, gPerUnit: 55 },
  'Parmesan': { aisle: PF, price: 4.5, kcal100: 392 },
  'Fromage râpé': { aisle: PF, price: 2.9, perishable: true, kcal100: 380 },
  'Feta': { aisle: PF, price: 3.2, perishable: true, kcal100: 264 },
  'Crème': { aisle: PF, price: 2.1, perishable: true, kcal100: 292 },
  'Beurre': { aisle: PF, price: 2.8, kcal100: 717 },
  'Lait': { aisle: PF, price: 1.75, perishable: true, kcal100: 64 },
  'Yaourt nature': { aisle: PF, price: 1.2, perishable: true, kcal100: 61 },
  'Tofu': { aisle: PF, price: 3.5, perishable: true, kcal100: 144 },
  'Pois chiches': { aisle: EP, price: 1.4, kcal100: 139 },
  'Lait de coco': { aisle: EP, price: 2.4, kcal100: 197 },
  'Riz basmati': { aisle: EP, price: 3.2, kcal100: 350 },
  'Riz arborio': { aisle: EP, price: 3.6, kcal100: 350 },
  'Pâtes complètes': { aisle: EP, price: 2.3, kcal100: 348 },
  'Spaghetti': { aisle: EP, price: 1.9, kcal100: 357 },
  'Lentilles corail': { aisle: EP, price: 2.8, kcal100: 340 },
  'Haricots rouges': { aisle: EP, price: 1.4, kcal100: 114 },
  'Tomates concassées': { aisle: EP, price: 1.3, kcal100: 24 },
  'Quinoa': { aisle: EP, price: 4.5, kcal100: 368 },
  'Thon': { aisle: EP, price: 2.9, kcal100: 116, gPerUnit: 80 },
  'Noix': { aisle: EP, price: 3.9, kcal100: 654 },
  'Olives': { aisle: EP, price: 2.6, kcal100: 145 },
  'Edamame': { aisle: 'Surgelés', price: 3.2, kcal100: 121 },
  'Huile d’olive': { aisle: EP, price: 9.5, staple: true, kcal100: 884 },
  'Sel': { aisle: EP, price: 1, staple: true, kcal100: 0 },
  'Poivre': { aisle: EP, price: 3, staple: true, kcal100: 250 },
  'Curry': { aisle: EP, price: 2.9, staple: true, kcal100: 325 },
  'Cumin': { aisle: EP, price: 2.9, staple: true, kcal100: 375 },
  'Thym': { aisle: EP, price: 2.5, staple: true, kcal100: 276 },
  'Sauce soja': { aisle: EP, price: 3.4, staple: true, kcal100: 53 },
  'Bouillon': { aisle: EP, price: 2.9, staple: true, kcal100: 5 },
  'Papier ménage': { aisle: 'Ménage', price: 4.5, kcal100: 0 },
  'Liquide vaisselle': { aisle: 'Ménage', price: 2.9, kcal100: 0 }
};

/** Minuscules, sans accents ni pluriel simple : « Tomates » et « tomate » se rejoignent. */
export function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => (w.length > 3 ? w.replace(/[sx]$/, '') : w))
    .join(' ');
}

const BY_NORM = new Map(Object.keys(INGREDIENTS).map(n => [normalize(n), n]));

/** Nom canonique d'un ingrédient connu, ou le texte saisi joliment capitalisé. */
export function canonical(input: string): string {
  const raw = input.trim();
  const hit = BY_NORM.get(normalize(raw));
  if (hit) return hit;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function infoOf(name: string): IngredientInfo | undefined {
  return INGREDIENTS[canonical(name)];
}

export const aisleOf = (name: string): Aisle => infoOf(name)?.aisle ?? 'Autres';
export const priceOf = (name: string): number | null => infoOf(name)?.price ?? null;
export const isStaple = (name: string): boolean => !!infoOf(name)?.staple;
export const isPerishable = (name: string): boolean => !!infoOf(name)?.perishable;

export const KNOWN_INGREDIENTS = Object.keys(INGREDIENTS).filter(n => !INGREDIENTS[n].staple);

/** Produits courants proposés pour remplir le frigo au démarrage. */
export const QUICK_FRIDGE = [
  'Œufs', 'Tomates', 'Courgette', 'Brocoli', 'Épinards', 'Champignons', 'Poivron', 'Carotte', 'Oignon',
  'Pommes de terre', 'Patate douce', 'Salade verte', 'Fromage râpé', 'Parmesan', 'Feta', 'Crème', 'Tofu',
  'Blanc de poulet', 'Bœuf haché', 'Saumon', 'Riz basmati', 'Pâtes complètes', 'Spaghetti', 'Pois chiches',
  'Lentilles corail', 'Tomates concassées', 'Quinoa', 'Thon', 'Lait de coco'
];

export const kcal100Of = (name: string): number | null => infoOf(name)?.kcal100 ?? null;

/** Quantité d'une recette convertie en grammes, pour le journal des repas. */
export function gramsOf(name: string, q: number, unit: string): number {
  if (unit === 'g' || unit === 'ml') return q;
  if (unit === 'c. à s.') return q * 10;
  return q * (infoOf(name)?.gPerUnit ?? 100);
}
