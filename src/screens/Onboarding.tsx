import { useState } from 'react';
import type { HouseState, Member } from '../domain/types';
import { QUICK_FRIDGE } from '../domain/ingredients';
import { addFridge, emptyState, uid } from '../store/actions';
import { useHouse } from '../store/store';
import { DietForm, type DietDraft } from './DietForm';
import * as I from '../ui/icons';

const blankDiet: DietDraft = { enabled: false, kcalDay: 1800, dinnerShare: 0.35, exclusions: [] };

export function Onboarding() {
  const { replace } = useHouse();
  const [step, setStep] = useState(0);
  const [names, setNames] = useState(['', '']);
  const [diets, setDiets] = useState<DietDraft[]>([blankDiet, blankDiet]);
  const [fridge, setFridge] = useState<string[]>([]);

  const n = (i: number) => names[i].trim() || (i === 0 ? 'Vous' : 'Votre partenaire');
  const canNext = step !== 0 || (names[0].trim() && names[1].trim());
  const steps = 4;

  function finish() {
    const members: Member[] = names.map((name, i) => ({
      id: uid(), name: name.trim(), color: i === 0 ? 'amber' : 'violet',
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
        {step === 0 && <><div className="eyebrow">Bienvenue</div><h1>La maison organisée. Le dîner, décidé.</h1><p className="sub">Agenda partagé, dîner du soir proposé avec ce que vous avez, et liste de courses commune.</p></>}
        {step === 1 && <><div className="eyebrow">Profil de {n(0)}</div><h1>Les repas de {n(0)}</h1><p className="sub">Si {n(0)} suit un régime, indiquez ses calories : on adapte sa portion du dîner.</p></>}
        {step === 2 && <><div className="eyebrow">Profil de {n(1)}</div><h1>Les repas de {n(1)}</h1><p className="sub">Chacun garde le même plat, avec sa propre portion.</p></>}
        {step === 3 && <><div className="eyebrow">Dernière étape</div><h1>Qu’avez-vous au frigo ?</h1><p className="sub">Touchez ce que vous avez déjà. Le dîner sera proposé à partir de ça.</p></>}
      </header>

      <main className="content onb-body">
        {step === 0 && (
          <div className="card pad lift">
            <label className="field" htmlFor="onb-n0"><span className="lbl">Votre prénom</span><input id="onb-n0" type="text" autoComplete="given-name" value={names[0]} onChange={e => setNames([e.target.value, names[1]])} placeholder="Jo" /></label>
            <label className="field" htmlFor="onb-n1"><span className="lbl">La personne qui vit avec vous</span><input id="onb-n1" type="text" value={names[1]} onChange={e => setNames([names[0], e.target.value])} placeholder="Sam" /></label>
          </div>
        )}
        {(step === 1 || step === 2) && (
          <div className="lift">
            <DietForm key={step} idPrefix={`onb${step}`} name={n(step - 1)} value={diets[step - 1]}
              onChange={d => setDiets(step === 1 ? [d, diets[1]] : [diets[0], d])} />
          </div>
        )}
        {step === 3 && (
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
