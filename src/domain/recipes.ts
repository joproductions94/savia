import type { Exclusion } from './types';

/** Ce qu'une recette contient, pour filtrer selon les exclusions de chacun. */
export type RecipeTag = 'viande' | 'volaille' | 'porc' | 'poisson' | 'gluten' | 'lactose';
export type Protein = 'poisson' | 'viande' | 'volaille' | 'oeuf' | 'legumineuse' | 'tofu' | 'fromage';

export interface RecipeIngredient {
  n: string;
  /** Quantité pour une portion. */
  q: number;
  u: 'g' | 'ml' | 'pièce' | 'c. à s.' | 'boîte';
}

export interface ArtLayer {
  p: string;
  at: 'center' | 'main' | 'left' | 'right' | 'garnish' | 'top' | 'bottom' | 'west' | 'east';
}

export interface Recipe {
  id: string;
  name: string;
  minutes: number;
  /** Calories estimées d'une portion normale. */
  kcal: number;
  protein: Protein;
  tags: RecipeTag[];
  ing: RecipeIngredient[];
  steps: string[];
  /** Variante plus légère pour une personne au régime. */
  swap?: { text: string; saves: number };
  art: ArtLayer[];
}

export const EXCLUDES: Record<Exclusion, RecipeTag[]> = {
  'vegetarien': ['viande', 'volaille', 'porc', 'poisson'],
  'sans-gluten': ['gluten'],
  'sans-lactose': ['lactose'],
  'sans-porc': ['porc'],
  'sans-poisson': ['poisson']
};

export const EXCLUSION_LABEL: Record<Exclusion, string> = {
  'vegetarien': 'Végétarien',
  'sans-gluten': 'Sans gluten',
  'sans-lactose': 'Sans lactose',
  'sans-porc': 'Sans porc',
  'sans-poisson': 'Sans poisson'
};

