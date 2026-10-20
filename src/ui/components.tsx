import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AgendaItem, Assignee } from '../domain/types';
import type { Recipe } from '../domain/recipes';
import { nameOf, memberOf, toggleItem } from '../store/actions';
import { useHouse, type Tab } from '../store/store';
import { plateSvg } from './plateArt';
import * as I from './icons';

export function Avatar({ who, lg }: { who: Assignee; lg?: boolean }) {
  const { state } = useHouse();
  if (who === 'both') return <span className={`av both${lg ? ' lg' : ''}`}>{state.members.map(m => m.name[0]).join('+')}</span>;
  const m = memberOf(state, who);
  return <span className={`av ${m.color}${lg ? ' lg' : ''}`}>{m.name[0]?.toUpperCase()}</span>;
}

export const Plate = memo(function Plate({ recipe, size }: { recipe: Recipe; size: number }) {
  return <span className="plate" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: plateSvg(recipe, size) }} />;
});

export function HeroTop() {
  const { me, state, open } = useHouse();
  const unread = state.notices.filter(n => n.to === me.id && !n.read).length;
  return (
    <div className="hero-top">
      <span className="hero-brand"><I.Leaf size={16} />Savia</span>
      <span className="spacer" />
      <button className="glass-btn" onClick={() => open({ kind: 'profile' })} aria-label="Profils et régimes">
        <Avatar who={me.id} />{me.name}
      </button>
      <button className="glass-btn icon" onClick={() => open({ kind: 'inbox' })} aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}>
        <I.Bell size={17} />{unread > 0 && <span className="dot">{unread}</span>}
      </button>
    </div>
  );
}

/** Hero d'écran ; en défilant, une barre compacte reprend le titre (grand titre façon iOS). */
export function Hero({ children, className = '', title }: { children: ReactNode; className?: string; title: string }) {
  const ref = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-96px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div className={`topbar${compact ? ' show' : ''}`} aria-hidden={!compact}><b>{title}</b></div>
      <header ref={ref} className={`hero ${className}`}><HeroTop />{children}</header>
    </>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { v: T; label: ReactNode }[]; onChange: (v: T) => void; label: string;
}) {
  const i = Math.max(0, options.findIndex(o => o.v === value));
  return (
    <div className="segmented" role="tablist" aria-label={label} style={{ ['--n' as string]: options.length, ['--i' as string]: i }}>
      <span className="thumb" aria-hidden="true" />
      {options.map(o => <button key={o.v} role="tab" aria-selected={o.v === value} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </div>
  );
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="sec"><h2>{title}</h2>{aside && <span>{aside}</span>}</div>
      {children}
    </section>
  );
}

export function ItemRow({ it, showTime, drag, onGrip }: {
  it: AgendaItem; showTime?: boolean; drag?: boolean; onGrip?: (e: React.PointerEvent, id: string) => void;
}) {
  const { state, update, me, open } = useHouse();
  return (
    <div className={`row${it.done ? ' done' : ''}`} data-id={it.id}>
      {drag && <button className="grip" onPointerDown={e => onGrip?.(e, it.id)} aria-label={`Déplacer ${it.title}`}><I.Grip /></button>}
      {showTime && <span className="time mono">{it.time ?? '—'}</span>}
      {it.kind === 'task'
        ? <button className={`check${it.done ? ' on' : ''}`} aria-label={it.done ? 'Marquer à faire' : 'Marquer comme fait'}
            onClick={() => update(d => toggleItem(d, it.id, me.id))}>{it.done && <I.Check size={13} />}</button>
        : <Avatar who={it.assignee} />}
      <button className="t" onClick={() => open({ kind: 'item', id: it.id })}>
        <b>{it.title}</b>
        <span>
          <span className={`pill${it.kind === 'task' ? ' task' : ''}`}>{it.kind === 'task' ? 'Tâche' : 'Événement'}</span>
          {!showTime && it.time && <span className="mono">{it.time}</span>}
          {it.voiceId && <span className="voice-tag"><I.Mic size={12} />Note vocale</span>}
          {nameOf(state, it.assignee)}
        </span>
      </button>
      <button className="more" onClick={() => open({ kind: 'item', id: it.id })} aria-label={`Options de ${it.title}`}><I.More /></button>
    </div>
  );
}

export function TabBar() {
  const { tab, go, open } = useHouse();
  const T = ({ id, label, icon }: { id: Tab; label: string; icon: ReactNode }) => (
    <button className="tab" role="tab" aria-selected={tab === id} onClick={() => go(id)}>{icon}{label}</button>
  );
  return (
    <nav className="tabbar" role="tablist" aria-label="Navigation">
      <span className="rail-brand"><span className="logo-mark"><I.Leaf size={16} /></span>Savia</span>
      <T id="today" label="Aujourd’hui" icon={<I.TabToday />} />
      <T id="week" label="Semaine" icon={<I.TabWeek />} />
      <button className="add" onClick={() => open({ kind: 'create' })} aria-label="Ajouter"><I.Plus size={24} /><span className="rail-label">Ajouter</span></button>
      <T id="dinner" label="Dîner" icon={<I.TabDinner />} />
      <T id="groceries" label="Courses" icon={<I.TabBag />} />
    </nav>
  );
}

export function Toast() {
  const { toastText } = useHouse();
  return <div className={`toast${toastText ? ' show' : ''}`} role="status" aria-live="polite">{toastText?.text}</div>;
}

/** Feuille qui monte du bas ; garde son contenu pendant l'animation de fermeture. */
export function SheetFrame({ openKey, onClose, children }: { openKey: string | null; onClose: () => void; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  useEffect(() => {
    if (openKey) {
      setContent(children);
      const r = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const t = window.setTimeout(() => setContent(null), 300);
    return () => window.clearTimeout(t);
  }, [openKey, children]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (!content && !openKey) return null;
  return (
    <>
      <div className={`scrim${shown ? ' show' : ''}`} onClick={onClose} />
      <div className={`sheet${shown ? ' show' : ''}`} role="dialog" aria-modal="true">
        <div className="handle" />
        {content}
      </div>
    </>
  );
}

export function Chips<T extends string | number>({ value, options, onChange, label }: {
  value: T; options: { v: T; label: ReactNode }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button type="button" key={String(o.v)} role="radio" aria-checked={o.v === value} className={`chip${o.v === value ? ' sel' : ''}`} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}
