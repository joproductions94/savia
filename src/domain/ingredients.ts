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
}

const FL = 'Fruits et légumes' as const;
const PF = 'Produits frais' as const;
const EP = 'Épicerie' as const;

export const INGREDIENTS: Record<string, IngredientInfo> = {
  'Brocoli': { aisle: FL, price: 2.5, perishable: true },
  'Patate douce': { aisle: FL, price: 2.2, perishable: true },
  'Citron': { aisle: FL, price: 0.6 },
  'Épinards': { aisle: FL, price: 2.95, perishable: true },
  'Oignon': { aisle: FL, price: 0.4 },
  'Ail': { aisle: FL, price: 0.8 },
  'Courgette': { aisle: FL, price: 1.2, perishable: true },
  'Tomates': { aisle: FL, price: 2.5, perishable: true },
  'Tomates cerises': { aisle: FL, price: 3.5, perishable: true },
  'Roquette': { aisle: FL, price: 2.2, perishable: true },
  'Champignons': { aisle: FL, price: 3.2, perishable: true },
  'Salade verte': { aisle: FL, price: 1.9, perishable: true },
  'Poivron': { aisle: FL, price: 1.5, perishable: true },
  'Carotte': { aisle: FL, price: 0.4 },
  'Poireau': { aisle: FL, price: 1.8, perishable: true },
  'Haricots verts': { aisle: FL, price: 3.4, perishable: true },
  'Pommes de terre': { aisle: FL, price: 2.9 },
  'Avocat': { aisle: FL, price: 1.6, perishable: true },
  'Gingembre': { aisle: FL, price: 1.1 },
  'Pommes': { aisle: FL, price: 3.2 },
  'Bananes': { aisle: FL, price: 2.4, perishable: true },
  'Pain': { aisle: 'Boulangerie', price: 3.2, perishable: true },
  'Tortillas': { aisle: 'Boulangerie', price: 3.5 },
  'Pâte brisée': { aisle: PF, price: 2.4, perishable: true },
  'Blanc de poulet': { aisle: 'Boucherie', price: 9.8, perishable: true },
  'Cuisses de poulet': { aisle: 'Boucherie', price: 6.5, perishable: true },
  'Bœuf haché': { aisle: 'Boucherie', price: 7.9, perishable: true },
  'Lardons': { aisle: 'Boucherie', price: 3.4, perishable: true },
  'Saumon': { aisle: 'Poissonnerie', price: 9.8, perishable: true },
  'Cabillaud': { aisle: 'Poissonnerie', price: 10.5, perishable: true },
  'Œufs': { aisle: PF, price: 4.2 },
  'Parmesan': { aisle: PF, price: 4.5 },
  'Fromage râpé': { aisle: PF, price: 2.9, perishable: true },
  'Feta': { aisle: PF, price: 3.2, perishable: true },
  'Crème': { aisle: PF, price: 2.1, perishable: true },
  'Beurre': { aisle: PF, price: 2.8 },
  'Lait': { aisle: PF, price: 1.75, perishable: true },
  'Yaourt nature': { aisle: PF, price: 1.2, perishable: true },
  'Tofu': { aisle: PF, price: 3.5, perishable: true },
  'Pois chiches': { aisle: EP, price: 1.4 },
  'Lait de coco': { aisle: EP, price: 2.4 },
  'Riz basmati': { aisle: EP, price: 3.2 },
  'Riz arborio': { aisle: EP, price: 3.6 },
  'Pâtes complètes': { aisle: EP, price: 2.3 },
  'Spaghetti': { aisle: EP, price: 1.9 },
  'Lentilles corail': { aisle: EP, price: 2.8 },
  'Haricots rouges': { aisle: EP, price: 1.4 },
  'Tomates concassées': { aisle: EP, price: 1.3 },
  'Quinoa': { aisle: EP, price: 4.5 },
  'Thon': { aisle: EP, price: 2.9 },
  'Noix': { aisle: EP, price: 3.9 },
  'Olives': { aisle: EP, price: 2.6 },
  'Edamame': { aisle: 'Surgelés', price: 3.2 },
  'Huile d’olive': { aisle: EP, price: 9.5, staple: true },
  'Sel': { aisle: EP, price: 1, staple: true },
  'Poivre': { aisle: EP, price: 3, staple: true },
  'Curry': { aisle: EP, price: 2.9, staple: true },
  'Cumin': { aisle: EP, price: 2.9, staple: true },
  'Thym': { aisle: EP, price: 2.5, staple: true },
  'Sauce soja': { aisle: EP, price: 3.4, staple: true },
  'Bouillon': { aisle: EP, price: 2.9, staple: true },
  'Papier ménage': { aisle: 'Ménage', price: 4.5 },
  'Liquide vaisselle': { aisle: 'Ménage', price: 2.9 }
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
