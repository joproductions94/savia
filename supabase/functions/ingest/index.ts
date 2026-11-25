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
  const amount = String(p.amount ?? p.montant ?? '').trim();
  if (!amount || !/\d/.test(amount)) return json({ error: 'amount' }, 400);
  const payload = {
    amount: amount.slice(0, 32), merchant: String(p.merchant ?? p.label ?? '').slice(0, 120), card: String(p.card ?? '').slice(0, 60),
    date: String(p.date ?? '').slice(0, 32), type: String(p.type ?? '').slice(0, 16), id: String(p.id ?? '').slice(0, 80),
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
