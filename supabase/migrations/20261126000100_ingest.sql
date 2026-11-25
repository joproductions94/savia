-- Paiements envoyés automatiquement (Apple Pay via Raccourcis iOS, MacroDroid sur Android…).
-- Chaque utilisateur a une clé personnelle (seule son empreinte SHA-256 est stockée) ; les paiements reçus
-- attendent dans une boîte de réception que l'app vide à la prochaine ouverture.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.ingest_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);
alter table public.ingest_tokens enable row level security;
revoke all on public.ingest_tokens from anon, authenticated;

create table if not exists public.inbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  constraint inbox_payload_size check (pg_column_size(payload) < 4000)
);
create index if not exists inbox_user on public.inbox (user_id, received_at);
alter table public.inbox enable row level security;
drop policy if exists "inbox: lire la sienne" on public.inbox;
create policy "inbox: lire la sienne" on public.inbox for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "inbox: vider la sienne" on public.inbox;
create policy "inbox: vider la sienne" on public.inbox for delete to authenticated using ((select auth.uid()) = user_id);
revoke insert, update on public.inbox from anon, authenticated;

-- Crée (ou remplace) la clé personnelle et la renvoie une seule fois en clair.
create or replace function public.create_ingest_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  v_token := 'fk_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.ingest_tokens (user_id, token_hash)
  values (v_uid, encode(extensions.digest(v_token, 'sha256'), 'hex'))
  on conflict (user_id) do update set token_hash = excluded.token_hash, created_at = now();
  return v_token;
end;
$$;
revoke all on function public.create_ingest_token() from public, anon;
grant execute on function public.create_ingest_token() to authenticated;
