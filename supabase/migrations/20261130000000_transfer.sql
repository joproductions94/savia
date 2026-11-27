-- Passage des données de Safari vers l'app de l'écran d'accueil (iPhone), sans compte.
-- Sur iOS, l'app ajoutée à l'écran d'accueil ne voit pas le stockage de Safari. Safari dépose une copie
-- CHIFFRÉE (AES-GCM, clé connue seulement du téléphone, jamais envoyée) sous un identifiant aléatoire ;
-- l'app de l'écran d'accueil, ouverte avec ce même identifiant dans son adresse, la reprend puis elle est effacée.
-- Copie gardée 7 jours au plus. Personne ne peut lire la table directement.
create table if not exists public.app_transfer (
  id_hash text primary key,
  data text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_transfer enable row level security;
revoke all on table public.app_transfer from anon, authenticated;

create or replace function public.put_transfer(p_id text, p_data text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_id !~ '^[0-9a-f]{32}$' or length(coalesce(p_data, '')) not between 16 and 800000 then
    raise exception 'invalid' using errcode = '22023';
  end if;
  delete from public.app_transfer where updated_at < now() - interval '7 days';
  insert into public.app_transfer (id_hash, data) values (encode(sha256(convert_to(p_id, 'UTF8')), 'hex'), p_data)
  on conflict (id_hash) do update set data = excluded.data, updated_at = now();
end;
$$;

create or replace function public.take_transfer(p_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v text;
begin
  if p_id !~ '^[0-9a-f]{32}$' then return null; end if;
  delete from public.app_transfer
  where id_hash = encode(sha256(convert_to(p_id, 'UTF8')), 'hex') and updated_at > now() - interval '7 days'
  returning data into v;
  return v;
end;
$$;

revoke all on function public.put_transfer(text, text) from public;
revoke all on function public.take_transfer(text) from public;
grant execute on function public.put_transfer(text, text) to anon, authenticated;
grant execute on function public.take_transfer(text) to anon, authenticated;
