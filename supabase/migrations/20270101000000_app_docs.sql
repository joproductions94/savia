-- Un document de données par utilisateur. Chaque utilisateur ne voit et n'écrit que le sien (RLS).
create table if not exists public.app_docs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  doc jsonb not null,
  rev integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint app_docs_size check (pg_column_size(doc) < 5000000)
);
alter table public.app_docs enable row level security;

drop policy if exists "app_docs: lire le sien" on public.app_docs;
create policy "app_docs: lire le sien" on public.app_docs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "app_docs: créer le sien" on public.app_docs;
create policy "app_docs: créer le sien" on public.app_docs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "app_docs: modifier le sien" on public.app_docs;
create policy "app_docs: modifier le sien" on public.app_docs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "app_docs: supprimer le sien" on public.app_docs;
create policy "app_docs: supprimer le sien" on public.app_docs for delete to authenticated using ((select auth.uid()) = user_id);

-- Écriture optimiste : n'écrit que si la version de base est toujours la dernière.
-- Sinon erreur 23505, que PostgREST renvoie en HTTP 409 ; l'app relit, fusionne et réessaie.
create or replace function public.save_app_doc(p_doc jsonb, p_base_rev integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_rev integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_base_rev is null or p_base_rev = 0 then
    insert into public.app_docs (user_id, doc, rev) values (v_uid, p_doc, 1)
    on conflict (user_id) do nothing
    returning rev into v_rev;
  else
    update public.app_docs set doc = p_doc, rev = rev + 1, updated_at = now()
    where user_id = v_uid and rev = p_base_rev
    returning rev into v_rev;
  end if;
  if v_rev is null then
    raise exception 'conflict' using errcode = '23505';
  end if;
  return v_rev;
end;
$$;
revoke all on function public.save_app_doc(jsonb, integer) from public, anon;
grant execute on function public.save_app_doc(jsonb, integer) to authenticated;
