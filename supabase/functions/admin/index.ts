// Franko — données du tableau de bord administrateur.
// Réservé aux adresses listées dans la table public.admins ou dans le secret ADMIN_EMAILS (séparées par des virgules).
// Actions : { action: 'me' } dit à tout utilisateur connecté s'il est administrateur (l'app affiche alors Pro et le lien
// du tableau de bord) ; { action: 'comp', userId, on, note } offre ou retire Pro (administrateurs seulement) ;
// sans action : les données du tableau de bord.
// Renvoie le strict nécessaire : comptes (e-mail, dates), abonnements, historique, dernière activité, langue et canton.
// Aucune donnée budgétaire (salaire, mouvements) ne sort d'ici.
// Déployer : supabase functions deploy admin --no-verify-jwt (le jeton est vérifié ici, avec la liste d'administrateurs).

const env = (k: string) => Deno.env.get(k) ?? '';
// Adresses autorisées à appeler la fonction depuis un navigateur : le secret SITE_URL (plusieurs : virgules) et les adresses publiques de l'app.
const ORIGINS = [...env('SITE_URL').split(','), 'https://franko-9fu.pages.dev', 'https://franko.ch'].map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
// En-têtes CORS propres à chaque requête : l'adresse d'origine si elle est autorisée, sinon la première de la liste.
const originOf = (req: Request) => { const o = req.headers.get('Origin') ?? ''; return ORIGINS.includes(o) ? o : ORIGINS[0]; };
const corsFor = (site: string) => ({ 'Access-Control-Allow-Origin': site, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
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
  const SITE = originOf(req), cors = corsFor(SITE); // retour après paiement : vers l'adresse d'où vient l'utilisateur
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const auth = req.headers.get('Authorization') ?? '';
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { Authorization: auth, apikey: env('SUPABASE_ANON_KEY') } });
  if (!r.ok) return json({ error: 'auth' }, 401);
  const me = await r.json();
  // administrateurs : secret ADMIN_EMAILS et table public.admins (lisible seulement par le serveur)
  const fromTable = await rest('admins?select=email').catch(() => []) as { email: string }[];
  const admins = [...new Set(env('ADMIN_EMAILS').split(',').concat(fromTable.map((x) => x.email)).map((s) => s.trim().toLowerCase()).filter(Boolean))];
  const isAdmin = !!me.email && admins.includes(String(me.email).toLowerCase());
  let body: { action?: string; userId?: string; on?: boolean; note?: string } = {};
  try { body = await req.json(); } catch { /* corps vide : données du tableau de bord */ }
  if (body.action === 'me') return json({ admin: isAdmin });
  if (!isAdmin) return json({ error: 'forbidden' }, 403);
  if (body.action === 'comp') {
    if (!body.userId || !/^[0-9a-f-]{36}$/i.test(body.userId)) return json({ error: 'user' }, 400);
    const on = body.on !== false;
    const row = { user_id: body.userId, comp: on, comp_note: on ? String(body.note ?? '').slice(0, 200) || null : null, comp_by: on ? me.email : null, comp_at: on ? new Date().toISOString() : null };
    const w = await fetch(env('SUPABASE_URL') + '/rest/v1/subscriptions?on_conflict=user_id', {
      method: 'POST', headers: { ...service, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row),
    });
    if (!w.ok) { console.error('comp', w.status, await w.text()); return json({ error: 'write' }, 500); }
    return json({ ok: true, comp: on });
  }
  try {
    const [users, subscriptions, events, activity] = await Promise.all([
      allUsers(),
      rest('subscriptions?select=user_id,status,price_interval,amount_chf,current_period_end,trial_end,canceled_at,created_at,comp,comp_note,comp_at'),
      rest('subscription_events?select=user_id,status,previous_status,price_interval,amount_chf,at&order=at.asc&limit=50000'),
      rest('budget_docs?select=user_id,updated_at,lang:doc->settings->>lang,canton:doc->settings->>canton'),
    ]);
    return json({ generatedAt: new Date().toISOString(), me: me.email, admins, users, subscriptions, events, activity });
  } catch (e) {
    console.error(e);
    return json({ error: 'query' }, 500);
  }
});
