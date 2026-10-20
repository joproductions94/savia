import { useEffect, useMemo, useRef, useState } from 'react';
import { dayLong, relativeDay, todayISO } from '../domain/dates';
import { canonical, gramsOf, isStaple, kcal100Of, KNOWN_INGREDIENTS } from '../domain/ingredients';
import { portionFor, dinnerBudget } from '../domain/nutrition';
import { recipeById } from '../domain/recipes';
import { parseVoice, type VoiceResult } from '../domain/voice';
import type { MealKind, MealLine } from '../domain/types';
import { addItem, addShopping, dayKcal, deleteMeal, mealKcal, memberOf, nameOf, saveMeal, uid } from '../store/actions';
import { compressPhoto, deleteMedia, putMedia } from '../store/media';
import { useHouse } from '../store/store';
import { Chips, Segmented } from '../ui/components';
import { canDictate, canRecord, haptic, useDictation, useMediaUrl, useRecorder } from '../ui/device';
import * as I from '../ui/icons';

/* ---------------- menu « + » ---------------- */

export function CreateSheet() {
  const { open, go, close } = useHouse();
  const Option = ({ icon, title, text, onClick, accent }: { icon: React.ReactNode; title: string; text: string; onClick: () => void; accent?: boolean }) => (
    <button className={`create-opt${accent ? ' accent' : ''}`} onClick={() => { haptic(); onClick(); }}>
      <span className="ic">{icon}</span>
      <span className="t"><b>{title}</b><span>{text}</span></span>
      <I.ChevronR size={16} />
    </button>
  );
  return (
    <>
      <h3>Ajouter</h3>
      <div className="sub">Dites-le, écrivez-le ou prenez une photo.</div>
      <div className="create-list">
        <Option accent icon={<I.Mic size={22} />} title="Dicter une note vocale" text="« Dentiste mardi à 17 h 30 pour Sam » ou « Ajoute du lait et des œufs »" onClick={() => open({ kind: 'voice', context: 'auto' })} />
        <Option icon={<I.TabWeek size={22} />} title="Tâche ou événement" text="Choisissez le jour, l’heure et la personne" onClick={() => open({ kind: 'add' })} />
        <Option icon={<I.TabBag size={22} />} title="Article de courses" text="Ajoutez à la liste partagée" onClick={() => { close(); go('groceries'); setTimeout(() => document.getElementById('add-input')?.focus(), 350); }} />
        <Option icon={<I.Camera size={22} />} title="Photo d’un repas" text="Photographiez l’assiette et notez les grammes" onClick={() => open({ kind: 'meal' })} />
      </div>
    </>
  );
}

/* ---------------- dictée ---------------- */

export function VoicePlayer({ id }: { id: string }) {
  const url = useMediaUrl(id);
  return (
    <div className="voice-player">
      <span className="ic"><I.Mic size={16} /></span>
      {url ? <audio controls src={url} preload="metadata" /> : <span className="fine">Note vocale enregistrée sur l’autre appareil.</span>}
    </div>
  );
}

function Waves({ active }: { active: boolean }) {
  return <span className={`waves${active ? ' on' : ''}`} aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</span>;
}

