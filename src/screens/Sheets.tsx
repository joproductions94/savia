import { useEffect, useState, type FormEvent } from 'react';
import { addDays, dayNum, dayShort, relativeDay, todayISO, weekDays } from '../domain/dates';
import { recipeById } from '../domain/recipes';
import { portionFor, scaledQty, dinnerBudget } from '../domain/nutrition';
import { isStaple } from '../domain/ingredients';
import { EXCLUSION_LABEL } from '../domain/recipes';
import type { Assignee } from '../domain/types';
import { addItem, deleteItem, emptyState, inShopping, memberOf, moveItem, nameOf, nudgeItem, toggleItem } from '../store/actions';
import { useHouse, type Sheet } from '../store/store';
import { Avatar, Chips, Plate, SheetFrame } from '../ui/components';
import { DietForm, draftOf, type DietDraft } from './DietForm';

function AddSheet({ date }: { date?: string }) {
  const { update, me, other, close, toast } = useHouse();
  const today = todayISO();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'task' | 'event'>('task');
  const [day, setDay] = useState(date ?? today);
  const [time, setTime] = useState('');
  const [who, setWho] = useState<Assignee>(other.id);
  const [tell, setTell] = useState(true);
  const next = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const notify = tell && who !== me.id;
    update(d => addItem(d, { title: title.trim(), kind, date: day, time: time || null, assignee: who }, me.id, notify));
    toast(notify ? `Enregistré · notification envoyée à ${other.name}` : 'Enregistré');
    close();
  };

  return (
    <form onSubmit={submit}>
      <h3>Nouvelle tâche ou événement</h3>
      <div className="sub">Partagé avec {other.name} dès l’enregistrement.</div>
      <label className="field" htmlFor="f-title"><span className="lbl">Quoi ?</span>
        <input id="f-title" className="big" type="text" autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Récupérer le colis" required /></label>
      <div className="field"><span className="lbl">Type</span>
        <Chips label="Type" value={kind} onChange={setKind} options={[{ v: 'task', label: 'Tâche' }, { v: 'event', label: 'Événement' }]} /></div>
      <div className="field"><span className="lbl">Quand ?</span>
        <Chips label="Jour" value={day} onChange={setDay} options={next.map(iso => ({ v: iso, label: iso === today ? 'Aujourd’hui' : `${dayShort(iso)} ${dayNum(iso)}` }))} />
        <div className="row-fields">
          <label htmlFor="f-date" className="mini-field"><span>Autre date</span><input id="f-date" type="date" value={day} onChange={e => e.target.value && setDay(e.target.value)} /></label>
          <label htmlFor="f-time" className="mini-field"><span>Heure (facultatif)</span><input id="f-time" type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
        </div>
      </div>
      <div className="field"><span className="lbl">Pour qui ?</span>
        <Chips<Assignee> label="Pour qui" value={who} onChange={setWho} options={[{ v: me.id, label: `${me.name} (vous)` }, { v: other.id, label: other.name }, { v: 'both', label: 'Tous les deux' }]} /></div>
      {who !== me.id && (
        <label className="toggle" htmlFor="f-tell"><span><b>Prévenir {other.name}</b><span>Une notification arrive tout de suite.</span></span>
          <input id="f-tell" type="checkbox" checked={tell} onChange={e => setTell(e.target.checked)} /></label>
      )}
      <div className="actions sheet-actions"><button type="button" className="btn" onClick={close}>Annuler</button><button className="btn primary" type="submit">Enregistrer</button></div>
    </form>
  );
}

