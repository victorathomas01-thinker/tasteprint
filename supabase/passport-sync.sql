-- Tasteprint optional account + Passport sync
-- Run after supabase/schema.sql.
--
-- Anonymous Tasteprint remains available without an account. These rows exist only for
-- users who explicitly sign in through Supabase Auth and choose to sync their Passport.
-- Email addresses live in Supabase Auth; this table stores user_id + preference snapshots,
-- not email, raw quiz answers, campaign leads, or anonymous analytics identifiers.

create extension if not exists pgcrypto;

create table if not exists public.tasteprint_passport_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_key text not null,
  sync_version integer not null default 1,
  snapshot_version integer not null default 1,
  module_id text not null,
  created_at timestamptz not null,
  synced_at timestamptz not null default now(),
  source text not null default 'quiz',
  archetype text not null default '',
  mode text not null default '',
  module_scores jsonb not null default '{}'::jsonb,
  master_scores jsonb not null default '{}'::jsonb,
  signature text not null default '',
  constraint tasteprint_passport_client_key_length check (char_length(client_key) between 1 and 220),
  constraint tasteprint_passport_module_id_format check (module_id ~ '^[a-z0-9-]{1,40}$'),
  constraint tasteprint_passport_module_scores_object check (jsonb_typeof(module_scores) = 'object'),
  constraint tasteprint_passport_master_scores_object check (jsonb_typeof(master_scores) = 'object'),
  constraint tasteprint_passport_known_module check (module_id in ('escape','wear','watch','move','eat','live')),
  unique (user_id, client_key)
);

create index if not exists tasteprint_passport_user_created_idx
  on public.tasteprint_passport_snapshots(user_id, created_at desc);

alter table public.tasteprint_passport_snapshots enable row level security;

-- Account-backed Passport data is readable/writable only by that authenticated user.
drop policy if exists "users can read own passport" on public.tasteprint_passport_snapshots;
create policy "users can read own passport"
on public.tasteprint_passport_snapshots
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "users can insert own passport" on public.tasteprint_passport_snapshots;
create policy "users can insert own passport"
on public.tasteprint_passport_snapshots
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "users can update own passport" on public.tasteprint_passport_snapshots;
create policy "users can update own passport"
on public.tasteprint_passport_snapshots
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "users can delete own passport" on public.tasteprint_passport_snapshots;
create policy "users can delete own passport"
on public.tasteprint_passport_snapshots
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Keep account history bounded to the same 60-snapshot limit used by the local Passport.
-- This function is invoked only in an authenticated context and can delete only auth.uid().
create or replace function public.tasteprint_prune_my_passport(p_keep integer default 60)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_deleted integer := 0;
  v_keep integer := greatest(1, least(coalesce(p_keep, 60), 200));
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  delete from public.tasteprint_passport_snapshots
  where id in (
    select id
    from public.tasteprint_passport_snapshots
    where user_id = auth.uid()
    order by created_at desc, synced_at desc
    offset v_keep
  );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.tasteprint_prune_my_passport(integer) from public;
grant execute on function public.tasteprint_prune_my_passport(integer) to authenticated;

comment on table public.tasteprint_passport_snapshots is
  'Optional account-backed Tasteprint Passport snapshots. No email, raw answers, campaign leads, or anonymous analytics identifiers are stored here.';
comment on function public.tasteprint_prune_my_passport(integer) is
  'Authenticated self-service history bound for the current user only.';
