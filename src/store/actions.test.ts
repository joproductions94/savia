import { describe, expect, it } from 'vitest';
import { addItem, addMember, concerned, emptyState, ensureDinner, joinNames, removeMember, voteYes } from './actions';
import type { HouseState } from '../domain/types';

function family(): HouseState {
  const s = emptyState();
  s.onboarded = true;
  const jo = addMember(s, 'Jo'), sam = addMember(s, 'Sam');
  addMember(s, 'Léa');
  s.me = jo.id;
  void sam;
  return s;
}

describe('famille', () => {
  it('donne une couleur différente à chaque membre', () => {
    expect(new Set(family().members.map(m => m.color)).size).toBe(3);
  });
  it('écrit les prénoms comme en français', () => {
    expect(joinNames(['Sam'])).toBe('Sam');
    expect(joinNames(['Sam', 'Léa', 'Max'])).toBe('Sam, Léa et Max');
  });
  it('prévient tous les autres pour une tâche commune, jamais l’auteur', () => {
    const s = family();
    addItem(s, { title: 'Ranger le garage', kind: 'task', date: '2026-10-22', time: null, assignee: 'both' }, s.me, true);
    expect(s.notices.map(n => n.to).sort()).toEqual(s.members.filter(m => m.id !== s.me).map(m => m.id).sort());
    expect(concerned(s, 'both', s.me).map(m => m.name)).toEqual(['Sam', 'Léa']);
  });
  it('ne valide le dîner que quand tout le monde a dit oui', () => {
    const s = family();
    s.members.forEach(m => { m.diet.enabled = false; });
    ensureDinner(s, '2026-10-22');
    expect(voteYes(s, '2026-10-22', s.members[0].id)).toBe('waiting');
    expect(voteYes(s, '2026-10-22', s.members[1].id)).toBe('waiting');
    expect(voteYes(s, '2026-10-22', s.members[2].id)).toBe('confirmed');
  });
  it('rend communes les tâches d’un membre retiré', () => {
    const s = family();
    const lea = s.members[2];
    addItem(s, { title: 'Piano', kind: 'event', date: '2026-10-22', time: '17:00', assignee: lea.id }, s.me, false);
    removeMember(s, lea.id);
    expect(s.members).toHaveLength(2);
    expect(s.items[0].assignee).toBe('both');
  });
});
