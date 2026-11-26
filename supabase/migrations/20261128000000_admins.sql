-- Administrateurs (propriétaire, associés) : Pro sans abonnement et accès au tableau de bord.
-- Lu uniquement par la fonction « admin » (service_role) ; invisible et non modifiable pour les utilisateurs.
-- S'ajoute au secret ADMIN_EMAILS, qui reste possible. Ajouter un administrateur (éditeur SQL de Supabase) :
--   insert into public.admins(email) values ('adresse@exemple.ch');
create table if not exists public.admins (
  email text primary key check (email = lower(email) and position('@' in email) > 1),
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