export function VoiceSheet({ context }: { context: 'auto' | 'shopping' }) {
  const { state, update, me, other, open, close, toast } = useHouse();
  const today = todayISO();
  const dictation = useDictation('fr-FR');
  const recorder = useRecorder();
  const [typed, setTyped] = useState('');
  const [mode, setMode] = useState<'auto' | 'agenda' | 'shopping'>(context);
  const dictates = canDictate();
  const records = !dictates && canRecord();
  const text = (dictates ? dictation.text : '') || typed;
  const listening = dictation.state === 'listening' || recorder.recording;

  const result: VoiceResult | null = useMemo(() => {
    if (!text.trim()) return null;
    return parseVoice(text, today, state.members, me.id, mode === 'auto' ? 'auto' : mode);
  }, [text, today, state.members, me.id, mode]);

  useEffect(() => { if (dictation.state === 'done') haptic(); }, [dictation.state]);

  const mic = () => {
    haptic();
    if (dictates) return dictation.state === 'listening' ? dictation.stop() : dictation.start();
    if (records) return recorder.recording ? recorder.stop() : recorder.start();
  };

  const voiceId = async () => {
    if (!recorder.blob) return undefined;
    const id = uid();
    await putMedia(id, recorder.blob);
    return id;
  };

  const create = async () => {
    const vid = await voiceId();
    if (result?.kind === 'shopping') {
      let added: string[] = [];
      update(d => { added = addShopping(d, result.items, 'Dictée', me.id); });
      setTimeout(() => toast(added.length ? `${added.length} article${added.length > 1 ? 's' : ''} ajouté${added.length > 1 ? 's' : ''} aux courses` : 'Déjà sur la liste'), 0);
    } else if (result?.kind === 'agenda') {
      const tell = result.assignee !== me.id;
      update(d => addItem(d, { title: result.title, kind: result.itemKind, date: result.date, time: result.time, assignee: result.assignee, voiceId: vid }, me.id, tell));
      toast(tell ? `Créé · notification envoyée à ${other.name}` : 'Créé');
    } else if (vid) {
      // Enregistrement sans texte : on garde la note vocale comme tâche du jour.
      update(d => addItem(d, { title: `Note vocale de ${me.name}`, kind: 'task', date: today, time: null, assignee: 'both', voiceId: vid }, me.id, true));
      toast(`Note vocale partagée avec ${other.name}`);
    }
    close();
  };

  const edit = async () => {
    if (result?.kind !== 'agenda') return;
    const vid = await voiceId();
    open({ kind: 'add', draft: { title: result.title, kind: result.itemKind, date: result.date, time: result.time, assignee: result.assignee, voiceId: vid } });
  };

  const status = dictation.state === 'listening' ? 'Je vous écoute…'
    : recorder.recording ? `Enregistrement · 0:${String(recorder.seconds).padStart(2, '0')}`
    : recorder.blob ? 'Note vocale prête'
    : dictates ? 'Touchez le micro et parlez' : records ? 'Touchez pour enregistrer une note vocale' : 'Le micro n’est pas disponible ici';

  return (
    <>
      <h3>Note vocale</h3>
      <div className="sub">Parlez naturellement, Savia range la phrase au bon endroit.</div>

      <div className={`mic-stage${listening ? ' live' : ''}`}>
        <button className="mic" onClick={mic} disabled={!dictates && !records} aria-label={listening ? 'Arrêter' : 'Parler'}>
          {listening ? <I.Stop size={26} /> : <I.Mic size={30} />}
        </button>
        <Waves active={listening} />
        <span className="mic-status">{status}</span>
      </div>
      {(dictation.error || recorder.error) && <p className="form-error">{dictation.error ?? recorder.error}</p>}

      {dictates && dictation.text && (
        <label className="field" htmlFor="v-text"><span className="lbl">Transcription (modifiable)</span>
          <textarea id="v-text" rows={2} value={dictation.text} onChange={e => dictation.setText(e.target.value)} /></label>
      )}
      {!dictation.text && (
        <label className="field" htmlFor="v-typed"><span className="lbl">{dictates || records ? 'Ou écrivez la phrase' : 'Écrivez la phrase'}</span>
          <textarea id="v-typed" rows={2} value={typed} onChange={e => setTyped(e.target.value)} placeholder="Dentiste mardi à 17 h 30 pour Sam" /></label>
      )}

      {result && (
        <div className="parsed card">
          <div className="parsed-head">
            <span className="eyebrow-dark">Savia a compris</span>
            <Segmented label="Ranger dans" value={mode === 'auto' ? result.kind : mode} onChange={v => setMode(v)}
              options={[{ v: 'agenda', label: 'Agenda' }, { v: 'shopping', label: 'Courses' }]} />
          </div>
          {result.kind === 'shopping' ? (
            result.items.length
              ? <div className="seg">{result.items.map(n => <span className="chip" key={n}>{n}</span>)}</div>
              : <p className="fine">Aucun article reconnu. Séparez-les par « et » ou des virgules.</p>
          ) : (
            <div className="parsed-event">
              <b>{result.title}</b>
              <dl>
                <div><dt>Type</dt><dd>{result.itemKind === 'event' ? 'Événement' : 'Tâche'}</dd></div>
                <div><dt>Quand</dt><dd>{relativeDay(result.date)}{result.time ? ` · ${result.time}` : ''}</dd></div>
                <div><dt>Pour</dt><dd>{nameOf(state, result.assignee)}</dd></div>
              </dl>
            </div>
          )}
        </div>
      )}

      <div className="actions sheet-actions">
        {result?.kind === 'agenda' ? <button className="btn" onClick={edit}>Modifier</button> : <button className="btn" onClick={close}>Annuler</button>}
        <button className="btn primary" disabled={!result && !recorder.blob} onClick={create}>
          {result?.kind === 'shopping' ? 'Ajouter aux courses' : 'Créer'}
        </button>
      </div>
    </>
  );
}

/* ---------------- photo et portions ---------------- */

