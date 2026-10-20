import { useState } from 'react';
import { recipeById } from '../domain/recipes';
import { portionFor } from '../domain/nutrition';
import { priceOf } from '../domain/ingredients';
import { rankRecipes } from '../domain/suggest';
import type { RejectReason } from '../domain/types';
import {
  addShopping, fridgeNames, inShopping, markCooked, missingFor, proposeDinner, REASON_LABEL, recentDinners, rejectDinner, voteYes
} from '../store/actions';
import { useHouse } from '../store/store';
import { Avatar, Hero, Plate, Section } from '../ui/components';
import * as I from '../ui/icons';
import { useTonight } from './Today';
import { MealCard } from './Capture';

const chf = (v: number) => v.toFixed(2);

export function Dinner() {
  const { state, update, me, other, open, toast } = useHouse();
  const { date, day } = useTonight();
  const [asking, setAsking] = useState(false);
  if (!day) return null;
  const recipe = recipeById(day.recipeId)!;
  const missing = missingFor(state, recipe.id);
  const toBuy = missing.filter(n => !inShopping(state, n));
  const myVote = day.votes[me.id];
  const alts = rankRecipes({ members: state.members, fridge: fridgeNames(state), recent: recentDinners(state, date), exclude: [recipe.id] }).slice(0, 6);
  const have = recipe.ing.filter(i => !missing.includes(i.n)).length;
  const portions = state.members.map(m => ({ m, p: portionFor(recipe, m) }));
  const plates = state.meals.filter(m => m.date === date && m.meal === 'diner');

  const approve = () => {
    update(d => { voteYes(d, date, me.id); });
    toast(state.members.every(m => m.id === me.id || day.votes[m.id] === 'yes') ? 'Dîner validé par vous deux' : `Notification envoyée à ${other.name}`);
  };
  const reject = (r: RejectReason) => {
    let name = '';
    update(d => { name = rejectDinner(d, date, me.id, r); });
    setAsking(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => toast(`Nouvelle idée : ${name}`), 0);
  };

  return (
    <>
      <Hero className="dish" title="Dîner">
        <div className="eyebrow">Proposition pour ce soir</div>
        <h1>{recipe.name}</h1>
        <div className="chips">
          <span className="gchip mono">{recipe.minutes} min</span>
          <span className="gchip">{have}/{recipe.ing.length} au frigo</span>
          <span className="gchip mono">{portions.map(x => x.p.kcal).join(' · ')} kcal</span>
        </div>
      </Hero>
      <div className="plate-stage" key={recipe.id}><Plate recipe={recipe} size={220} /></div>
      <div className="content">
        <div className="votes">
          {state.members.map(m => (
            <div key={m.id} className={`vote ${day.votes[m.id] === 'yes' ? 'yes' : 'wait'}`}>
              <Avatar who={m.id} lg />
              <div className="t"><b>{m.id === me.id ? 'Vous' : m.name}</b><span>{day.votes[m.id] === 'yes' ? 'Oui, ça me dit' : 'Pas encore voté'}</span></div>
              <span className="ic">{day.votes[m.id] === 'yes' && <I.Check size={12} />}</span>
            </div>
          ))}
        </div>

        <div className="card panel">
          {day.status !== 'pending' ? (
            <>
              <div className="status-line"><span className="ic"><I.Check size={16} /></span><div>
                <b>{day.status === 'cooked' ? 'Bon appétit' : 'Dîner décidé'}</b>
                <span>{day.status === 'cooked' ? 'Les produits utilisés ont quitté le frigo.' : missing.length ? (toBuy.length ? `Il manque ${toBuy.join(', ')}.` : 'Ce qui manque est déjà sur la liste.') : 'Vous avez tout à la maison.'}</span>
              </div></div>
              <div className="actions" style={{ marginTop: 14 }}>
                {toBuy.length > 0 && <button className="btn primary" onClick={() => { update(d => { addShopping(d, toBuy, 'Dîner', me.id); }); toast(`${toBuy.length} ajouté${toBuy.length > 1 ? 's' : ''} aux courses`); }}>Ajouter {toBuy.length} aux courses</button>}
                {day.status === 'confirmed' && !toBuy.length && <button className="btn primary" onClick={() => { update(d => markCooked(d, date)); toast('Frigo mis à jour'); }}><I.Flame size={17} /> C’est cuisiné</button>}
                <button className="btn" onClick={() => open({ kind: 'recipe', recipeId: recipe.id })}><I.Book size={16} /> Recette</button>
              </div>
              <button className="photo-cta" onClick={() => open({ kind: 'meal', recipeId: recipe.id })}>
                <span className="ic"><I.Camera size={20} /></span>
                <span className="t"><b>Photo et portions</b><span>Photographiez votre assiette et ajustez les grammes</span></span>
                <I.ChevronR size={16} />
              </button>
              {plates.length > 0 && <div className="list boxed plates">{plates.map(m => <MealCard key={m.id} id={m.id} />)}</div>}
            </>
          ) : myVote === 'yes' ? (
            <>
              <div className="status-line"><span className="ic"><I.Clock size={17} /></span><div><b>En attente de {other.name}</b><span>{other.name} a reçu une notification. Le dîner est décidé quand vous dites oui tous les deux.</span></div></div>
              <div className="actions" style={{ marginTop: 14 }}>
                <button className="btn" onClick={() => open({ kind: 'recipe', recipeId: recipe.id })}><I.Book size={16} /> Recette</button>
                <button className="btn" onClick={() => setAsking(true)}><I.Swap size={17} /> Changer</button>
              </div>
            </>
          ) : (
            <>
              <div className="actions">
                <button className="btn primary" onClick={approve}><I.Check size={16} /> Ça me dit</button>
                <button className="btn" aria-expanded={asking} onClick={() => setAsking(!asking)}><I.Swap size={17} /> Autre idée</button>
              </div>
              <button className="linkbtn" onClick={() => open({ kind: 'recipe', recipeId: recipe.id })}><I.Book size={16} /> Voir la recette</button>
            </>
          )}
          {asking && (
            <>
              <div className="hr" />
              <b className="small-title">Pourquoi pas ce plat ?</b>
              <div className="fine">La raison choisit la prochaine proposition.</div>
              <div className="reasons">{(Object.keys(REASON_LABEL) as RejectReason[]).map(r => <button key={r} className="chip" onClick={() => reject(r)}>{REASON_LABEL[r]}</button>)}</div>
            </>
          )}
        </div>

        {missing.length > 0 && day.status === 'pending' && (
          <div className="reasons" style={{ marginTop: 12 }}>
            {missing.map(n => <span key={n} className="chip warn">Manque {n}{inShopping(state, n) ? ' · sur la liste' : priceOf(n) ? ` · CHF ${chf(priceOf(n)!)}` : ''}</span>)}
          </div>
        )}

        <Section title="Un plat, deux portions" aside="selon le régime">
          <div className="card">
            {portions.map(({ m, p }) => (
              <div className="portion" key={m.id}>
                <Avatar who={m.id} lg />
                <div className="t">
                  <b>{m.name} · {p.budget ? 'Objectif calories' : 'Sans régime'}</b>
                  <span>{p.swap ? `Version allégée : ${p.swap}` : p.factor < 1 ? 'Portion réduite' : 'Portion normale'}{p.factor < 1 ? ` (× ${String(p.factor).replace('.', ',')})` : ''}</span>
                  {p.budget && <div className="meter"><i className={m.color} style={{ width: `${Math.min(100, (p.kcal / (p.budget * 1.25)) * 100)}%` }} /><span className="cap" style={{ left: '80%' }} /></div>}
                </div>
                <div className="kc"><b className="mono">{p.kcal}</b><span>{p.budget ? `kcal · max ${p.budget}` : 'kcal'}</span></div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Avec ce que vous avez" aside="au frigo">
          <div className="carousel">
            {alts.map(a => (
              <div className="card rc" key={a.recipe.id}>
                <div className="art"><Plate recipe={a.recipe} size={104} /></div>
                <div className="body">
                  <b>{a.recipe.name}</b>
                  <span className="meta mono">{a.recipe.minutes} min · {state.members.map(m => portionFor(a.recipe, m).kcal).join('/')} kcal</span>
                  <div className="bar"><i style={{ width: `${(a.have.length / (a.have.length + a.missing.length || 1)) * 100}%` }} /></div>
                  <span className="meta">{a.missing.length ? `Manque ${a.missing.join(', ')}` : 'Tout est au frigo'}</span>
                  {a.rescues.length > 0 && <span className="meta rescue">Utilise {a.rescues.slice(0, 2).join(', ').toLowerCase()} avant qu’ils ne s’abîment</span>}
                  <button className="btn small" onClick={() => { update(d => proposeDinner(d, date, me.id, a.recipe.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); toast(`Proposition envoyée à ${other.name}`); }}>Proposer</button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
