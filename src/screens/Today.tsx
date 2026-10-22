import { useEffect } from 'react';
import { addDays, dayFull, isoWeek, todayISO } from '../domain/dates';
import { recipeById } from '../domain/recipes';
import type { AgendaItem, DinnerDay, HouseState, Member } from '../domain/types';
import { dayKcal, ensureDinner, joinNames, memberOf } from '../store/actions';
import { MealCard } from './Capture';
import * as I from '../ui/icons';
import { useHouse } from '../store/store';
import { Avatar, Hero, ItemRow, Plate, Section } from '../ui/components';

/** Le dîner du jour, créé à la première ouverture. */
export function useTonight() {
  const { state, update } = useHouse();
  const date = todayISO();
  const exists = !!state.dinners[date];
  useEffect(() => { if (!exists && state.members.length) update(d => ensureDinner(d, date)); }, [exists, date, update, state.members.length]);
  return { date, day: state.dinners[date] };
}

/** Où en est le vote du dîner, vu par une personne. */
export function dinnerStatus(s: HouseState, day: DinnerDay, meId: string) {
  const waiting = s.members.filter(m => day.votes[m.id] !== 'yes');
  const yes = s.members.length - waiting.length;
  if (day.status !== 'pending') return { short: 'Décidé', long: 'Validé par toute la famille', yes };
  if (day.votes[meId] === 'yes') return { short: 'Votre oui', long: `En attente de ${joinNames(waiting.map(m => m.name))}`, yes };
  if (yes > 0) return { short: 'À vous de voter', long: `${joinNames(s.members.filter(m => day.votes[m.id] === 'yes').map(m => m.name))} ${yes > 1 ? 'ont' : 'a'} dit oui. Il manque votre vote.`, yes };
  return { short: 'À voter', long: 'Personne n’a encore voté', yes };
}

const byTime = (a: AgendaItem, b: AgendaItem) => (a.time ?? '99').localeCompare(b.time ?? '99');
const isFor = (it: AgendaItem, m: Member) => it.assignee === m.id || it.assignee === 'both';