export const MEAL_LABEL: Record<MealKind, string> = { 'petit-dej': 'Petit-déjeuner', dejeuner: 'Déjeuner', diner: 'Dîner', collation: 'Collation' };
const mealNow = (): MealKind => { const h = new Date().getHours(); return h < 10 ? 'petit-dej' : h < 15 ? 'dejeuner' : h < 18 ? 'collation' : 'diner'; };

export function MealSheet({ id, recipeId }: { id?: string; recipeId?: string }) {
  const { state, update, me, close, toast } = useHouse();
  const today = todayISO();
  const existing = id ? state.meals.find(m => m.id === id) : undefined;
  const tonight = state.dinners[today];
  const recipe = recipeById(recipeId ?? existing?.recipeId ?? (tonight && tonight.status !== 'pending' ? tonight.recipeId : '') ?? '');
  const owner = existing ? memberOf(state, existing.memberId) : me;

  const initialLines = (): MealLine[] => {
    if (existing) return existing.lines;
    if (!recipe) return [];
    const f = portionFor(recipe, owner).factor;
    return recipe.ing.filter(i => !isStaple(i.n) || i.n === 'Huile d’olive').map(i => ({
      name: i.n, grams: Math.max(5, Math.round((gramsOf(i.n, i.q, i.u) * f) / 5) * 5), kcal100: kcal100Of(i.n) ?? 100
    }));
  };

  const [meal, setMeal] = useState<MealKind>(existing?.meal ?? (recipe ? 'diner' : mealNow()));
  const [title, setTitle] = useState(existing?.title ?? recipe?.name ?? '');
  const [lines, setLines] = useState<MealLine[]>(initialLines);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const storedUrl = useMediaUrl(existing?.photoId);
  const [newName, setNewName] = useState('');
  const [newGrams, setNewGrams] = useState('100');
  const [newKcal, setNewKcal] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const total = mealKcal(lines);
  const budget = dinnerBudget(owner);
  const day = dayKcal(state, owner.id, existing?.date ?? today) - (existing ? mealKcal(existing.lines) : 0) + total;
  const knownKcal = kcal100Of(canonical(newName || ' '));

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const blob = await compressPhoto(f);
    setPhoto(blob);
    setPhotoUrl(URL.createObjectURL(blob));
  };

  const setGrams = (i: number, g: number) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, grams: Math.max(0, Math.min(2000, Math.round(g))) } : l)));

  const addLine = () => {
    const name = canonical(newName);
    const kcal = knownKcal ?? Number(newKcal);
    if (!newName.trim() || !Number(newGrams) || !kcal) return;
    setLines(ls => [...ls, { name, grams: Number(newGrams), kcal100: kcal }]);
    setNewName(''); setNewGrams('100'); setNewKcal('');
  };

  const save = async () => {
    let photoId = existing?.photoId ?? null;
    if (photo) {
      if (photoId) await deleteMedia(photoId);
      photoId = uid();
      await putMedia(photoId, photo);
    }
    update(d => saveMeal(d, {
      id: existing?.id ?? uid(), memberId: owner.id, date: existing?.date ?? today, meal, title: title.trim() || MEAL_LABEL[meal],
      recipeId: recipe?.id ?? null, photoId, lines: lines.filter(l => l.grams > 0), at: existing?.at ?? Date.now()
    }));
    toast(`${MEAL_LABEL[meal]} enregistré · ${total} kcal`);
    close();
  };

  const shown = photoUrl ?? storedUrl;
  const dailyTarget = owner.diet.enabled ? owner.diet.kcalDay : null;

  return (
    <>
      <h3>{existing ? 'Modifier le repas' : 'Photo et portions'}</h3>
      <div className="sub">{owner.id === me.id ? 'Votre assiette' : `Assiette de ${owner.name}`} · {relativeDay(existing?.date ?? today)}</div>

      <input ref={fileRef} id="meal-photo" type="file" accept="image/*" capture="environment" hidden onChange={e => onFile(e.target.files?.[0])} />
      {shown ? (
        <div className="photo-frame">
          <img src={shown} alt={`Photo de ${title || 'l’assiette'}`} />
          <button className="glass-btn retake" onClick={() => fileRef.current?.click()}><I.Camera size={15} /> Reprendre</button>
        </div>
      ) : (
        <button className="photo-drop" onClick={() => fileRef.current?.click()}>
          <span className="ic"><I.Camera size={26} /></span>
          <b>Prendre une photo de l’assiette</b>
          <span>ou choisir une image dans la galerie</span>
        </button>
      )}

      <div className="field"><span className="lbl">Repas</span>
        <Chips label="Repas" value={meal} onChange={setMeal} options={(Object.keys(MEAL_LABEL) as MealKind[]).map(k => ({ v: k, label: MEAL_LABEL[k] }))} /></div>
      <label className="field" htmlFor="meal-title"><span className="lbl">Nom du plat</span>
        <input id="meal-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Salade de quinoa" /></label>

      <div className="sec"><h2>Grammes</h2><span>{recipe && !existing ? 'pré-remplis selon votre portion' : 'pesez ou estimez'}</span></div>
      <div className="card grams">
        {lines.length === 0 && <p className="fine pad-x">Ajoutez chaque aliment avec son poids.</p>}
        {lines.map((l, i) => (
          <div className="gline" key={`${l.name}-${i}`}>
            <div className="t"><b>{l.name}</b><span className="mono">{Math.round((l.grams * l.kcal100) / 100)} kcal</span></div>
            <div className="stepper">
              <button aria-label={`Moins de ${l.name}`} onClick={() => setGrams(i, l.grams - 10)}>−</button>
              <label className="with-unit"><input type="number" inputMode="numeric" aria-label={`Grammes de ${l.name}`} value={l.grams} onChange={e => setGrams(i, Number(e.target.value) || 0)} /><em>g</em></label>
              <button aria-label={`Plus de ${l.name}`} onClick={() => setGrams(i, l.grams + 10)}>+</button>
            </div>
            <button className="more" aria-label={`Retirer ${l.name}`} onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}><I.Trash size={15} /></button>
          </div>
        ))}
        <div className="gline add-line">
          <input type="text" list="ingredients-all" aria-label="Aliment" placeholder="Aliment" value={newName} onChange={e => setNewName(e.target.value)} />
          <label className="with-unit small"><input type="number" inputMode="numeric" aria-label="Grammes" value={newGrams} onChange={e => setNewGrams(e.target.value)} /><em>g</em></label>
          {newName && !knownKcal && <label className="with-unit small"><input type="number" inputMode="numeric" aria-label="Calories pour 100 g" placeholder="kcal" value={newKcal} onChange={e => setNewKcal(e.target.value)} /><em>/100 g</em></label>}
          <button className="btn small dark" onClick={addLine} disabled={!newName.trim()}>Ajouter</button>
        </div>
        <datalist id="ingredients-all">{KNOWN_INGREDIENTS.map(n => <option key={n} value={n} />)}</datalist>
      </div>

      <div className="kcal-sum card">
        <div><span className="lbl">Total de l’assiette</span><b className="mono">{total.toLocaleString('fr-CH')} kcal</b></div>
        {budget && meal === 'diner' && <Meter value={total} max={budget} label={`Objectif dîner ${budget} kcal`} color={owner.color} />}
        {dailyTarget && <Meter value={day} max={dailyTarget} label={`Aujourd’hui ${day.toLocaleString('fr-CH')} / ${dailyTarget.toLocaleString('fr-CH')} kcal`} color={owner.color} />}
      </div>

      <div className="actions sheet-actions">
        <button className="btn" onClick={close}>Annuler</button>
        <button className="btn primary" onClick={save} disabled={!lines.length && !photo}>Enregistrer</button>
      </div>
      {existing && <button className="linkbtn danger" onClick={() => { update(d => deleteMeal(d, existing.id)); if (existing.photoId) deleteMedia(existing.photoId); toast('Repas supprimé'); close(); }}>Supprimer ce repas</button>}
      <p className="fine">Les calories sont des estimations à partir des valeurs moyennes pour 100 g.</p>
    </>
  );
}

function Meter({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max * 1.05;
  return (
    <div className="kmeter">
      <div className="kmeter-top"><span>{label}</span><b className={over ? 'over' : ''}>{over ? `+${value - max}` : `${Math.max(0, max - value)} restantes`}</b></div>
      <div className="meter"><i className={over ? 'over' : color} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

/** Repas du jour, avec photo, pour l'écran Aujourd'hui et le dîner. */
export function MealCard({ id }: { id: string }) {
  const { state, open } = useHouse();
  const m = state.meals.find(x => x.id === id);
  const url = useMediaUrl(m?.photoId);
  if (!m) return null;
  const who = memberOf(state, m.memberId);
  return (
    <button className="meal-card" onClick={() => open({ kind: 'meal', id: m.id })}>
      <span className="thumb">{url ? <img src={url} alt="" /> : <I.Camera size={18} />}</span>
      <span className="t"><b>{m.title}</b><span>{MEAL_LABEL[m.meal]} · {who.name} · {dayLong(m.date)}</span></span>
      <span className="mono kc">{mealKcal(m.lines)}<small> kcal</small></span>
    </button>
  );
}