export const RECIPES: Recipe[] = [
  {
    id: 'saumon-patate-douce', name: 'Saumon au four, patate douce et brocoli', minutes: 35, kcal: 650, protein: 'poisson', tags: ['poisson'],
    ing: [{ n: 'Saumon', q: 130, u: 'g' }, { n: 'Patate douce', q: 200, u: 'g' }, { n: 'Brocoli', q: 150, u: 'g' }, { n: 'Citron', q: 0.5, u: 'pièce' }, { n: 'Huile d’olive', q: 1, u: 'c. à s.' }],
    steps: ['Préchauffez le four à 200 °C.', 'Coupez la patate douce en dés, huilez et enfournez 15 minutes.', 'Ajoutez le brocoli et le saumon avec des rondelles de citron ; 12 minutes de plus.', 'Servez aussitôt.'],
    swap: { text: 'Moitié moins de patate douce, double brocoli', saves: 110 },
    art: [{ p: 'cubes-orange', at: 'left' }, { p: 'florets', at: 'right' }, { p: 'fillet-salmon', at: 'main' }, { p: 'lemon', at: 'garnish' }]
  },
  {
    id: 'curry-pois-chiches', name: 'Curry de pois chiches aux épinards', minutes: 30, kcal: 620, protein: 'legumineuse', tags: [],
    ing: [{ n: 'Pois chiches', q: 120, u: 'g' }, { n: 'Épinards', q: 80, u: 'g' }, { n: 'Lait de coco', q: 100, u: 'ml' }, { n: 'Riz basmati', q: 70, u: 'g' }, { n: 'Oignon', q: 0.5, u: 'pièce' }, { n: 'Curry', q: 1, u: 'c. à s.' }],
    steps: ['Faites revenir l’oignon avec le curry 5 minutes.', 'Ajoutez les pois chiches et le lait de coco ; 10 minutes à feu doux.', 'Incorporez les épinards à la fin.', 'Servez avec le riz.'],
    swap: { text: 'Chou-fleur râpé à la place du riz', saves: 190 },
    art: [{ p: 'rice', at: 'west' }, { p: 'curry', at: 'east' }, { p: 'spinach', at: 'east' }, { p: 'chickpeas', at: 'east' }]
  },
  {
    id: 'tortilla-courgette', name: 'Tortilla de courgettes, salade de tomates', minutes: 20, kcal: 450, protein: 'oeuf', tags: [],
    ing: [{ n: 'Œufs', q: 3, u: 'pièce' }, { n: 'Courgette', q: 1, u: 'pièce' }, { n: 'Tomates', q: 2, u: 'pièce' }, { n: 'Oignon', q: 0.5, u: 'pièce' }, { n: 'Huile d’olive', q: 1, u: 'c. à s.' }],
    steps: ['Faites fondre l’oignon et la courgette en lamelles 8 minutes.', 'Battez les œufs, versez et laissez prendre la tortilla.', 'Servez avec les tomates en tranches, huile et sel.'],
    art: [{ p: 'omelette', at: 'west' }, { p: 'tomato-slices', at: 'right' }, { p: 'rocket', at: 'garnish' }]
  },
  {
    id: 'pates-pesto-roquette', name: 'Pâtes complètes au pesto de roquette', minutes: 25, kcal: 700, protein: 'fromage', tags: ['gluten', 'lactose'],
    ing: [{ n: 'Pâtes complètes', q: 100, u: 'g' }, { n: 'Roquette', q: 40, u: 'g' }, { n: 'Parmesan', q: 25, u: 'g' }, { n: 'Tomates cerises', q: 100, u: 'g' }, { n: 'Noix', q: 15, u: 'g' }],
    steps: ['Faites cuire les pâtes.', 'Mixez roquette, noix, parmesan et huile d’olive.', 'Mélangez avec les pâtes et les tomates cerises coupées.'],
    swap: { text: '70 g de pâtes et plus de tomates cerises', saves: 120 },
    art: [{ p: 'pasta', at: 'center' }, { p: 'cherry', at: 'center' }, { p: 'shavings', at: 'center' }]
  },
  {
    id: 'bowl-poulet-teriyaki', name: 'Bowl de poulet teriyaki et edamame', minutes: 30, kcal: 620, protein: 'volaille', tags: ['volaille'],
    ing: [{ n: 'Blanc de poulet', q: 140, u: 'g' }, { n: 'Edamame', q: 80, u: 'g' }, { n: 'Riz basmati', q: 70, u: 'g' }, { n: 'Sauce soja', q: 1, u: 'c. à s.' }, { n: 'Gingembre', q: 5, u: 'g' }],
    steps: ['Faites cuire le riz.', 'Saisissez le poulet en lamelles et laquez-le avec soja et gingembre.', 'Dressez le bowl avec les edamame.'],
    swap: { text: 'Sauce à part et demi-portion de riz', saves: 120 },
    art: [{ p: 'rice', at: 'west' }, { p: 'strips', at: 'east' }, { p: 'edamame', at: 'bottom' }]
  },
  {
    id: 'omelette-champignons', name: 'Omelette aux champignons et salade verte', minutes: 15, kcal: 420, protein: 'oeuf', tags: ['lactose'],
    ing: [{ n: 'Œufs', q: 3, u: 'pièce' }, { n: 'Champignons', q: 120, u: 'g' }, { n: 'Salade verte', q: 60, u: 'g' }, { n: 'Fromage râpé', q: 20, u: 'g' }],
    steps: ['Faites dorer les champignons émincés.', 'Versez les œufs battus, parsemez de fromage et pliez l’omelette.', 'Servez avec la salade assaisonnée.'],
    art: [{ p: 'omelette', at: 'west' }, { p: 'mushrooms', at: 'west' }, { p: 'salad', at: 'east' }]
  },
  {
    id: 'risotto-champignons', name: 'Risotto aux champignons', minutes: 40, kcal: 680, protein: 'fromage', tags: ['lactose'],
    ing: [{ n: 'Riz arborio', q: 90, u: 'g' }, { n: 'Champignons', q: 150, u: 'g' }, { n: 'Oignon', q: 0.5, u: 'pièce' }, { n: 'Parmesan', q: 25, u: 'g' }, { n: 'Bouillon', q: 300, u: 'ml' }],
    steps: ['Faites revenir l’oignon puis nacrez le riz.', 'Ajoutez le bouillon louche par louche pendant 18 minutes.', 'Incorporez les champignons poêlés et le parmesan.'],
    swap: { text: '65 g de riz et double champignons', saves: 110 },
    art: [{ p: 'risotto', at: 'center' }, { p: 'mushrooms', at: 'center' }, { p: 'shavings', at: 'center' }]
  },
  {
    id: 'wok-tofu', name: 'Wok de tofu et légumes croquants', minutes: 25, kcal: 480, protein: 'tofu', tags: [],
    ing: [{ n: 'Tofu', q: 150, u: 'g' }, { n: 'Poivron', q: 1, u: 'pièce' }, { n: 'Brocoli', q: 100, u: 'g' }, { n: 'Carotte', q: 1, u: 'pièce' }, { n: 'Riz basmati', q: 60, u: 'g' }, { n: 'Sauce soja', q: 1, u: 'c. à s.' }],
    steps: ['Faites cuire le riz.', 'Dorez le tofu en cubes à feu vif.', 'Ajoutez les légumes en lanières, 5 minutes, puis la sauce soja.'],
    art: [{ p: 'rice', at: 'west' }, { p: 'tofu', at: 'east' }, { p: 'pepper', at: 'east' }, { p: 'florets', at: 'bottom' }]
  },
  {
    id: 'chili-con-carne', name: 'Chili con carne', minutes: 45, kcal: 640, protein: 'viande', tags: ['viande'],
    ing: [{ n: 'Bœuf haché', q: 120, u: 'g' }, { n: 'Haricots rouges', q: 100, u: 'g' }, { n: 'Tomates concassées', q: 200, u: 'g' }, { n: 'Poivron', q: 0.5, u: 'pièce' }, { n: 'Oignon', q: 0.5, u: 'pièce' }, { n: 'Riz basmati', q: 60, u: 'g' }, { n: 'Cumin', q: 1, u: 'c. à s.' }],
    steps: ['Faites revenir oignon et poivron, puis la viande.', 'Ajoutez tomates, haricots et cumin ; 25 minutes à feu doux.', 'Servez avec le riz.'],
    swap: { text: 'Sans riz, avec une salade verte', saves: 210 },
    art: [{ p: 'rice', at: 'west' }, { p: 'tomato-sauce', at: 'east' }, { p: 'mince', at: 'east' }, { p: 'redbeans', at: 'east' }]
  },
  {
    id: 'soupe-lentilles', name: 'Soupe de lentilles corail au lait de coco', minutes: 30, kcal: 420, protein: 'legumineuse', tags: [],
    ing: [{ n: 'Lentilles corail', q: 70, u: 'g' }, { n: 'Carotte', q: 1, u: 'pièce' }, { n: 'Lait de coco', q: 50, u: 'ml' }, { n: 'Oignon', q: 0.5, u: 'pièce' }, { n: 'Cumin', q: 1, u: 'c. à s.' }],
    steps: ['Faites revenir oignon et carotte avec le cumin.', 'Ajoutez les lentilles et 500 ml d’eau ; 20 minutes.', 'Mixez avec le lait de coco.'],
    art: [{ p: 'soup', at: 'center' }, { p: 'swirl', at: 'center' }]
  },
  {
    id: 'tarte-poireaux', name: 'Tarte aux poireaux et lardons', minutes: 50, kcal: 620, protein: 'viande', tags: ['porc', 'gluten', 'lactose'],
    ing: [{ n: 'Pâte brisée', q: 0.25, u: 'pièce' }, { n: 'Poireau', q: 1, u: 'pièce' }, { n: 'Œufs', q: 1, u: 'pièce' }, { n: 'Crème', q: 50, u: 'ml' }, { n: 'Lardons', q: 40, u: 'g' }],
    steps: ['Faites fondre les poireaux émincés avec les lardons.', 'Garnissez la pâte, versez œufs et crème battus.', 'Enfournez 30 minutes à 190 °C.'],
    swap: { text: 'Une part plus fine et une grande salade', saves: 150 },
    art: [{ p: 'quiche', at: 'west' }, { p: 'salad', at: 'east' }]
  },
  {
    id: 'papillote-cabillaud', name: 'Papillote de cabillaud, courgettes et riz', minutes: 30, kcal: 480, protein: 'poisson', tags: ['poisson'],
    ing: [{ n: 'Cabillaud', q: 150, u: 'g' }, { n: 'Courgette', q: 1, u: 'pièce' }, { n: 'Riz basmati', q: 60, u: 'g' }, { n: 'Citron', q: 0.5, u: 'pièce' }],
    steps: ['Déposez le poisson sur les courgettes en rondelles dans du papier cuisson.', 'Ajoutez citron, sel, huile ; fermez et enfournez 18 minutes à 200 °C.', 'Servez avec le riz.'],
    art: [{ p: 'rice', at: 'left' }, { p: 'zucchini', at: 'right' }, { p: 'fillet-white', at: 'main' }, { p: 'lemon', at: 'garnish' }]
  },
  {
    id: 'salade-nicoise', name: 'Salade niçoise', minutes: 20, kcal: 520, protein: 'poisson', tags: ['poisson'],
    ing: [{ n: 'Thon', q: 1, u: 'boîte' }, { n: 'Œufs', q: 1, u: 'pièce' }, { n: 'Tomates', q: 2, u: 'pièce' }, { n: 'Haricots verts', q: 100, u: 'g' }, { n: 'Pommes de terre', q: 150, u: 'g' }, { n: 'Olives', q: 20, u: 'g' }],
    steps: ['Faites cuire pommes de terre, haricots et l’œuf.', 'Disposez le tout avec le thon, les tomates et les olives.', 'Assaisonnez à l’huile d’olive.'],
    art: [{ p: 'salad', at: 'center' }, { p: 'tomato-slices', at: 'right' }, { p: 'egg-half', at: 'left' }, { p: 'olives', at: 'top' }]
  },
  {
    id: 'rosti-oeuf', name: 'Rösti, œuf au plat et salade', minutes: 30, kcal: 600, protein: 'oeuf', tags: ['lactose'],
    ing: [{ n: 'Pommes de terre', q: 250, u: 'g' }, { n: 'Œufs', q: 1, u: 'pièce' }, { n: 'Salade verte', q: 60, u: 'g' }, { n: 'Beurre', q: 10, u: 'g' }],
    steps: ['Râpez les pommes de terre et pressez-les.', 'Faites dorer au beurre 8 minutes de chaque côté.', 'Servez avec un œuf au plat et la salade.'],
    swap: { text: 'Rösti plus petit et double salade', saves: 130 },
    art: [{ p: 'rosti', at: 'west' }, { p: 'fried-egg', at: 'west' }, { p: 'salad', at: 'east' }]
  },
  {
    id: 'poulet-roti', name: 'Poulet rôti, carottes et pommes de terre', minutes: 50, kcal: 680, protein: 'volaille', tags: ['volaille'],
    ing: [{ n: 'Cuisses de poulet', q: 1, u: 'pièce' }, { n: 'Pommes de terre', q: 200, u: 'g' }, { n: 'Carotte', q: 2, u: 'pièce' }, { n: 'Thym', q: 1, u: 'c. à s.' }],
    steps: ['Disposez poulet, pommes de terre et carottes dans un plat.', 'Huile, thym, sel ; 45 minutes à 200 °C.'],
    swap: { text: 'Sans la peau et moitié moins de pommes de terre', saves: 160 },
    art: [{ p: 'drumstick', at: 'main' }, { p: 'potatoes', at: 'left' }, { p: 'cubes-orange', at: 'right' }]
  },
  {
    id: 'gratin-courgettes-feta', name: 'Gratin de courgettes à la feta', minutes: 35, kcal: 520, protein: 'fromage', tags: ['lactose'],
    ing: [{ n: 'Courgette', q: 1.5, u: 'pièce' }, { n: 'Feta', q: 50, u: 'g' }, { n: 'Œufs', q: 1, u: 'pièce' }, { n: 'Tomates cerises', q: 80, u: 'g' }, { n: 'Pain', q: 40, u: 'g' }],
    steps: ['Disposez les courgettes en rondelles dans un plat.', 'Ajoutez l’œuf battu, la feta émiettée et les tomates.', 'Enfournez 25 minutes à 200 °C ; servez avec le pain.'],
    art: [{ p: 'zucchini', at: 'center' }, { p: 'feta', at: 'center' }, { p: 'cherry', at: 'center' }]
  },
  {
    id: 'fajitas-poulet', name: 'Fajitas de poulet aux poivrons', minutes: 30, kcal: 650, protein: 'volaille', tags: ['volaille', 'gluten', 'lactose'],
    ing: [{ n: 'Blanc de poulet', q: 120, u: 'g' }, { n: 'Poivron', q: 1, u: 'pièce' }, { n: 'Oignon', q: 0.5, u: 'pièce' }, { n: 'Tortillas', q: 2, u: 'pièce' }, { n: 'Yaourt nature', q: 50, u: 'g' }],
    steps: ['Saisissez poulet, poivron et oignon en lanières avec du cumin.', 'Garnissez les tortillas chaudes.', 'Ajoutez une cuillère de yaourt.'],
    swap: { text: 'Une seule tortilla et une salade', saves: 140 },
    art: [{ p: 'tortilla', at: 'west' }, { p: 'pepper', at: 'east' }, { p: 'strips', at: 'east' }]
  },
  {
    id: 'buddha-bowl-quinoa', name: 'Buddha bowl quinoa, pois chiches et avocat', minutes: 25, kcal: 560, protein: 'legumineuse', tags: [],
    ing: [{ n: 'Quinoa', q: 70, u: 'g' }, { n: 'Pois chiches', q: 80, u: 'g' }, { n: 'Avocat', q: 0.5, u: 'pièce' }, { n: 'Carotte', q: 1, u: 'pièce' }, { n: 'Épinards', q: 40, u: 'g' }],
    steps: ['Faites cuire le quinoa.', 'Rôtissez les pois chiches au cumin 10 minutes.', 'Dressez avec carotte râpée, épinards et avocat.'],
    swap: { text: 'Demi-portion de quinoa', saves: 120 },
    art: [{ p: 'quinoa', at: 'west' }, { p: 'chickpeas', at: 'top' }, { p: 'avocado', at: 'east' }, { p: 'spinach', at: 'bottom' }]
  },
  {
    id: 'spaghetti-bolognaise', name: 'Spaghetti bolognaise', minutes: 35, kcal: 720, protein: 'viande', tags: ['viande', 'gluten', 'lactose'],
    ing: [{ n: 'Spaghetti', q: 100, u: 'g' }, { n: 'Bœuf haché', q: 100, u: 'g' }, { n: 'Tomates concassées', q: 200, u: 'g' }, { n: 'Carotte', q: 0.5, u: 'pièce' }, { n: 'Oignon', q: 0.5, u: 'pièce' }, { n: 'Parmesan', q: 10, u: 'g' }],
    steps: ['Faites revenir oignon et carotte, puis la viande.', 'Ajoutez les tomates ; 20 minutes à feu doux.', 'Servez sur les spaghetti avec le parmesan.'],
    swap: { text: '70 g de pâtes et une salade', saves: 110 },
    art: [{ p: 'pasta', at: 'center' }, { p: 'tomato-sauce', at: 'main' }, { p: 'mince', at: 'main' }, { p: 'shavings', at: 'main' }]
  },
  {
    id: 'shakshuka', name: 'Shakshuka aux poivrons', minutes: 25, kcal: 430, protein: 'oeuf', tags: ['gluten'],
    ing: [{ n: 'Œufs', q: 2, u: 'pièce' }, { n: 'Tomates concassées', q: 250, u: 'g' }, { n: 'Poivron', q: 1, u: 'pièce' }, { n: 'Oignon', q: 0.5, u: 'pièce' }, { n: 'Pain', q: 50, u: 'g' }],
    steps: ['Faites revenir oignon et poivron 8 minutes.', 'Ajoutez les tomates et le cumin ; 8 minutes.', 'Creusez des nids, cassez-y les œufs et couvrez 6 minutes.'],
    art: [{ p: 'tomato-sauce', at: 'center' }, { p: 'pepper', at: 'center' }, { p: 'fried-egg', at: 'left' }, { p: 'fried-egg', at: 'right' }]
  }
];

export const recipeById = (id: string): Recipe | undefined => RECIPES.find(r => r.id === id);

export const PROTEIN_LABEL: Record<Protein, string> = {
  poisson: 'poisson', viande: 'viande', volaille: 'volaille', oeuf: 'œufs', legumineuse: 'légumineuses', tofu: 'tofu', fromage: 'fromage'
};
