import { useCallback, useEffect, useRef, useState } from 'react';
import { addDays, dayLong, dayNum, dayShort, rangeLabel, todayISO, weekDays } from '../domain/dates';
import { concerned, joinNames, memberOf, moveItem } from '../store/actions';
import { useHouse } from '../store/store';
import { Hero, ItemRow, Segmented } from '../ui/components';
import * as I from '../ui/icons';

interface Drag { id: string; ghost: HTMLElement; row: HTMLElement; dx: number; dy: number; over: HTMLElement | null }

/** Glisser-déposer au doigt ou à la souris, vers un jour de la liste ou du bandeau. */
function useDragToDay(onDrop: (id: string, date: string) => void) {
  const drag = useRef<Drag | null>(null);

  const move = useCallback((e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    e.preventDefault();
    d.ghost.style.left = `${e.clientX - d.dx}px`;
    d.ghost.style.top = `${e.clientY - d.dy}px`;
    const target = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-day]') ?? null;
    if (target !== d.over) { d.over?.classList.remove('over'); target?.classList.add('over'); d.over = target; }
    if (e.clientY < 70) window.scrollBy(0, -14);
    else if (e.clientY > window.innerHeight - 130) window.scrollBy(0, 14);
  }, []);

  const end = useCallback((drop: boolean) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    d.ghost.remove();
    d.row.style.opacity = '';
    d.over?.classList.remove('over');
    if (drop && d.over?.dataset.day) onDrop(d.id, d.over.dataset.day);
  }, [onDrop]);

  useEffect(() => {
    const up = () => end(true), cancel = () => end(false);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); };
  }, [move, end]);

  return useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    const row = (e.currentTarget as HTMLElement).closest<HTMLElement>('.row');
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const ghost = row.cloneNode(true) as HTMLElement;
    ghost.classList.add('ghost');
    ghost.style.width = `${rect.width}px`;
    document.body.appendChild(ghost);
    row.style.opacity = '.3';
    drag.current = { id, ghost, row, dx: e.clientX - rect.left, dy: e.clientY - rect.top, over: null };
    move(e.nativeEvent);
  }, [move]);
}

export function Week() {
  const { state, update, me, toast } = useHouse();
  const today = todayISO();
  const [anchor, setAnchor] = useState(today);
  const days = weekDays(anchor);
  const [scope, setScope] = useState<'family' | 'me'>('family');
  const visible = state.items.filter(i => scope === 'family' || i.assignee === me.id || i.assignee === 'both');

  const onDrop = useCallback((id: string, date: string) => {
    const it = state.items.find(i => i.id === id);
    if (!it || it.date === date) return;
    update(d => { moveItem(d, id, date, me.id); });
    const told = joinNames(concerned(state, it.assignee, me.id).map(m => m.name));
    toast(`Déplacé au ${dayLong(date)}${told ? ` · notification envoyée à ${told}` : ''}`);
  }, [state, update, me.id, toast]);
  const startDrag = useDragToDay(onDrop);

  const byTime = (a: { time: string | null }, b: { time: string | null }) => (a.time ?? '99').localeCompare(b.time ?? '99');

  return (
    <>
      <Hero title="Semaine">
        <div className="week-nav">
          <button className="glass-btn icon" onClick={() => setAnchor(addDays(anchor, -7))} aria-label="Semaine précédente"><I.ChevronL size={16} /></button>
          <div><div className="eyebrow">{rangeLabel(days)}</div><h1>{days.includes(today) ? 'Cette semaine' : 'Semaine'}</h1></div>
          <button className="glass-btn icon" onClick={() => setAnchor(addDays(anchor, 7))} aria-label="Semaine suivante"><I.ChevronR size={16} /></button>
        </div>
        <Segmented label="Afficher" value={scope} onChange={setScope} options={[{ v: 'family', label: 'Toute la famille' }, { v: 'me', label: `Seulement ${me.name}` }]} />
        <div className="week">
          {days.map(iso => {
            const list = visible.filter(i => i.date === iso);
            return (
              <button key={iso} className={`wd${iso === today ? ' today' : ''}`} data-day={iso} aria-label={`${dayLong(iso)}, ${list.length} éléments`}
                onClick={() => document.getElementById(`day-${iso}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <span className="d">{dayShort(iso)}</span><span className="n mono">{dayNum(iso)}</span>
                <span className="dots">{list.slice(0, 4).map(i => <i key={i.id} className={i.assignee === 'both' ? 'both' : memberOf(state, i.assignee).color} />)}</span>
              </button>
            );
          })}
        </div>
        {!days.includes(today) && <button className="gchip back" onClick={() => setAnchor(today)}>Revenir à cette semaine</button>}
        <p className="hint"><I.Arrow size={13} /> Faites glisser une tâche par sa poignée vers un autre jour.</p>
      </Hero>
      <div className="content">
        {days.map(iso => {
          const list = visible.filter(i => i.date === iso).sort(byTime);
          return (
            <div key={iso} className="day" data-day={iso} id={`day-${iso}`}>
              <div className="dayhead">
                <b>{dayLong(iso).replace(/^./, c => c.toUpperCase())}</b>
                {iso === today && <span className="tag">Aujourd’hui</span>}
                <span className="c">{list.length ? `${list.length} élément${list.length > 1 ? 's' : ''}` : ''}</span>
              </div>
              {list.length
                ? <div className="list boxed">{list.map(it => <ItemRow key={it.id} it={it} drag onGrip={startDrag} />)}</div>
                : <div className="empty">Déposez une tâche ici</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
