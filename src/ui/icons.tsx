import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 18, ...p }: P) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, ...p });
const S = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const Leaf = (p: P) => <svg {...base(p)}><path {...S} strokeWidth={2.2} d="M12 21V10M12 13c-4.2 0-7-2.6-7-7.5 4.2 0 7 2.6 7 7.5Zm0 0c4.2 0 7-2.6 7-7.5-4.2 0-7 2.6-7 7.5Z" /></svg>;
export const Bell = (p: P) => <svg {...base(p)}><path {...S} strokeWidth={1.9} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4" /></svg>;
export const Check = (p: P) => <svg {...base(p)}><path {...S} strokeWidth={3} d="m5 12 4.5 4.5L19 7" /></svg>;
export const Plus = (p: P) => <svg {...base(p)}><path {...S} strokeWidth={2.4} d="M12 5v14M5 12h14" /></svg>;
export const More = (p: P) => <svg {...base(p)} fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>;
export const Swap = (p: P) => <svg {...base(p)}><path {...S} d="M7 7h11l-3-3M17 17H6l3 3" /></svg>;
export const Clock = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="8" {...S} /><path {...S} d="M12 8v4l3 2" /></svg>;
export const Book = (p: P) => <svg {...base(p)}><path {...S} d="M5 4.5h9a4 4 0 0 1 4 4V20H9a4 4 0 0 1-4-4V4.5Z" /><path {...S} d="M9 9h5" /></svg>;
export const Arrow = (p: P) => <svg {...base(p)}><path {...S} strokeWidth={2.4} d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const ChevronL = (p: P) => <svg {...base(p)}><path {...S} strokeWidth={2.4} d="m15 6-6 6 6 6" /></svg>;
export const ChevronR = (p: P) => <svg {...base(p)}><path {...S} strokeWidth={2.4} d="m9 6 6 6-6 6" /></svg>;
export const Trash = (p: P) => <svg {...base(p)}><path {...S} d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>;
export const Snow = (p: P) => <svg {...base(p)}><path {...S} d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /></svg>;
export const Flame = (p: P) => <svg {...base(p)}><path {...S} d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-4.3-3.6-6.3-4.3-10.3C11.4 6.4 10 9 10 11.3 8.8 10.6 8 9.4 7.8 8 6.3 9.6 5.5 11.8 5.5 14.8 5.5 18.4 8.1 21 12 21Z" /></svg>;
export const Grip = (p: P) => <svg {...base({ ...p, viewBox: '0 0 12 18' })} width={12} height={18} fill="currentColor"><circle cx="3" cy="3" r="1.6" /><circle cx="9" cy="3" r="1.6" /><circle cx="3" cy="9" r="1.6" /><circle cx="9" cy="9" r="1.6" /><circle cx="3" cy="15" r="1.6" /><circle cx="9" cy="15" r="1.6" /></svg>;

export const TabToday = (p: P) => <svg {...base({ size: 22, ...p })}><path {...S} strokeWidth={1.9} d="M4 11.5 12 4l8 7.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5h-6v5H5.5A1.5 1.5 0 0 1 4 19v-7.5Z" /></svg>;
export const TabWeek = (p: P) => <svg {...base({ size: 22, ...p })}><rect x="3.5" y="5" width="17" height="15" rx="3.5" {...S} strokeWidth={1.9} /><path {...S} strokeWidth={1.9} d="M3.5 10h17M8 3v4M16 3v4" /></svg>;
export const TabDinner = (p: P) => <svg {...base({ size: 22, ...p })}><circle cx="12" cy="12.5" r="7.5" {...S} strokeWidth={1.9} /><circle cx="12" cy="12.5" r="3.5" {...S} strokeWidth={1.9} /></svg>;
export const TabBag = (p: P) => <svg {...base({ size: 22, ...p })}><path {...S} strokeWidth={1.9} d="M6 8h12l-1 11.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19.5L6 8Z" /><path {...S} strokeWidth={1.9} d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>;
export const Mic = (p: P) => <svg {...base(p)}><rect x="9" y="3" width="6" height="11" rx="3" {...S} /><path {...S} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></svg>;
export const Stop = (p: P) => <svg {...base(p)} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="3" /></svg>;
export const Camera = (p: P) => <svg {...base(p)}><path {...S} d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z" /><circle cx="12" cy="12.5" r="3.5" {...S} /></svg>;
export const Sparkle = (p: P) => <svg {...base(p)}><path {...S} d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9 12 3.5Z" /></svg>;