function ItemSheet({ id }: { id: string }) {
  const { state, update, me, close, toast } = useHouse();
  const it = state.items.find(i => i.id === id);
  if (!it) return <p className="sub">Cet élément a été supprimé.</p>;
  const to = it.assignee === 'both' ? memberOf(state, state.members.find(m => m.id !== me.id)!.id) : memberOf(state, it.assignee);
  const days = weekDays(it.date);
  const move = (date: string) => {
    update(d => { moveItem(d, id, date, me.id); });
    toast(`Déplacé ${relativeDay(date)}${it.assignee !== me.id ? ` · notification envoyée à ${to.name}` : ''}`);
    close();
  };
  return (
    <>
      <h3>{it.title}</h3>
      <div className="sub">{[it.kind === 'task' ? 'Tâche' : 'Événement', relativeDay(it.date), it.time, nameOf(state, it.assignee)].filter(Boolean).join(' · ')}</div>
      <div className="field"><span className="lbl">Déplacer à</span>
        <div className="seg">{days.map(iso => <button key={iso} className={`chip${iso === it.date ? ' sel' : ''}`} onClick={() => move(iso)}>{dayShort(iso)} {dayNum(iso)}</button>)}</div>
        <div className="row-fields">
          <button className="chip" onClick={() => move(addDays(it.date, 7))}>Semaine suivante</button>
          <label htmlFor="i-date" className="mini-field inline"><span>Autre date</span><input id="i-date" type="date" defaultValue={it.date} onChange={e => e.target.value && move(e.target.value)} /></label>
        </div>
      </div>
      <div className="actions sheet-actions wrap">
        {it.kind === 'task' && <button className="btn" onClick={() => { update(d => toggleItem(d, id, me.id)); close(); }}>{it.done ? 'Marquer à faire' : 'Marquer comme fait'}</button>}
        {to.id !== me.id && <button className="btn primary" onClick={() => { update(d => nudgeItem(d, id, me.id)); toast(`Rappel envoyé à ${to.name}`); close(); }}>Le rappeler à {to.name}</button>}
      </div>
      <button className="linkbtn danger" onClick={() => { update(d => deleteItem(d, id)); toast('Supprimé'); close(); }}>Supprimer</button>
    </>
  );
}

function RecipeSheet({ recipeId }: { recipeId: string }) {
  const { state, close } = useHouse();
  const r = recipeById(recipeId)!;
  const stock = new Set(state.fridge.map(f => f.name));
  return (
    <>
      <div className="recipe-hero"><Plate recipe={r} size={84} /><div><h3>{r.name}</h3><span className="mono">{r.minutes} min · {state.members.length} portions</span></div></div>
      <div className="sec"><h2>Ingrédients</h2><span>quantités par personne</span></div>
      <div className="card ing-table">
        <div className="ing head"><span>Produit</span>{state.members.map(m => <span key={m.id}>{m.name}</span>)}<span /></div>
        {r.ing.map(i => (
          <div className="ing" key={i.n}>
            <span>{i.n}</span>
            {state.members.map(m => <span key={m.id} className="mono">{scaledQty(i, portionFor(r, m).factor)}</span>)}
            {isStaple(i.n) ? <span className="l">Placard</span> : stock.has(i.n) ? <span className="y">Au frigo</span> : inShopping(state, i.n) ? <span className="l">Sur la liste</span> : <span className="n">Manque</span>}
          </div>
        ))}
      </div>
      <div className="sec"><h2>Étapes</h2></div>
      <ol className="steps">{r.steps.map(s => <li key={s}>{s}</li>)}</ol>
      {state.members.map(m => {
        const p = portionFor(r, m);
        if (!p.budget) return null;
        return <div className={`note ${m.color}`} key={m.id}><b>Pour {m.name} :</b> {p.swap ? `${p.swap}. ` : ''}{p.factor < 1 ? `Portion × ${String(p.factor).replace('.', ',')}. ` : ''}Environ <span className="mono">{p.kcal} kcal</span> pour un objectif de {p.budget} kcal au dîner.</div>;
      })}
      <div className="actions sheet-actions"><button className="btn" onClick={close}>Fermer</button></div>
    </>
  );
}

