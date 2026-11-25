-- Historique des abonnements pour le tableau de bord (MRR dans le temps, résiliations, conversions d'essai).
-- Écrit uniquement par la fonction billing (service_role) ; illisible pour les utilisateurs.
alter table public.subscriptions add column if not exists created_at timestamptz not null default now();
alter table public.subscriptions add column if not exists canceled_at timestamptz;
alter table public.subscriptions add column if not exists trial_end timestamptz;
alter table public.subscriptions add column if not exists amount_chf numeric(10, 2);

create table if not exists public.subscription_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id text,
  status text not null,        -- statut Stripe après l'événement
  previous_status text,
  price_interval text,
  amount_chf numeric(10, 2),
  at timestamptz not null default now()
);
create index if not exists subscription_events_at on public.subscription_events (at);
create index if not exists subscription_events_user on public.subscription_events (user_id, at);
alter table public.subscription_events enable row level security;
revoke all on public.subscription_events from anon, authenticated;
