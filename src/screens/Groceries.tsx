import { useState, type FormEvent } from 'react';
import { AISLE_ORDER, aisleOf, isPerishable, KNOWN_INGREDIENTS, priceOf } from '../domain/ingredients';
import { recipeById } from '../domain/recipes';
import { rankRecipes } from '../domain/suggest';
import { todayISO } from '../domain/dates';
import {
  addFridge, addShopping, buyItem, fridgeNames, inShopping, missingFor, proposeDinner, removeFridge, removeShopping
} from '../store/actions';
import { useHouse } from '../store/store';
import { Hero, Plate, Section, Chips } from '../ui/components';
import * as I from '../ui/icons';

const chf = (v: number) => v.toFixed(2);
const DAY = 864e5;

export function Groceries() {
  const { state, update, me, other, toast, go } = useHouse();
  const [mode, setMode] = useState<'list' | 'fridge'>('list');
  const [text, setText] = useState('');
  const today = todayISO();
  const tonight = state.dinners[today];
  const suggestions = tonight && tonight.status !== 'cooked' ? missingFor(state, tonight.recipeId).filter(n => !inShopping(state, n)) : [];
  const total = state.shopping.reduce((t, s) => t + (priceOf(s.name) ?? 2.5), 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const raw = text.trim();
    if (!raw) return;
    if (mode === 'list') {
      let added: string[] = [];
      update(d => { added = addShopping(d, [raw], null, me.id); });
      setTimeout(() => toast(added.length ? `${added[0]} · ${aisleOf(added[0])}` : 'Déjà sur la liste'), 0);
    } else {
      let name: string | null = null;
      update(d => { name = addFridge(d, raw); });
      setTimeout(() => toast(name ? `${name} ajouté au frigo` : 'Déjà au frigo'), 0);
    }
    setText('');
  };

  const groups = new Map<string, typeof state.shopping>();
  state.shopping.forEach(s => { const a = aisleOf(s.name); groups.set(a, [...(groups.get(a) ?? []), s]); });

  const fridgeSorted = [...state.fridge].sort((a, b) => Number(isPerishable(b.name)) - Number(isPerishable(a.name)) || a.addedAt - b.addedAt);
  const ideas = rankRecipes({ members: state.members, fridge: fridgeNames(state) }).slice(0, 6);
  const age = (t: number) => { const d = Math.floor((Date.now() - t) / DAY); return d <= 0 ? 'aujourd’hui' : d === 1 ? 'hier' : `il y a ${d} jours`; };

  return (
    <>
      <Hero>
        <Chips label="Affichage" value={mode} onChange={setMode} options={[{ v: 'list', label: 'À acheter' }, { v: 'fridge', label: 'Frigo et placard' }]} />
        {mode === 'list' ? (
          <div className="bignum"><span className="v mono"><small>CHF</small>{chf(total)}</span><span className="r"><b className="mono">{state.shopping.length} article{state.shopping.length > 1 ? 's' : ''}</b>liste partagée avec {other.name}</span></div>
        ) : (
          <div className="bignum"><span className="v mono">{state.fridge.length}<small style={{ marginLeft: 6 }}>produits</small></span><span className="r"><b>{state.fridge.filter(f => isPerishable(f.name)).length} frais</b>à cuisiner en priorité</span></div>
        )}
        <form className="addbar" onSubmit={submit}>
          <input id="add-input" type="text" list="ingredients" value={text} onChange={e => setText(e.target.value)} autoComplete="off"
            placeholder={mode === 'list' ? 'Ajouter à la liste…' : 'Ajouter au frigo…'} aria-label={mode === 'list' ? 'Ajouter un article' : 'Ajouter un produit au frigo'} />
          <button className="btn small dark" type="submit">Ajouter</button>
        </form>
        <datalist id="ingredients">{KNOWN_INGREDIENTS.map(n => <option key={n} value={n} />)}</datalist>
        {mode === 'list' && suggestions.length > 0 && (
          <div className="suggest"><span>Pour le dîner :</span>{suggestions.map(n => (
            <button key={n} className="gchip" onClick={() => { update(d => { addShopping(d, [n], 'Dîner', me.id); }); toast(`${n} ajouté`); }}>+ {n}</button>
          ))}</div>
        )}
      </Hero>

      <div className="content">
        {mode === 'list' ? (
          <>
            {state.shopping.length === 0 && <div className="empty lift-empty">Liste vide. Ce que vous ajoutez apparaît aussi chez {other.name}.</div>}
            {AISLE_ORDER.filter(a => groups.has(a)).map(a => (
              <section key={a}>
                <div className="aisle"><span>{a}</span><span className="mono">{groups.get(a)!.length}</span></div>
                <div className="list boxed">
                  {groups.get(a)!.map(s => (
                    <div className="row" key={s.id}>
                      <button className="check" aria-label={`Acheté : ${s.name}`} onClick={() => { update(d => { buyItem(d, s.id); }); toast(`${s.name} rangé au frigo`); }} />
                      <div className="t"><b>{s.name}</b>{s.from && <span><span className="from">{s.from}</span></span>}</div>
                      <span className="mono muted price">{priceOf(s.name) ? chf(priceOf(s.name)!) : ''}</span>
                      <button className="more" aria-label={`Retirer ${s.name}`} onClick={() => update(d => removeShopping(d, s.id))}><I.Trash size={16} /></button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <p className="fine center">Cochez un article acheté : il passe automatiquement dans le frigo.</p>
          </>
        ) : (
          <>
            <Section title="Idées avec votre frigo" aside="classées par ce que vous avez">
              <div className="carousel">
                {ideas.map(a => (
                  <div className="card rc" key={a.recipe.id}>
                    <div className="art"><Plate recipe={a.recipe} size={104} /></div>
                    <div className="body">
                      <b>{a.recipe.name}</b>
                      <div className="bar"><i style={{ width: `${(a.have.length / (a.have.length + a.missing.length || 1)) * 100}%` }} /></div>
                      <span className="meta">{a.missing.length ? `Manque ${a.missing.join(', ')}` : 'Tout est au frigo'}</span>
                      {tonight && tonight.recipeId !== a.recipe.id && tonight.status === 'pending' && (
                        <button className="btn small" onClick={() => { update(d => proposeDinner(d, today, me.id, a.recipe.id)); toast(`Proposé pour ce soir : ${recipeById(a.recipe.id)!.name}`); go('dinner'); }}>Proposer ce soir</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Dans le frigo" aside={`${state.fridge.length}`}>
              {fridgeSorted.length ? (
                <div className="list boxed">
                  {fridgeSorted.map(f => (
                    <div className="row" key={f.id}>
                      <span className={`fresh ${isPerishable(f.name) ? 'on' : ''}`} aria-hidden="true"><I.Snow size={14} /></span>
                      <div className="t"><b>{f.name}</b><span>{isPerishable(f.name) ? 'Frais · ' : ''}ajouté {age(f.addedAt)}</span></div>
                      <button className="more" aria-label={`Retirer ${f.name}`} onClick={() => update(d => removeFridge(d, f.id))}><I.Trash size={16} /></button>
                    </div>
                  ))}
                </div>
              ) : <div className="empty">Le frigo est vide. Ajoutez ce que vous avez pour recevoir des idées de dîner.</div>}
            </Section>
          </>
        )}
      </div>
    </>
  );
}
