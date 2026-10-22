import { useState } from 'react';
import { MEMBER_COLORS, type HouseState, type Member } from '../domain/types';
import { QUICK_FRIDGE } from '../domain/ingredients';
import { addFridge, emptyState, uid } from '../store/actions';
import { useHouse } from '../store/store';
import { DietForm, type DietDraft } from './DietForm';
import * as I from '../ui/icons';
import { Plate } from '../ui/components';
import { recipeById } from '../domain/recipes';

const blankDiet: DietDraft = { enabled: false, kcalDay: 1800, dinnerShare: 0.35, exclusions: [] };

export function Onboarding() {
  const { replace } = useHouse();
  const [step, setStep] = useState(0);
  const [names, setNames] = useState(['', '']);
  const [diets, setDiets] = useState<DietDraft[]>([blankDiet, blankDiet]);
  const [fridge, setFridge] = useState<string[]>([]);

  const n = (i: number) => names[i]?.trim() || (i === 0 ? 'Vous' : `Personne ${i + 1}`);
  const filled = names.filter(x => x.trim()).length;
  const canNext = step !== 0 || (names[0].trim() && filled >= 2 && filled === names.length);
  const steps = names.length + 2;
  const fridgeStep = names.length + 1;
  const setName = (i: number, v: string) => setNames(names.map((x, j) => (j === i ? v : x)));
  const addPerson = () => { setNames([...names, '']); setDiets([...diets, blankDiet]); };
  const removePerson = (i: number) => { setNames(names.filter((_, j) => j !== i)); setDiets(diets.filter((_, j) => j !== i)); };

  function finish() {
    const members: Member[] = names.map((name, i) => ({
      id: uid(), name: name.trim(), color: MEMBER_COLORS[i % MEMBER_COLORS.length],
      diet: { enabled: diets[i].enabled, kcalDay: diets[i].kcalDay, dinnerShare: diets[i].dinnerShare },
      exclusions: diets[i].exclusions
    }));
    const s: HouseState = { ...emptyState(), onboarded: true, members, me: members[0].id };
    fridge.forEach(f => addFridge(s, f));
    replace(s);
  }

  return (
    <div className="onb">
      <header className="hero onb-hero">
        <div className="hero-top"><span className="hero-brand"><I.Leaf size={16} />Savia</span><span className="spacer" /><span className="steps-dots" aria-label={`Étape ${step + 1} sur ${steps}`}>{Array.from({ length: steps }, (_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</span></div>
        {step === 0 && <><div className="eyebrow">Bienvenue</div><h1>La maison organisée. Le dîner, décidé.</h1><p className="sub">Agenda partagé, dîner du soir proposé avec ce que vous avez, et liste de courses commune.</p>
          <div className="onb-plates">{['saumon-patate-douce', 'curry-pois-chiches', 'pates-pesto-roquette'].map(id => <Plate key={id} recipe={recipeById(id)!} size={120} />)}</div></>}
        {step >= 1 && step < fridgeStep && <><div className="eyebrow">Profil {step} sur {names.length}</div><h1>Les repas de {n(step - 1)}</h1><p className="sub">{step === 1 ? `Si ${n(0)} suit un régime, indiquez ses calories : on adapte sa portion du dîner.` : 'Même plat pour toute la famille, une portion pour chacun.'}</p></>}
        {step === fridgeStep && <><div className="eyebrow">Dernière étape</div><h1>Qu’avez-vous au frigo ?</h1><p className="sub">Touchez ce que vous avez déjà. Le dîner sera proposé à partir de ça.</p></>}
      </header>

      <main className="content onb-body">
        {step === 0 && (
          <div className="card pad lift">
            {names.map((v, i) => (
              <label className="field" htmlFor={`onb-n${i}`} key={i}>
                <span className="lbl">{i === 0 ? 'Votre prénom' : i === 1 ? 'Qui vit avec vous ?' : `Membre ${i + 1}`}</span>
                <span className="name-row">
                  <input id={`onb-n${i}`} type="text" autoComplete={i === 0 ? 'given-name' : 'off'} value={v} onChange={e => setName(i, e.target.value)} placeholder={['Jo', 'Sam', 'Léa', 'Max', 'Noa', 'Lou'][i]} />
                  {i >= 2 && <button type="button" className="more" onClick={() => removePerson(i)} aria-label={`Retirer le membre ${i + 1}`}><I.Trash size={15} /></button>}
                </span>
              </label>
            ))}
            {names.length < 6 && <button type="button" className="linkbtn" onClick={addPerson}><I.Plus size={16} /> Ajouter un membre de la famille</button>}
            <p className="fine">Chacun aura son propre tableau de bord. L’agenda, le dîner et les courses sont partagés.</p>
          </div>
        )}
        {step >= 1 && step < fridgeStep && (
          <div className="lift">
            <DietForm key={step} idPrefix={`onb${step}`} name={n(step - 1)} value={diets[step - 1]}
              onChange={d => setDiets(diets.map((x, j) => (j === step - 1 ? d : x)))} />
          </div>
        )}
        {step === fridgeStep && (
          <div className="card pad lift">
            <div className="seg">
              {QUICK_FRIDGE.map(f => {
                const on = fridge.includes(f);
                return <button type="button" key={f} aria-pressed={on} className={`chip${on ? ' sel' : ''}`} onClick={() => setFridge(on ? fridge.filter(x => x !== f) : [...fridge, f])}>{f}</button>;
              })}
            </div>
            <p className="fine" style={{ marginTop: 12 }}>{fridge.length} produit{fridge.length > 1 ? 's' : ''} sélectionné{fridge.length > 1 ? 's' : ''}. Vous pourrez en ajouter d’autres dans Courses › Frigo.</p>
          </div>
        )}

        <div className="actions onb-actions">
          {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Retour</button>}
          {step < steps - 1
            ? <button className="btn primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continuer</button>
            : <button className="btn primary" onClick={finish}>Commencer</button>}
        </div>
      </main>
    </div>
  );
}
