-- Pro offert : accordé depuis le tableau de bord administrateur (fonction « admin », service_role).
-- L'utilisateur lit sa propre ligne (politique existante) mais ne peut jamais l'écrire : impossible de s'offrir Pro soi-même.
alter table public.subscriptions add column if not exists comp boolean not null default false;
alter table public.subscriptions add column if not exists comp_note text;
alter table public.subscriptions add column if not exists comp_by text;
alter table public.subscriptions add column if not exists comp_at timestamptz;
revoke insert, update, delete on public.subscriptions from anon, authenticated;
