-- Abonnements Stripe. L'utilisateur lit le sien ; seules les fonctions serveur (service_role) écrivent.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none', -- none | trialing | active | past_due | canceled | unpaid | incomplete
  price_interval text,                 -- month | year
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions: lire la sienne" on public.subscriptions;
create policy "subscriptions: lire la sienne" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.subscriptions from anon, authenticated;
