-- Passage de session vers l'app de l'écran d'accueil (iPhone).
-- Sur iOS, l'app ajoutée à l'écran d'accueil a son propre stockage : la connexion Google peut se terminer dans
-- Safari. L'app crée un code aléatoire (128 bits), la page qui reçoit la connexion y dépose le jeton de
-- rafraîchissement, l'app le reprend une seule fois. Code haché, valable 10 minutes, table lisible par personne.
create table if not exists public.auth_handoff (
  code_hash text primary key,
  refresh_token text not null,
  created_at timestamptz not null default now()
);
alter table public.auth_handoff enable row level security;
revoke all on table public.auth_handoff from anon, authenticated;

create or replace function public.put_handoff(p_code text, p_refresh text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_code !~ '^[0-9a-f]{32}$' or length(coalesce(p_refresh, '')) not between 8 and 200 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  delete from public.auth_handoff where created_at < now() - interval '10 minutes';
  insert into public.auth_handoff (code_hash, refresh_token)
  values (encode(sha256(convert_to(p_code, 'UTF8')), 'hex'), p_refresh)
  on conflict (code_hash) do update set refresh_token = excluded.refresh_token, created_at = now();
end;
$$;

create or replace function public.take_handoff(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if p_code !~ '^[0-9a-f]{32}$' then
    return null;
  end if;
  delete from public.auth_handoff
  where code_hash = encode(sha256(convert_to(p_code, 'UTF8')), 'hex') and created_at > now() - interval '10 minutes'
  returning refresh_token into v_token;
  return v_token;
end;
$$;

revoke all on function public.put_handoff(text, text) from public, anon;
grant execute on function public.put_handoff(text, text) to authenticated;
revoke all on function public.take_handoff(text) from public;
grant execute on function public.take_handoff(text) to anon, authenticated;
