import { useEffect } from 'react';
import { addDays, dayFull, isoWeek, todayISO } from '../domain/dates';
import { recipeById } from '../domain/recipes';
import { dayKcal, ensureDinner } from '../store/actions';
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

export function dinnerStatus(votes: Record<string, 'yes' | null>, status: string, meId: string, otherName: string, otherId: string) {
  if (status !== 'pending') return { short: 'Décidé', long: 'Validé par vous deux' };
  if (votes[meId] === 'yes') return { short: 'Votre oui', long: `En attente de ${otherName}` };
  if (votes[otherId] === 'yes') return { short: 'Il manque 1 vote', long: `${otherName} a dit oui. Il manque votre vote.` };
  return { short: 'À voter', long: 'Personne n’a encore voté' };
}

export function Today() {
  const { state, me, other, go, open } = useHouse();
  const { date, day } = useTonight();
  const today = state.items.filter(i => i.date === date).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
  const tomorrow = state.items.filter(i => i.date === addDays(date, 1)).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
  const pending = today.filter(i => !i.done).length;
  const recipe = day ? recipeById(day.recipeId) : undefined;
  const st = day ? dinnerStatus(day.votes, day.status, me.id, other.name, other.id) : null;
  const yes = day ? state.members.filter(m => day.votes[m.id] === 'yes').length : 0;

  const load: Record<string, number> = Object.fromEntries(state.members.map(m => [m.id, 0]));
  state.items.filter(i => i.kind === 'task' && i.date >= addDays(date, -7) && i.date <= addDays(date, 7))
    .forEach(i => { if (i.assignee === 'both') state.members.forEach(m => { load[m.id] += 0.5; }); else load[i.assignee] = (load[i.assignee] ?? 0) + 1; });
  const total = Object.values(load).reduce((a, b) => a + b, 0) || 1;
  const hour = new Date().getHours();
  const meals = state.meals.filter(m => m.date === date).sort((a, b) => a.at - b.at);

  return (
    <>
      <Hero title="Aujourd’hui">
        <div className="eyebrow">{dayFull(date)} · Semaine {isoWeek(date)}</div>
        <h1>{hour < 18 ? 'Bonjour' : 'Bonsoir'}, {me.name}</h1>
        <p className="sub">{pending ? `${pending} chose${pending > 1 ? 's' : ''} à faire aujourd’hui.` : 'Rien d’urgent aujourd’hui.'} {day?.status === 'pending' ? 'Le dîner attend vos votes.' : day ? 'Le dîner est décidé.' : ''}</p>
        <div className="tiles">
          <button className="tile" onClick={() => go('week')}><span className="k">Aujourd’hui</span><span className="v mono">{pending}</span><span className="s">à faire</span></button>
          <button className="tile" onClick={() => go('dinner')}><span className="k">Dîner</span><span className="v">{day?.status !== 'pending' && day ? 'Prêt' : `${yes}/${state.members.length}`}</span><span className="s">{st?.short}</span></button>
          <button className="tile" onClick={() => go('groceries')}><span className="k">Courses</span><span className="v mono">{state.shopping.length}</span><span className="s">articles</span></button>
        </div>
      </Hero>
      <div className="content">
        {recipe && st && (
          <div className="card dinner-card lift">
            <Plate recipe={recipe} size={76} />
            <div className="t"><span className="k">Dîner de ce soir</span><b>{recipe.name}</b><span className="st">{st.long}</span></div>
            <button className="btn small primary" onClick={() => go('dinner')}>{day?.status === 'pending' ? 'Voter' : 'Voir'}</button>
          </div>
        )}
        {me.diet.enabled && <CalorieRing eaten={dayKcal(state, me.id, date)} target={me.diet.kcalDay} onAdd={() => open({ kind: 'meal' })} />}
        <Section title="Aujourd’hui" aside={`${today.length} au programme`}>
          {today.length ? <div className="list boxed">{today.map(i => <ItemRow key={i.id} it={i} showTime />)}</div> : <div className="empty">Rien de prévu. Touchez + pour ajouter une tâche.</div>}
        </Section>
        <Section title="Demain">
          {tomorrow.length ? <div className="list boxed">{tomorrow.map(i => <ItemRow key={i.id} it={i} showTime />)}</div> : <div className="empty">Rien de prévu demain.</div>}
        </Section>
        <Section title="Repas du jour" aside={<button className="linkbtn inline" onClick={() => open({ kind: 'meal' })}><I.Camera size={15} /> Ajouter</button>}>
          {meals.length
            ? <div className="list boxed">{meals.map(m => <MealCard key={m.id} id={m.id} />)}</div>
            : <button className="empty empty-action" onClick={() => open({ kind: 'meal' })}><I.Camera size={18} /> Photographiez votre assiette et notez les grammes de chaque portion.</button>}
        </Section>
        <Section title="Répartition des tâches" aside="± 7 jours">
          <div className="card pad">
            <div className="legend">
              <span><Avatar who={state.members[0].id} /><b>{state.members[0].name}</b></span>
              <b className="mono big-num">{load[state.members[0].id]} · {load[state.members[1].id]}</b>
              <span><b>{state.members[1].name}</b><Avatar who={state.members[1].id} /></span>
            </div>
            <div className="balance">
              {state.members.map(m => <i key={m.id} className={m.color} style={{ width: `${(load[m.id] / total) * 100}%` }} />)}
            </div>
            <div className="fine">Les tâches communes comptent pour moitié chacun.</div>
          </div>
        </Section>
      </div>
    </>
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
        <span className="k">Calories aujourd’hui</span>
        <b className="mono">{eaten.toLocaleString('fr-CH')}<small> / {target.toLocaleString('fr-CH')}</small></b>
        <span className="st">{over ? `${(eaten - target).toLocaleString('fr-CH')} kcal au-dessus de l’objectif` : `${(target - eaten).toLocaleString('fr-CH')} kcal restantes`}</span>
      </div>
      <button className="btn small" onClick={onAdd} aria-label="Ajouter un repas"><I.Camera size={16} /></button>
    </div>
  );
}
