export type MemberId = string;
export type Assignee = MemberId | 'both';

export type Exclusion = 'vegetarien' | 'sans-gluten' | 'sans-lactose' | 'sans-porc' | 'sans-poisson';

export interface Diet {
  enabled: boolean;
  /** Calories que la personne mange par jour. */
  kcalDay: number;
  /** Part de la journée réservée au dîner (0.25 – 0.40). */
  dinnerShare: number;
}

export interface Member {
  id: MemberId;
  name: string;
  color: 'amber' | 'violet';
  diet: Diet;
  exclusions: Exclusion[];
}

export interface AgendaItem {
  id: string;
  title: string;
  kind: 'task' | 'event';
  /** Date locale au format AAAA-MM-JJ. */
  date: string;
  time: string | null;
  assignee: Assignee;
  done: boolean;
  createdBy: MemberId;
}

export interface Notice {
  id: string;
  to: MemberId;
  from: MemberId;
  text: string;
  at: number;
  read: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  from: string | null;
  addedBy: MemberId;
}

export interface FridgeItem {
  id: string;
  name: string;
  addedAt: number;
}

export type RejectReason = 'lourd' | 'long' | 'recent' | 'envie';
export type Vote = 'yes' | null;

export interface DinnerDay {
  date: string;
  recipeId: string;
  votes: Record<MemberId, Vote>;
  rejected: string[];
  status: 'pending' | 'confirmed' | 'cooked';
}

export interface HouseState {
  version: 1;
  onboarded: boolean;
  members: Member[];
  me: MemberId;
  items: AgendaItem[];
  notices: Notice[];
  shopping: ShoppingItem[];
  fridge: FridgeItem[];
  dinners: Record<string, DinnerDay>;
}
