// Franko — réception d'un paiement envoyé par un raccourci (Apple Pay, Wallet) ou une automatisation Android.
// Authentification par clé personnelle (en-tête « Authorization: Bearer fk_… » ou « X-Franko-Key »).
// Corps accepté : JSON, formulaire ou paramètres d'URL — amount, merchant, card, date, type (expense | income).
// Déployer : supabase functions deploy ingest --no-verify-jwt

const env = (k: string) => Deno.env.get(k) ?? '';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const service = { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + env('SUPABASE_SERVICE_ROLE_KEY') };
const MAX_PER_DAY = 300;

async function sha256(s: string) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  return [...d].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Montant seul (« 12.50 », « -1'046,20 ») ou noyé dans un texte : renvoie le montant normalisé et le reste du texte.
export function splitAmount(raw: string) {
  const t = raw.replace(/\u00a0/g, ' ').slice(0, 500);
  if (/^[-+]?\s*(CHF|Fr\.?)?\s*[-+]?[\d'’ .,]+\s*(CHF|Fr\.?)?$/i.test(t.trim()) && /\d/.test(t)) return { amount: norm(t), rest: '' };
  const re = /[-+]?\d{1,3}(?:['’ ]\d{3})*(?:[.,]\d{1,2})|[-+]?\d+(?:[.,]\d{1,2})?/g;
  const hits = [...t.matchAll(re)];
  if (!hits.length) return { amount: '', rest: '' };
  // de préférence le nombre collé à CHF / Fr., sinon le premier avec des centimes, sinon le premier
  const near = hits.find((m) => /(CHF|Fr\.?)\s*$/i.test(t.slice(0, m.index)) || /^\s*(CHF|Fr\.?)/i.test(t.slice(m.index! + m[0].length)));
  const hit = near ?? hits.find((m) => /[.,]\d{2}$/.test(m[0])) ?? hits[0];
  const rest = (t.slice(0, hit.index) + ' ' + t.slice(hit.index! + hit[0].length))
    .replace(/\b(CHF|Fr\.?)(?=\s|$)/gi, ' ').split(/\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)[0] ?? '';
  return { amount: norm(hit[0]), rest: rest.replace(/^[-–:,·]+|[-–:,·]+$/g, '').trim() };
}
function norm(s: string) {
  const neg = /-/.test(s);
  let n = s.replace(/[^\d.,]/g, '');
  const last = Math.max(n.lastIndexOf('.'), n.lastIndexOf(','));
  if (last >= 0 && n.length - last - 1 <= 2) n = n.slice(0, last).replace(/[.,]/g, '') + '.' + n.slice(last + 1);
  else n = n.replace(/[.,]/g, '');
  return n ? (neg ? '-' : '') + n : '';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') return json({ error: 'method' }, 405);
  const url = new URL(req.url);
  const auth = req.headers.get('Authorization') ?? '';
  const token = (auth.startsWith('Bearer ') ? auth.slice(7) : req.headers.get('X-Franko-Key') ?? '').trim();
  if (!/^fk_[0-9a-f]{48}$/.test(token)) return json({ error: 'key' }, 401);

  const rows = await (await fetch(`${env('SUPABASE_URL')}/rest/v1/ingest_tokens?token_hash=eq.${await sha256(token)}&select=user_id`, { headers: service })).json();
  const userId = rows?.[0]?.user_id;
  if (!userId) return json({ error: 'key' }, 401);

  // corps : JSON, formulaire ou paramètres d'URL
  let p: Record<string, string> = Object.fromEntries(url.searchParams);
  if (req.method === 'POST') {
    const type = req.headers.get('Content-Type') ?? '';
    try {
      if (type.includes('json')) p = { ...p, ...(await req.json()) };
      else if (type.includes('form')) p = { ...p, ...Object.fromEntries(await req.formData() as unknown as Iterable<[string, string]>) };
    } catch { return json({ error: 'body' }, 400); }
  }
  // iOS envoie parfois toute la transaction en texte (« 12,50 CHF Migros… ») : on en tire le montant et le commerçant.
  const val: unknown = p.amount ?? p.montant ?? p.text ?? '';
  const raw = (val && typeof val === 'object' ? JSON.stringify(val) : String(val)).trim(); // objet (transaction iOS) : on lit son texte
  const { amount, rest } = splitAmount(raw);
  if (!amount) {
    // diagnostic : forme de ce qu'a envoyé le raccourci (type, clés, début du texte), sans la clé
    console.log('ingest: amount missing', JSON.stringify({ keys: Object.keys(p), type: typeof (p.amount ?? p.montant ?? p.text), sample: raw.slice(0, 120) }));
    return json({ error: 'amount' }, 400);
  }
  const merchant = String(p.merchant ?? p.label ?? '').trim() || rest;
  const payload = {
    amount, merchant: merchant.slice(0, 120), card: String(p.card ?? '').slice(0, 60),
    date: String(p.date ?? '').slice(0, 32), type: String(p.type ?? '').slice(0, 16), id: String(p.id ?? '').slice(0, 80),
    ...(raw !== amount ? { raw: raw.slice(0, 300) } : {}), // texte reçu tel quel, pour vérifier ce qu'envoie iOS
  };

  // limite quotidienne par utilisateur
  const since = new Date(Date.now() - 86400000).toISOString();
  const c = await fetch(`${env('SUPABASE_URL')}/rest/v1/inbox?user_id=eq.${userId}&received_at=gt.${since}&select=id`, { headers: { ...service, Prefer: 'count=exact', Range: '0-0' } });
  const total = Number((c.headers.get('Content-Range') ?? '*/0').split('/')[1]);
  if (total >= MAX_PER_DAY) return json({ error: 'limit' }, 429);

  const ins = await fetch(`${env('SUPABASE_URL')}/rest/v1/inbox`, { method: 'POST', headers: { ...service, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, payload }) });
  if (!ins.ok) return json({ error: 'store' }, 500);
  return json({ ok: true }, 201);
});
