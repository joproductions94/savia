import { useState } from 'react';
import type { Exclusion, Member } from '../domain/types';
import { EXCLUSION_LABEL } from '../domain/recipes';
import { estimateKcal, type Activity, type BodyInput, type Goal } from '../domain/nutrition';
import { Chips } from '../ui/components';

export interface DietDraft {
  enabled: boolean;
  kcalDay: number;
  dinnerShare: number;
  exclusions: Exclusion[];
}

export const draftOf = (m: Member): DietDraft => ({ ...m.diet, exclusions: [...m.exclusions] });

const ACTIVITY: { v: Activity; label: string }[] = [
  { v: 1.2, label: 'Sédentaire' }, { v: 1.375, label: 'Un peu actif' }, { v: 1.55, label: 'Actif' }, { v: 1.725, label: 'Très actif' }
];

/** Régime d'une personne : calories par jour, part du dîner, exclusions. */
export function DietForm({ name, value, onChange, idPrefix }: { name: string; value: DietDraft; onChange: (d: DietDraft) => void; idPrefix: string }) {
  const [estimating, setEstimating] = useState(false);
  const [body, setBody] = useState<BodyInput>({ sex: 'femme', age: 35, heightCm: 168, weightKg: 68, activity: 1.375, goal: 'perdre' });
  const set = (p: Partial<DietDraft>) => onChange({ ...value, ...p });
  const dinner = Math.round(value.kcalDay * value.dinnerShare);
  const estimate = estimateKcal(body);
  const num = (k: 'age' | 'heightCm' | 'weightKg', label: string, unit: string) => (
    <label className="mini-field" htmlFor={`${idPrefix}-${k}`}>
      <span>{label}</span>
      <span className="with-unit"><input id={`${idPrefix}-${k}`} type="number" inputMode="numeric" value={body[k]} onChange={e => setBody({ ...body, [k]: Number(e.target.value) || 0 })} /><em>{unit}</em></span>
    </label>
  );

  return (
    <div className="diet-form">
      <label className="toggle" htmlFor={`${idPrefix}-on`}>
        <span><b>{name} fait attention aux calories</b><span>Les portions du dîner s’adaptent à son objectif.</span></span>
        <input id={`${idPrefix}-on`} type="checkbox" checked={value.enabled} onChange={e => set({ enabled: e.target.checked, kcalDay: value.kcalDay || 1800 })} />
      </label>

      {value.enabled && (
        <div className="card pad diet-box">
          <label className="field" htmlFor={`${idPrefix}-kcal`}>
            <span className="lbl">Combien de calories {name} mange par jour ?</span>
            <span className="with-unit big"><input id={`${idPrefix}-kcal`} type="number" inputMode="numeric" min={900} max={4500} step={50}
              value={value.kcalDay || ''} onChange={e => set({ kcalDay: Number(e.target.value) || 0 })} /><em>kcal / jour</em></span>
          </label>
          {!estimating
            ? <button type="button" className="linkbtn" onClick={() => setEstimating(true)}>Je ne sais pas, estimer pour moi</button>
            : (
              <div className="estimator">
                <Chips label="Sexe" value={body.sex} onChange={v => setBody({ ...body, sex: v })} options={[{ v: 'femme', label: 'Femme' }, { v: 'homme', label: 'Homme' }]} />
                <div className="mini-grid">{num('age', 'Âge', 'ans')}{num('heightCm', 'Taille', 'cm')}{num('weightKg', 'Poids', 'kg')}</div>
                <Chips label="Activité" value={body.activity} onChange={v => setBody({ ...body, activity: v })} options={ACTIVITY} />
                <Chips<Goal> label="Objectif" value={body.goal} onChange={v => setBody({ ...body, goal: v })}
                  options={[{ v: 'perdre', label: 'Perdre du poids' }, { v: 'maintenir', label: 'Maintenir' }, { v: 'prendre', label: 'Prendre' }]} />
                <button type="button" className="btn primary" onClick={() => { set({ kcalDay: estimate }); setEstimating(false); }}>
                  Utiliser <span className="mono">{estimate.toLocaleString('fr-CH')}</span> kcal / jour
                </button>
                <p className="fine">Estimation (formule de Mifflin-St Jeor). Elle ne remplace pas l’avis d’un professionnel de santé.</p>
              </div>
            )}
          <div className="field">
            <label className="lbl" htmlFor={`${idPrefix}-share`}>Part réservée au dîner : <b className="mono">{Math.round(value.dinnerShare * 100)} %</b></label>
            <input id={`${idPrefix}-share`} type="range" min={0.25} max={0.4} step={0.01} value={value.dinnerShare} onChange={e => set({ dinnerShare: Number(e.target.value) })} />
          </div>
          <div className="budget"><span>Dîner de {name}</span><b className="mono">{value.kcalDay ? dinner : '—'} kcal</b></div>
        </div>
      )}

      <div className="field">
        <span className="lbl">{name} ne mange pas</span>
        <div className="seg">
          {(Object.keys(EXCLUSION_LABEL) as Exclusion[]).map(x => {
            const on = value.exclusions.includes(x);
            return <button type="button" key={x} aria-pressed={on} className={`chip${on ? ' sel' : ''}`}
              onClick={() => set({ exclusions: on ? value.exclusions.filter(e => e !== x) : [...value.exclusions, x] })}>{EXCLUSION_LABEL[x]}</button>;
          })}
        </div>
      </div>
    </div>
  );
}
