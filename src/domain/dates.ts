const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayISO = () => toISO(new Date());
export const addDays = (iso: string, n: number) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };

/** Lundi de la semaine contenant la date. */
export const startOfWeek = (iso: string) => { const d = fromISO(iso); return addDays(iso, -((d.getDay() + 6) % 7)); };
export const weekDays = (iso: string) => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(iso), i));

export function isoWeek(iso: string): number {
  const d = fromISO(iso);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 864e5 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-CH', o);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const dayShort = (iso: string) => cap(fmt({ weekday: 'short' }).format(fromISO(iso)).replace('.', ''));
export const dayNum = (iso: string) => fromISO(iso).getDate();
export const dayLong = (iso: string) => fmt({ weekday: 'long', day: 'numeric' }).format(fromISO(iso));
export const dayFull = (iso: string) => cap(fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(fromISO(iso)));
export const rangeLabel = (days: string[]) =>
  `${dayNum(days[0])} – ${fmt({ day: 'numeric', month: 'long' }).format(fromISO(days[6]))}`;

export function relativeDay(iso: string, today = todayISO()): string {
  if (iso === today) return 'aujourd’hui';
  if (iso === addDays(today, 1)) return 'demain';
  if (iso === addDays(today, -1)) return 'hier';
  return `le ${dayLong(iso)}`;
}
