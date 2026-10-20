import { describe, expect, it } from 'vitest';
import { parseVoice } from './voice';
import type { Member } from './types';

const diet = { enabled: false, kcalDay: 0, dinnerShare: 0.35 };
const members: Member[] = [
  { id: 'jo', name: 'Jo', color: 'amber', diet, exclusions: [] },
  { id: 'sam', name: 'Sam', color: 'violet', diet, exclusions: [] }
];
const today = '2026-10-20'; // mardi
const parse = (t: string, ctx: 'auto' | 'shopping' | 'agenda' = 'auto') => parseVoice(t, today, members, 'jo', ctx);

describe('dictée : courses', () => {
  it('sépare les articles et retire les quantités', () => {
    expect(parse('Ajoute du lait, des œufs et deux kilos de pommes de terre aux courses')).toMatchObject({
      kind: 'shopping', items: ['Lait', 'Œufs', 'Pommes de terre']
    });
  });
  it('comprend une liste simple dans l’écran des courses', () => {
    expect(parse('tomates cerises, une boîte de thon et du pain', 'shopping')).toMatchObject({ items: ['Tomates cerises', 'Thon', 'Pain'] });
  });
});

describe('dictée : agenda', () => {
  it('crée un événement avec jour, heure et personne', () => {
    expect(parse('Dentiste mardi à 17h30 pour Sam')).toMatchObject({
      kind: 'agenda', title: 'Dentiste', itemKind: 'event', date: '2026-10-27', time: '17:30', assignee: 'sam'
    });
  });
  it('crée une tâche pour demain', () => {
    expect(parse('Rappelle-moi de sortir les poubelles demain soir')).toMatchObject({
      title: 'Sortir les poubelles', itemKind: 'task', date: '2026-10-21', time: null, assignee: 'jo'
    });
  });
  it('comprend « 20 heures » et un jour de la semaine', () => {
    expect(parse('Dîner chez Marta samedi à 20 heures')).toMatchObject({ title: 'Dîner chez Marta', date: '2026-10-24', time: '20:00', itemKind: 'event' });
  });
  it('comprend une date du mois et « ensemble »', () => {
    expect(parse('Appeler la banque ensemble le 2 novembre')).toMatchObject({ title: 'Appeler la banque', date: '2026-11-02', assignee: 'both' });
  });
});
