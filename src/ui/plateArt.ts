import type { ArtLayer, Recipe } from '../domain/recipes';

/* Assiette vue de dessus, dessinée en SVG à partir des couches de la recette. */

type Rand = () => number;

function rng(seed: string): Rand {
  let a = 0;
  for (const c of seed) a = (a * 31 + c.charCodeAt(0)) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);
const scatter = (q: Rand, cx: number, cy: number, s: number): [number, number] => {
  const a = q() * Math.PI * 2, d = Math.sqrt(q()) * s;
  return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
};
const rot = (deg: number, x: number, y: number) => `transform="rotate(${f(deg)} ${f(x)} ${f(y)})"`;

function blob(q: Rand, cx: number, cy: number, r: number, k = 11): string {
  const pts = Array.from({ length: k }, (_, i) => {
    const a = (i / k) * Math.PI * 2, rr = r * (0.86 + q() * 0.26);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const mid = (p: number[], o: number[]) => [(p[0] + o[0]) / 2, (p[1] + o[1]) / 2];
  const m0 = mid(pts[k - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  pts.forEach((p, i) => { const m = mid(p, pts[(i + 1) % k]); d += ` Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`; });
  return d + 'Z';
}

const repeat = (n: number, fn: (i: number) => string) => Array.from({ length: n }, (_, i) => fn(i)).join('');

type Prim = (q: Rand, x: number, y: number, s: number) => string;

const grain = (base: string, a: string, b: string): Prim => (q, x, y, s) =>
  `<ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 1.1}" fill="${base}"/>` +
  repeat(Math.round(s * 3), i => {
    const t = q() * Math.PI * 2, d = Math.sqrt(q());
    const px = x + Math.cos(t) * d * s * 0.92, py = y + Math.sin(t) * d * s * 1.0;
    return `<ellipse cx="${f(px)}" cy="${f(py)}" rx="2.8" ry="1.3" ${rot(q() * 180, px, py)} fill="${i % 3 ? a : b}"/>`;
  });

const cubes = (col: string, hi: string, size = 14): Prim => (q, x, y, s) =>
  repeat(Math.round(s / 3) + 2, () => {
    const [px, py] = scatter(q, x, y, s);
    return `<g ${rot(q() * 90, px, py)}><rect x="${f(px - size / 2)}" y="${f(py - size / 2)}" width="${size}" height="${size}" rx="3.5" fill="${col}"/><rect x="${f(px - size / 2 + 2)}" y="${f(py - size / 2 + 2)}" width="${size / 2}" height="${size / 3}" rx="2" fill="${hi}" opacity=".7"/></g>`;
  });

const beans = (col: string, r: number, hi: string, n = 12): Prim => (q, x, y, s) =>
  repeat(n, () => {
    const [px, py] = scatter(q, x, y, s);
    return `<circle cx="${f(px)}" cy="${f(py)}" r="${r}" fill="${col}"/><circle cx="${f(px - r * 0.35)}" cy="${f(py - r * 0.35)}" r="${f(r * 0.35)}" fill="${hi}" opacity=".7"/>`;
  });

const leaves = (col: string, vein: string, n: number, rx = 10, ry = 4.6): Prim => (q, x, y, s) =>
  repeat(n, () => {
    const [px, py] = scatter(q, x, y, s);
    return `<g ${rot(q() * 180, px, py)}><ellipse cx="${f(px)}" cy="${f(py)}" rx="${rx}" ry="${ry}" fill="${col}"/><line x1="${f(px - rx * 0.8)}" y1="${f(py)}" x2="${f(px + rx * 0.8)}" y2="${f(py)}" stroke="${vein}" stroke-width=".9"/></g>`;
  });

const sauce = (col: string, edge: string): Prim => (q, x, y, s) =>
  `<path d="${blob(q, x, y, s + 2)}" fill="${edge}"/><path d="${blob(q, x, y, s)}" fill="${col}"/>`;

const fillet = (col: string, hi: string, line: string, under: string): Prim => (q, x, y, s) => {
  const w = s * 2.4, h = s * 1.1;
  return `<g ${rot(-14, x, y)}><rect x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2.3)}" fill="${col}"/>` +
    `<rect x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h * 0.42)}" rx="${f(h / 4)}" fill="${hi}" opacity=".55"/>` +
    repeat(5, i => { const px = x - w / 2 + ((i + 1) * w) / 6; return `<path d="M${f(px - 4)} ${f(y - h / 2 + 3)} Q${f(px + 5)} ${f(y)} ${f(px - 3)} ${f(y + h / 2 - 3)}" stroke="${line}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>`; }) +
    `<rect x="${f(x - w / 2)}" y="${f(y + h / 2 - 5)}" width="${f(w)}" height="5" rx="2.5" fill="${under}" opacity=".55"/></g>` +
    repeat(7, () => { const [px, py] = scatter(q, x, y, w / 3); return `<ellipse cx="${f(px)}" cy="${f(py)}" rx="2.2" ry="1" fill="#2F6B2C" ${rot(q() * 180, px, py)}/>`; });
};

const PRIMS: Record<string, Prim> = {
  'rice': grain('#F1EAD6', '#FFFDF6', '#E8E0CB'),
  'quinoa': grain('#E6D3A8', '#F4E6C2', '#C9A86A'),
  'risotto': (q, x, y, s) => sauce('#EBDDB5', '#D9C28E')(q, x, y, s) + grain('transparent', '#FFF8E2', '#E3D29F')(q, x, y, s * 0.9),
  'cubes-orange': cubes('#E58C38', '#F7B66A'),
  'potatoes': cubes('#E9C46A', '#F6E2A4', 16),
  'tofu': cubes('#F3EBD3', '#FFFFFF', 15),
  'feta': cubes('#FBF8EE', '#FFFFFF', 9),
  'florets': (q, x, y, s) => repeat(Math.max(3, Math.round(s / 5)), () => {
    const [px, py] = scatter(q, x, y, s);
    return `<rect x="${f(px - 2.5)}" y="${f(py)}" width="5" height="11" rx="2.5" fill="#9CC46B" ${rot(q() * 60 - 30, px, py)}/>` +
      repeat(6, j => { const a = (j / 6) * Math.PI * 2; return `<circle cx="${f(px + Math.cos(a) * 5.5)}" cy="${f(py - 2 + Math.sin(a) * 5)}" r="${f(4.2 + q() * 1.6)}" fill="${j % 2 ? '#3B7A35' : '#4E9440'}"/>`; }) +
      `<circle cx="${f(px)}" cy="${f(py - 2)}" r="4.5" fill="#5DA34B"/>`;
  }),
  'fillet-salmon': fillet('#EE845A', '#F6A27A', '#FBD3BD', '#B9644A'),
  'fillet-white': fillet('#F4EEE2', '#FFFFFF', '#E4D9C4', '#CDBE9F'),
  'lemon': (_q, x, y) => `<g ${rot(30, x, y)}><path d="M${x - 14} ${y} A14 14 0 0 1 ${x + 14} ${y} Z" fill="#F2CF4A"/><path d="M${x - 11} ${y} A11 11 0 0 1 ${x + 11} ${y} Z" fill="#FBE68A"/></g>`,
  'curry': sauce('#D6922A', '#B8731B'),
  'tomato-sauce': sauce('#C8402C', '#A3301F'),
  'soup': (q, x, y, s) => `<circle cx="${x}" cy="${y}" r="${s + 6}" fill="#D9792F"/><path d="${blob(q, x, y, s)}" fill="#E8913E"/>`,
  'swirl': (_q, x, y) => `<path d="M${x - 18} ${y} q8 -14 18 -4 t18 4" stroke="#FFF3DF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>` + `<circle cx="${x + 12}" cy="${y - 14}" r="3" fill="#3F7A2E"/><circle cx="${x - 10}" cy="${y + 12}" r="2.5" fill="#3F7A2E"/>`,
  'spinach': leaves('#2E6B34', '#5C9C55', 7),
  'salad': leaves('#7DB34F', '#A9D27C', 12, 12, 6),
  'rocket': leaves('#4A8A39', '#7DB35F', 5, 8, 3.5),
  'chickpeas': beans('#E5C58A', 4.6, '#FFF0CC'),
  'redbeans': beans('#7A2420', 4, '#B5574F', 10),
  'edamame': beans('#86BE4C', 4.4, '#C8E89A'),
  'olives': beans('#2B2B22', 3.6, '#6B6B55', 7),
  'mince': (q, x, y, s) => repeat(16, () => { const [px, py] = scatter(q, x, y, s * 0.8); return `<path d="${blob(q, px, py, 3.2 + q() * 2, 6)}" fill="${q() > 0.5 ? '#6B3A22' : '#84492A'}"/>`; }),
  'tomato-slices': (q, x, y, s) => repeat(3, () => {
    const [px, py] = scatter(q, x, y, s * 0.6);
    return `<circle cx="${f(px)}" cy="${f(py)}" r="10" fill="#D93C2E"/><circle cx="${f(px)}" cy="${f(py)}" r="7.4" fill="#EE6A55"/>` +
      repeat(4, j => { const a = (j / 4) * Math.PI * 2 + 0.4, sx = px + Math.cos(a) * 4, sy = py + Math.sin(a) * 4; return `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="1.5" ry="2.4" fill="#F7D57A" ${rot(a * 57.3, sx, sy)}/>`; });
  }),
  'cherry': (q, x, y, s) => repeat(7, () => { const [px, py] = scatter(q, x, y, s * 0.8); return `<circle cx="${f(px)}" cy="${f(py)}" r="6.5" fill="#E2412F"/><circle cx="${f(px - 2)}" cy="${f(py - 2)}" r="1.8" fill="#FFB3A3"/>`; }),
  'omelette': (q, x, y, s) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#D9A531"/><circle cx="${x}" cy="${y}" r="${s - 3}" fill="#F2C84E"/>` +
    repeat(12, () => { const [px, py] = scatter(q, x, y, s - 8); return `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(2 + q() * 3)}" ry="${f(1.5 + q() * 2)}" fill="#C98E22" opacity=".45"/>`; }) +
    repeat(7, () => { const [px, py] = scatter(q, x, y, s - 10); return `<path d="M${f(px - 4)} ${f(py)} a4 4 0 0 1 8 0" fill="#86B25A" opacity=".85"/>`; }),
  'mushrooms': (q, x, y, s) => repeat(6, () => { const [px, py] = scatter(q, x, y, s * 0.7); return `<g ${rot(q() * 360, px, py)}><path d="M${f(px - 7)} ${f(py)} a7 6 0 0 1 14 0 Z" fill="#B58A63"/><rect x="${f(px - 2)}" y="${f(py)}" width="4" height="6" rx="1.5" fill="#E8D7BF"/></g>`; }),
  'pasta': (q, x, y, s) => `<path d="${blob(q, x, y, s, 12)}" fill="#C79B4F"/>` +
    repeat(26, i => { const [px, py] = scatter(q, x, y, s * 0.8), a = q() * Math.PI * 2, L = 14 + q() * 10; return `<path d="M${f(px)} ${f(py)} q${f(Math.cos(a) * L)} ${f(Math.sin(a) * L * 0.4)} ${f(Math.cos(a + 1) * L)} ${f(Math.sin(a + 1) * L)}" stroke="${i % 2 ? '#DDB56A' : '#E8C680'}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`; }) +
    repeat(14, () => { const [px, py] = scatter(q, x, y, s * 0.8); return `<circle cx="${f(px)}" cy="${f(py)}" r="${f(1.5 + q() * 1.8)}" fill="#3F7A2E"/>`; }),
  'shavings': (q, x, y, s) => repeat(10, () => { const [px, py] = scatter(q, x, y, s * 0.8); return `<rect x="${f(px)}" y="${f(py)}" width="7" height="3" rx="1" fill="#FFF6DA" ${rot(q() * 180, px, py)}/>`; }),
  'strips': (q, x, y, s) => repeat(6, () => { const [px, py] = scatter(q, x, y, s * 0.8); return `<g ${rot(q() * 180, px, py)}><rect x="${f(px - 12)}" y="${f(py - 5)}" width="24" height="10" rx="5" fill="#9C4F22"/><rect x="${f(px - 10)}" y="${f(py - 4)}" width="18" height="4" rx="2" fill="#C9763C" opacity=".8"/></g>`; }) +
    repeat(16, () => { const [px, py] = scatter(q, x, y, s); return `<ellipse cx="${f(px)}" cy="${f(py)}" rx="1.3" ry=".7" fill="#FFF8E6" ${rot(q() * 180, px, py)}/>`; }),
  'pepper': (q, x, y, s) => repeat(7, i => { const [px, py] = scatter(q, x, y, s * 0.8); return `<rect x="${f(px - 10)}" y="${f(py - 2.5)}" width="20" height="5" rx="2.5" fill="${['#D8352A', '#F2B233', '#5A9A3C'][i % 3]}" ${rot(q() * 180, px, py)}/>`; }),
  'zucchini': (q, x, y, s) => repeat(Math.round(s / 3), () => { const [px, py] = scatter(q, x, y, s * 0.85); return `<circle cx="${f(px)}" cy="${f(py)}" r="8" fill="#3E7A33"/><circle cx="${f(px)}" cy="${f(py)}" r="6.4" fill="#DCE8B0"/><circle cx="${f(px)}" cy="${f(py)}" r="2" fill="#C5D88D"/>`; }),
  'egg-half': (_q, x, y) => `<ellipse cx="${x - 7}" cy="${y}" rx="9" ry="11" fill="#FFFFFF" stroke="#EDE6D6"/><circle cx="${x - 7}" cy="${y + 1}" r="5" fill="#F4B92F"/><ellipse cx="${x + 9}" cy="${y + 4}" rx="9" ry="11" fill="#FFFFFF" stroke="#EDE6D6"/><circle cx="${x + 9}" cy="${y + 5}" r="5" fill="#F4B92F"/>`,
  'fried-egg': (q, x, y) => `<path d="${blob(q, x, y, 17, 9)}" fill="#FFFFFF"/><circle cx="${x + 1}" cy="${y - 1}" r="7" fill="#F4A81F"/><circle cx="${x - 1}" cy="${y - 3}" r="2" fill="#FFD27A"/>`,
  'rosti': (q, x, y, s) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#B9771F"/><circle cx="${x}" cy="${y}" r="${s - 3}" fill="#D9A040"/>` +
    repeat(26, () => { const [px, py] = scatter(q, x, y, s - 6); return `<rect x="${f(px)}" y="${f(py)}" width="${f(8 + q() * 6)}" height="2.2" rx="1.1" fill="${q() > 0.5 ? '#EFC56B' : '#A9661A'}" ${rot(q() * 180, px, py)}/>`; }),
  'quiche': (_q, x, y, s) => `<path d="M${x} ${y} L${f(x + s)} ${f(y - s * 0.35)} A${s} ${s} 0 0 1 ${f(x + s * 0.2)} ${f(y + s * 0.98)} Z" fill="#C98A3B"/><path d="M${x + 3} ${y} L${f(x + s - 5)} ${f(y - s * 0.3)} A${s - 6} ${s - 6} 0 0 1 ${f(x + s * 0.2)} ${f(y + s * 0.88)} Z" fill="#F0D27A"/>` +
    `<circle cx="${f(x + s * 0.45)}" cy="${f(y + s * 0.2)}" r="3" fill="#8DB45A"/><circle cx="${f(x + s * 0.65)}" cy="${f(y + s * 0.05)}" r="3" fill="#B85A4A"/><circle cx="${f(x + s * 0.35)}" cy="${f(y + s * 0.5)}" r="3" fill="#8DB45A"/>`,
  'drumstick': (_q, x, y, s) => `<g ${rot(-25, x, y)}><ellipse cx="${x - 4}" cy="${y}" rx="${s * 0.95}" ry="${s * 0.62}" fill="#B86A2A"/><ellipse cx="${x - 8}" cy="${y - 4}" rx="${s * 0.6}" ry="${s * 0.3}" fill="#D88E45" opacity=".8"/><rect x="${f(x + s * 0.7)}" y="${y - 3}" width="${f(s * 0.7)}" height="6" rx="3" fill="#F3E7D2"/><circle cx="${f(x + s * 1.4)}" cy="${y - 3}" r="4" fill="#F3E7D2"/><circle cx="${f(x + s * 1.4)}" cy="${y + 3}" r="4" fill="#F3E7D2"/></g>`,
  'tortilla': (_q, x, y, s) => `<path d="M${f(x - s)} ${f(y + s * 0.3)} A${s} ${s} 0 0 1 ${f(x + s * 0.6)} ${f(y - s * 0.7)} Z" fill="#EBC98A"/><path d="M${f(x - s * 0.8)} ${f(y + s * 0.6)} A${s} ${s} 0 0 1 ${f(x + s * 0.8)} ${f(y - s * 0.3)} Z" fill="#E2B977"/>` +
    `<circle cx="${f(x - s * 0.3)}" cy="${f(y)}" r="2.5" fill="#B87B3D"/><circle cx="${f(x)}" cy="${f(y + s * 0.2)}" r="2" fill="#B87B3D"/>`,
  'avocado': (q, x, y) => repeat(4, i => { const px = x - 12 + i * 8, py = y + (q() - 0.5) * 6; return `<ellipse cx="${f(px)}" cy="${f(py)}" rx="5" ry="15" fill="#5C8F2E" ${rot(18, px, py)}/><ellipse cx="${f(px)}" cy="${f(py)}" rx="3.6" ry="13" fill="#CFE38E" ${rot(18, px, py)}/>`; })
};

const SLOTS: Record<ArtLayer['at'], [number, number, number]> = {
  center: [100, 100, 48],
  main: [100, 80, 30],
  left: [70, 124, 20],
  right: [130, 126, 20],
  garnish: [142, 68, 10],
  top: [100, 66, 22],
  bottom: [100, 138, 18],
  west: [74, 100, 32],
  east: [128, 100, 32]
};

let instance = 0;

export function plateSvg(recipe: Recipe, size: number): string {
  const id = `pl${instance++}`;
  const q = rng(recipe.id);
  const art = recipe.art.map(l => { const [x, y, s] = SLOTS[l.at]; return PRIMS[l.p]?.(q, x, y, s) ?? ''; }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" aria-hidden="true">
    <defs><radialGradient id="${id}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".72" stop-color="#F4F2EC"/><stop offset="1" stop-color="#DCD8CF"/></radialGradient>
    <radialGradient id="${id}s" cx="50%" cy="50%" r="50%"><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".07"/></radialGradient>
    <clipPath id="${id}c"><circle cx="100" cy="100" r="73"/></clipPath></defs>
    <circle cx="100" cy="100" r="97" fill="url(#${id})"/>
    <circle cx="100" cy="100" r="74" fill="#FBFAF7"/><circle cx="100" cy="100" r="74" fill="url(#${id}s)"/>
    <circle cx="100" cy="100" r="74" fill="none" stroke="#E4E0D7" stroke-width="1"/>
    <g clip-path="url(#${id}c)">${art}</g>
  </svg>`;
}