function InboxSheet() {
  const { state, update, me, other, close } = useHouse();
  const list = state.notices.filter(n => n.to === me.id);
  useEffect(() => { if (list.some(n => !n.read)) update(d => d.notices.forEach(n => { if (n.to === me.id) n.read = true; })); }, [list, update, me.id]);
  const when = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'à l’instant' : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`; };
  return (
    <>
      <h3>Notifications</h3>
      <div className="sub">Ce que {other.name} a fait et qui vous concerne.</div>
      <div className="notifs">
        {list.length ? list.map(n => (
          <div className={`notif${n.read ? '' : ' unread'}`} key={n.id}><Avatar who={n.from} lg /><div className="t">{n.text}<div className="w">{when(n.at)}</div></div></div>
        )) : <p className="fine">Rien pour l’instant. Quand {other.name} déplace une tâche, vous confie quelque chose ou vote pour le dîner, vous le verrez ici.</p>}
      </div>
      <div className="actions sheet-actions"><button className="btn" onClick={close}>Fermer</button></div>
    </>
  );
}

function ProfileSheet() {
  const { state, update, replace, me, open, close, toast } = useHouse();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <>
      <h3>Profils</h3>
      <div className="sub">Régimes, exclusions et personne qui utilise cet appareil.</div>
      <div className="card profiles">
        {state.members.map(m => {
          const b = dinnerBudget(m);
          return (
            <div className="profile" key={m.id}>
              <Avatar who={m.id} lg />
              <div className="t"><b>{m.name}{m.id === me.id ? ' (cet appareil)' : ''}</b>
                <span>{b ? `${m.diet.kcalDay} kcal / jour · dîner ${b} kcal` : 'Sans régime'}{m.exclusions.length ? ' · ' + m.exclusions.map(x => EXCLUSION_LABEL[x]).join(', ') : ''}</span></div>
              <button className="btn small" onClick={() => open({ kind: 'diet', memberId: m.id })}>Modifier</button>
            </div>
          );
        })}
      </div>
      <div className="field"><span className="lbl">Utiliser l’application en tant que</span>
        <Chips label="Utilisateur" value={me.id} onChange={v => { update(d => { d.me = v; }); toast(`Vous utilisez Savia en tant que ${memberOf(state, v).name}`); close(); }}
          options={state.members.map(m => ({ v: m.id, label: m.name }))} />
        <p className="fine">Sur ce prototype, les deux profils partagent cet appareil. La synchronisation entre deux téléphones arrive avec les comptes en ligne.</p>
      </div>
      <div className="actions sheet-actions"><button className="btn" onClick={close}>Fermer</button></div>
      {!confirmReset
        ? <button className="linkbtn danger" onClick={() => setConfirmReset(true)}>Effacer toutes les données</button>
        : <div className="confirm"><span>Tout effacer sur cet appareil ?</span><button className="btn small" onClick={() => setConfirmReset(false)}>Non</button><button className="btn small danger" onClick={() => { close(); replace(emptyState()); }}>Oui, effacer</button></div>}
    </>
  );
}

function DietSheet({ memberId }: { memberId: string }) {
  const { state, update, open, toast } = useHouse();
  const m = memberOf(state, memberId);
  const [draft, setDraft] = useState<DietDraft>(() => draftOf(m));
  const save = () => {
    update(d => { const x = d.members.find(y => y.id === memberId)!; x.diet = { enabled: draft.enabled, kcalDay: draft.kcalDay, dinnerShare: draft.dinnerShare }; x.exclusions = draft.exclusions; });
    toast(`Profil de ${m.name} enregistré`);
    open({ kind: 'profile' });
  };
  return (
    <>
      <h3>Repas de {m.name}</h3>
      <div className="sub">Les portions et les propositions de dîner en tiennent compte.</div>
      <DietForm idPrefix={`diet-${memberId}`} name={m.name} value={draft} onChange={setDraft} />
      <div className="actions sheet-actions"><button className="btn" onClick={() => open({ kind: 'profile' })}>Annuler</button><button className="btn primary" onClick={save}>Enregistrer</button></div>
    </>
  );
}

const keyOf = (s: Sheet | null) => (s ? JSON.stringify(s) : null);

export function SheetHost() {
  const { sheet, close } = useHouse();
  let body = null;
  if (sheet?.kind === 'add') body = <AddSheet date={sheet.date} />;
  if (sheet?.kind === 'item') body = <ItemSheet id={sheet.id} />;
  if (sheet?.kind === 'recipe') body = <RecipeSheet recipeId={sheet.recipeId} />;
  if (sheet?.kind === 'inbox') body = <InboxSheet />;
  if (sheet?.kind === 'profile') body = <ProfileSheet />;
  if (sheet?.kind === 'diet') body = <DietSheet memberId={sheet.memberId} />;
  return <SheetFrame openKey={keyOf(sheet)} onClose={close}>{body && <div key={keyOf(sheet)!}>{body}</div>}</SheetFrame>;
}

