// Franko — données du tableau de bord administrateur.
// Réservé aux adresses listées dans le secret ADMIN_EMAILS (séparées par des virgules).
// Renvoie le strict nécessaire : comptes (e-mail, dates), abonnements, historique, dernière activité, langue et canton.
// Aucune donnée budgétaire (salaire, mouvements) ne sort d'ici.
// Déployer : supabase functions deploy admin --no-verify-jwt (le jeton est vérifié ici, avec la liste d'administrateurs).

const env = (k: string) => Deno.env.get(k) ?? '';
const SITE = env('SITE_URL') || 'https://franko.ch';
const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const service = { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + env('SUPABASE_SERVICE_ROLE_KEY') };

async function rest(path: string) {
  const r = await fetch(env('SUPABASE_URL') + '/rest/v1/' + path, { headers: { ...service, Accept: 'application/json' } });
  if (!r.ok) throw new Error(path + ' ' + r.status);
  return r.json();
}
async function allUsers() {
  const out: Record<string, unknown>[] = [];
  for (let page = 1; page < 100; page++) {
    const r = await fetch(`${env('SUPABASE_URL')}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers: service });
    if (!r.ok) throw new Error('users ' + r.status);
    const j = await r.json();
    const list = j.users ?? [];
    for (const u of list) out.push({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null });
    if (list.length < 1000) break;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const auth = req.headers.get('Authorization') ?? '';
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { Authorization: auth, apikey: env('SUPABASE_ANON_KEY') } });
  if (!r.ok) return json({ error: 'auth' }, 401);
  const me = await r.json();
  const admins = env('ADMIN_EMAILS').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!me.email || !admins.includes(String(me.email).toLowerCase())) return json({ error: 'forbidden' }, 403);
  try {
    const [users, subscriptions, events, activity] = await Promise.all([
      allUsers(),
      rest('subscriptions?select=user_id,status,price_interval,amount_chf,current_period_end,trial_end,canceled_at,created_at'),
      rest('subscription_events?select=user_id,status,previous_status,price_interval,amount_chf,at&order=at.asc&limit=50000'),
      rest('budget_docs?select=user_id,updated_at,lang:doc->settings->>lang,canton:doc->settings->>canton'),
    ]);
    return json({ generatedAt: new Date().toISOString(), users, subscriptions, events, activity });
  } catch (e) {
    console.error(e);
    return json({ error: 'query' }, 500);
  }
});
