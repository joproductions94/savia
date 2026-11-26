// Franko — abonnements Stripe : ouverture du paiement, portail client et réception des événements (webhook).
// Secrets attendus : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTH, STRIPE_PRICE_YEAR, SITE_URL.
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.
// Déployer avec : supabase functions deploy billing --no-verify-jwt (le webhook Stripe n'a pas de jeton utilisateur ;
// les actions « checkout » et « portal » vérifient elles-mêmes le jeton).

const env = (k: string) => Deno.env.get(k) ?? '';
// Adresses autorisées à appeler la fonction depuis un navigateur : le secret SITE_URL (plusieurs : virgules) et les adresses publiques de l'app.
const ORIGINS = [...env('SITE_URL').split(','), 'https://franko-9fu.pages.dev', 'https://franko.ch'].map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
// En-têtes CORS propres à chaque requête : l'adresse d'origine si elle est autorisée, sinon la première de la liste.
const originOf = (req: Request) => { const o = req.headers.get('Origin') ?? ''; return ORIGINS.includes(o) ? o : ORIGINS[0]; };
const corsFor = (site: string) => ({ 'Access-Control-Allow-Origin': site, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });

// ---------- Stripe (API REST, formulaire encodé) ----------
function form(obj: Record<string, unknown>, prefix = '', out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === 'object' ? form(x as Record<string, unknown>, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(x))));
    else if (typeof v === 'object') form(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}
async function stripe(path: string, body?: Record<string, unknown>, method = 'POST') {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method,
    headers: { Authorization: 'Bearer ' + env('STRIPE_SECRET_KEY'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? form(body) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error('stripe ' + r.status + ' ' + (j?.error?.message ?? ''));
  return j;
}

// ---------- Supabase ----------
async function userFromJwt(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { Authorization: auth, apikey: env('SUPABASE_ANON_KEY') } });
  return r.ok ? await r.json() : null;
}
const admin = (path: string, init: RequestInit = {}) => fetch(env('SUPABASE_URL') + '/rest/v1/' + path, {
  ...init,
  headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + env('SUPABASE_SERVICE_ROLE_KEY'), 'Content-Type': 'application/json', ...(init.headers ?? {}) },
});
async function getSub(userId: string) {
  const r = await admin(`subscriptions?user_id=eq.${userId}&select=*`);
  const rows = r.ok ? await r.json() : [];
  return rows[0] ?? null;
}
async function upsertSub(row: Record<string, unknown>) {
  const r = await admin('subscriptions?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }) });
  if (!r.ok) throw new Error('upsert ' + r.status + ' ' + (await r.text()));
}

// ---------- signature Stripe (en-tête Stripe-Signature, HMAC SHA-256) ----------
async function verifyStripe(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const ts = parts.t, sig = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!ts || !sig.length || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${payload}`)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  return sig.some((s) => s.length === hex.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}

async function syncSubscription(sub: Record<string, any>) {
  const userId = sub.metadata?.user_id;
  if (!userId) return;
  const item = sub.items?.data?.[0];
  const end = item?.current_period_end ?? sub.current_period_end;
  const interval = item?.price?.recurring?.interval ?? null;
  const amount = item?.price?.unit_amount != null ? item.price.unit_amount / 100 : null;
  const before = await getSub(userId);
  await upsertSub({
    user_id: userId,
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_interval: interval,
    amount_chf: amount,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    ...(before?.stripe_subscription_id ? {} : { created_at: new Date((sub.created ?? Date.now() / 1000) * 1000).toISOString() }),
  });
  // une ligne d'historique à chaque changement de statut ou de formule
  if (!before || before.status !== sub.status || before.price_interval !== interval) {
    await admin('subscription_events', { method: 'POST', body: JSON.stringify({ user_id: userId, stripe_subscription_id: sub.id, status: sub.status, previous_status: before?.status ?? null, price_interval: interval, amount_chf: amount }) });
  }
}

Deno.serve(async (req) => {
  const SITE = originOf(req), cors = corsFor(SITE); // retour après paiement : vers l'adresse d'où vient l'utilisateur
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  // Webhook Stripe
  const sigHeader = req.headers.get('Stripe-Signature');
  if (sigHeader) {
    const payload = await req.text();
    if (!(await verifyStripe(payload, sigHeader, env('STRIPE_WEBHOOK_SECRET')))) return json({ error: 'signature' }, 400);
    const event = JSON.parse(payload);
    try {
      if (event.type.startsWith('customer.subscription.')) await syncSubscription(event.data.object);
      else if (event.type === 'checkout.session.completed' && event.data.object.subscription) {
        await syncSubscription(await stripe('subscriptions/' + event.data.object.subscription, undefined, 'GET'));
      }
    } catch (e) {
      console.error(e);
      return json({ error: 'sync' }, 500); // Stripe réessaiera
    }
    return json({ received: true });
  }

  // Actions de l'app (utilisateur connecté)
  const user = await userFromJwt(req);
  if (!user) return json({ error: 'auth' }, 401);
  let body: { action?: string; interval?: string; returnUrl?: string } = {};
  try { body = await req.json(); } catch { /* corps vide */ }
  const back = body.returnUrl && body.returnUrl.startsWith(SITE) ? body.returnUrl : SITE + '/app.html';
  try {
    const sub = await getSub(user.id);
    let customer = sub?.stripe_customer_id;
    if (!customer) {
      const c = await stripe('customers', { email: user.email, metadata: { user_id: user.id } });
      customer = c.id;
      await upsertSub({ user_id: user.id, stripe_customer_id: customer, status: sub?.status ?? 'none' });
    }
    if (body.action === 'portal') {
      const s = await stripe('billing_portal/sessions', { customer, return_url: back });
      return json({ url: s.url });
    }
    if (body.action === 'checkout') {
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        const s = await stripe('billing_portal/sessions', { customer, return_url: back });
        return json({ url: s.url });
      }
      const price = body.interval === 'year' ? env('STRIPE_PRICE_YEAR') : env('STRIPE_PRICE_MONTH');
      const s = await stripe('checkout/sessions', {
        mode: 'subscription',
        customer,
        client_reference_id: user.id,
        line_items: [{ price, quantity: 1 }],
        subscription_data: { metadata: { user_id: user.id }, trial_period_days: 30 },
        allow_promotion_codes: true,
        locale: 'auto',
        success_url: back + (back.includes('?') ? '&' : '?') + 'pro=1',
        cancel_url: back,
      });
      return json({ url: s.url });
    }
    return json({ error: 'action' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: 'billing' }, 502);
  }
});