/** Tableau de bord personnel : ce qui me concerne d'abord, puis la famille. */
export function Today() {
  const { state, me, others, go, open } = useHouse();
  const { date, day } = useTonight();
  const tomorrowISO = addDays(date, 1);
  const mine = state.items.filter(i => i.date === date && isFor(i, me)).sort(byTime);
  const mineTomorrow = state.items.filter(i => i.date === tomorrowISO && isFor(i, me)).sort(byTime);
  const pending = mine.filter(i => !i.done).length;
  const recipe = day ? recipeById(day.recipeId) : undefined;
  const st = day ? dinnerStatus(state, day, me.id) : null;
  const unread = state.notices.filter(n => n.to === me.id && !n.read);
  const myMeals = state.meals.filter(m => m.date === date && m.memberId === me.id).sort((a, b) => a.at - b.at);
  const eaten = dayKcal(state, me.id, date);
  const hour = new Date().getHours();

  // Tâches sur ± 7 jours ; une tâche commune se partage entre tous.
  const load: Record<string, number> = Object.fromEntries(state.members.map(m => [m.id, 0]));
  state.items.filter(i => i.kind === 'task' && i.date >= addDays(date, -7) && i.date <= addDays(date, 7)).forEach(i => {
    if (i.assignee === 'both') state.members.forEach(m => { load[m.id] += 1 / state.members.length; });
    else load[i.assignee] = (load[i.assignee] ?? 0) + 1;
  });
  const total = Object.values(load).reduce((a, b) => a + b, 0) || 1;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

  const summary = [
    pending ? `${pending} chose${pending > 1 ? 's' : ''} pour vous aujourd’hui` : 'Rien à faire pour vous aujourd’hui',
    day?.status === 'pending' && day.votes[me.id] !== 'yes' ? 'le dîner attend votre vote' : null
  ].filter(Boolean).join(' · ');

  return (
    <>
      <Hero title={`Tableau de ${me.name}`}>
        <div className="me-head">
          <Avatar who={me.id} lg />
          <div><div className="eyebrow">{dayFull(date)} · Semaine {isoWeek(date)}</div><h1>{hour < 18 ? 'Bonjour' : 'Bonsoir'}, {me.name}</h1></div>
        </div>
        <p className="sub">{summary}.</p>
        <div className="tiles">
          <button className="tile" onClick={() => go('week')}><span className="k">Mes tâches</span><span className="v mono">{pending}</span><span className="s">aujourd’hui</span></button>
          {me.diet.enabled
            ? <button className="tile" onClick={() => open({ kind: 'meal' })}><span className="k">Calories</span><span className="v mono">{Math.max(0, me.diet.kcalDay - eaten).toLocaleString('fr-CH')}</span><span className="s">restantes</span></button>
            : <button className="tile" onClick={() => go('dinner')}><span className="k">Dîner</span><span className="v">{day?.status !== 'pending' && day ? 'Prêt' : `${st?.yes ?? 0}/${state.members.length}`}</span><span className="s">{st?.short}</span></button>}
          <button className="tile" onClick={() => open({ kind: 'inbox' })}><span className="k">Nouveautés</span><span className="v mono">{unread.length}</span><span className="s">de la famille</span></button>
        </div>
      </Hero>

      <div className="content">
        {recipe && st && (
          <div className="card dinner-card lift">
            <Plate recipe={recipe} size={76} />
            <div className="t"><span className="k">Dîner de ce soir</span><b>{recipe.name}</b><span className="st">{st.long}</span></div>
            <button className="btn small primary" onClick={() => go('dinner')}>{day?.status === 'pending' && day.votes[me.id] !== 'yes' ? 'Voter' : 'Voir'}</button>
          </div>
        )}
        {me.diet.enabled && <CalorieRing eaten={eaten} target={me.diet.kcalDay} onAdd={() => open({ kind: 'meal' })} />}

        <Section title="Pour vous aujourd’hui" aside={`${mine.length} au programme`}>
          {mine.length ? <div className="list boxed">{mine.map(i => <ItemRow key={i.id} it={i} showTime />)}</div> : <div className="empty">Rien pour vous. Touchez + pour ajouter une tâche.</div>}
        </Section>

        {unread.length > 0 && (
          <Section title="Nouveautés" aside={<button className="linkbtn inline" onClick={() => open({ kind: 'inbox' })}>Tout voir</button>}>
            <div className="list boxed">
              {unread.slice(0, 3).map(n => (
                <button key={n.id} className="notice-row" onClick={() => open({ kind: 'inbox' })}><Avatar who={n.from} /><span>{n.text}</span></button>
              ))}
            </div>
          </Section>
        )}

        <Section title="La famille aujourd’hui" aside="partagé">
          <div className="card family">
            {others.map(m => <FamilyRow key={m.id} member={m} items={state.items.filter(i => i.date === date && i.assignee === m.id).sort(byTime)} state={state} date={date} />)}
          </div>
        </Section>

        <Section title="Demain pour vous">
          {mineTomorrow.length ? <div className="list boxed">{mineTomorrow.map(i => <ItemRow key={i.id} it={i} showTime />)}</div> : <div className="empty">Rien de prévu demain.</div>}
        </Section>

        <Section title="Mes repas" aside={<button className="linkbtn inline" onClick={() => open({ kind: 'meal' })}><I.Camera size={15} /> Ajouter</button>}>
          {myMeals.length
            ? <div className="list boxed">{myMeals.map(m => <MealCard key={m.id} id={m.id} />)}</div>
            : <button className="empty empty-action" onClick={() => open({ kind: 'meal' })}><I.Camera size={18} /> Photographiez votre assiette et notez les grammes de chaque portion.</button>}
        </Section>

        <Section title="Répartition des tâches" aside="± 7 jours">
          <div className="card pad">
            <div className="balance">{state.members.map(m => <i key={m.id} className={m.color} style={{ width: `${(load[m.id] / total) * 100}%` }} />)}</div>
            <div className="share-legend">
              {state.members.map(m => <span key={m.id}><Avatar who={m.id} />{m.name}<b className="mono">{fmt(load[m.id])}</b></span>)}
            </div>
            <div className="fine">Une tâche « {state.members.length > 2 ? 'toute la famille' : 'tous les deux'} » se partage entre tous.</div>
          </div>
        </Section>
      </div>
    </>
  );
}

function FamilyRow({ member, items, state, date }: { member: Member; items: AgendaItem[]; state: HouseState; date: string }) {
  const { open } = useHouse();
  const left = items.filter(i => !i.done);
  const meals = state.meals.filter(m => m.memberId === member.id && m.date === date).length;
  const first = left[0];
  return (
    <button className="family-row" onClick={() => (first ? open({ kind: 'item', id: first.id }) : undefined)}>
      <Avatar who={member.id} lg />
      <span className="t">
        <b>{memberOf(state, member.id).name}</b>
        <span>{first ? `${first.time ? first.time + ' · ' : ''}${first.title}${left.length > 1 ? ` · +${left.length - 1}` : ''}` : items.length ? 'Tout est fait' : 'Rien de prévu'}</span>
      </span>
      <span className="family-meta">{meals > 0 && <span className="pill">{meals} repas</span>}<span className="mono">{left.length}</span></span>
    </button>
  );
}

function CalorieRing({ eaten, target, onAdd }: { eaten: number; target: number; onAdd: () => void }) {
  const r = 34, c = 2 * Math.PI * r, pct = Math.min(1, eaten / target), over = eaten > target;
  return (
    <div className="card cal-card">
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={over ? 'var(--no)' : 'var(--accent)'} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 42 42)" style={{ transition: 'stroke-dasharray .6s' }} />
      </svg>
      <div className="t">
        <span className="k">Mes calories aujourd’hui</span>
        <b className="mono">{eaten.toLocaleString('fr-CH')}<small> / {target.toLocaleString('fr-CH')}</small></b>
        <span className="st">{over ? `${(eaten - target).toLocaleString('fr-CH')} kcal au-dessus de l’objectif` : `${(target - eaten).toLocaleString('fr-CH')} kcal restantes`}</span>
      </div>
      <button className="btn small" onClick={onAdd} aria-label="Ajouter un repas"><I.Camera size={16} /></button>
    </div>
  );
}
