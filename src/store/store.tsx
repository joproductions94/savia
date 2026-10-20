import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { HouseState, Member } from '../domain/types';
import { emptyState, memberOf, otherOf } from './actions';

const KEY = 'savia:v1';

function load(): HouseState | null {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as HouseState) : null;
    return s && s.version === 1 ? s : null;
  } catch {
    return null;
  }
}

function save(s: HouseState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage indisponible : on continue en mémoire */ }
}

export type Sheet =
  | { kind: 'add'; date?: string }
  | { kind: 'item'; id: string }
  | { kind: 'recipe'; recipeId: string }
  | { kind: 'inbox' }
  | { kind: 'profile' }
  | { kind: 'diet'; memberId: string };

export type Tab = 'today' | 'week' | 'dinner' | 'groceries';

interface Api {
  state: HouseState;
  update: (fn: (draft: HouseState) => void) => void;
  replace: (s: HouseState) => void;
  me: Member;
  other: Member;
  tab: Tab;
  go: (t: Tab) => void;
  sheet: Sheet | null;
  open: (s: Sheet) => void;
  close: () => void;
  toast: (text: string) => void;
  toastText: { id: number; text: string } | null;
}

const Ctx = createContext<Api | null>(null);

export function HouseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HouseState>(() => load() ?? emptyState());
  const [tab, setTab] = useState<Tab>('today');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [toastText, setToast] = useState<Api['toastText']>(null);
  const toastTimer = useRef<number>();

  useEffect(() => save(state), [state]);

  const update = useCallback((fn: (d: HouseState) => void) => {
    setState(prev => { const d = structuredClone(prev); fn(d); return d; });
  }, []);

  const toast = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const go = useCallback((t: Tab) => { setTab(t); window.scrollTo({ top: 0 }); }, []);

  const api = useMemo<Api>(() => ({
    state,
    update,
    replace: setState,
    me: memberOf(state, state.me),
    other: otherOf(state, state.me),
    tab, go,
    sheet, open: setSheet, close: () => setSheet(null),
    toast, toastText
  }), [state, update, tab, go, sheet, toast, toastText]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useHouse(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHouse hors de HouseProvider');
  return v;
}
