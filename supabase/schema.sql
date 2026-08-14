-- Tasteprint Data MVP
-- Run this in the Supabase SQL editor for the project backing the public app.
-- The browser uses the public anon key. Row-level security only permits inserts;
-- population statistics and explicitly shared short profiles are exposed through narrow RPCs.

create extension if not exists pgcrypto;

create table if not exists public.tasteprint_profiles (
  id uuid primary key,
  created_at timestamptz not null default now(),
  session_id uuid not null,
  install_id uuid not null,
  owner_hash text,
  short_code text,
  referral_id text,
  source text not null default 'quiz',
  archetype text not null,
  travel_mode text not null,
  scores jsonb not null,
  constraint tasteprint_profiles_scores_object check (jsonb_typeof(scores) = 'object')
);

alter table public.tasteprint_profiles add column if not exists owner_hash text;
alter table public.tasteprint_profiles add column if not exists short_code text;

create unique index if not exists tasteprint_profiles_short_code_uidx on public.tasteprint_profiles(short_code) where short_code is not null;
create index if not exists tasteprint_profiles_created_at_idx on public.tasteprint_profiles(created_at desc);
create index if not exists tasteprint_profiles_archetype_idx on public.tasteprint_profiles(archetype);
create index if not exists tasteprint_profiles_travel_mode_idx on public.tasteprint_profiles(travel_mode);
create index if not exists tasteprint_profiles_referral_idx on public.tasteprint_profiles(referral_id) where referral_id is not null;
create index if not exists tasteprint_profiles_owner_idx on public.tasteprint_profiles(install_id, owner_hash) where owner_hash is not null;

create table if not exists public.tasteprint_events (
  id uuid primary key,
  analytics_version integer not null,
  created_at timestamptz not null default now(),
  event_name text not null,
  session_id uuid not null,
  install_id uuid not null,
  owner_hash text,
  referral_id text,
  route_kind text not null default 'standard',
  properties jsonb not null default '{}'::jsonb,
  constraint tasteprint_events_properties_object check (jsonb_typeof(properties) = 'object')
);

alter table public.tasteprint_events add column if not exists owner_hash text;

create index if not exists tasteprint_events_created_at_idx on public.tasteprint_events(created_at desc);
create index if not exists tasteprint_events_name_idx on public.tasteprint_events(event_name);
create index if not exists tasteprint_events_session_idx on public.tasteprint_events(session_id);
create index if not exists tasteprint_events_referral_idx on public.tasteprint_events(referral_id) where referral_id is not null;
create index if not exists tasteprint_events_owner_idx on public.tasteprint_events(install_id, owner_hash) where owner_hash is not null;

alter table public.tasteprint_profiles enable row level security;
alter table public.tasteprint_events enable row level security;

-- Public clients may submit anonymous rows, but may not read raw rows.
drop policy if exists "anon can insert tasteprint profiles" on public.tasteprint_profiles;
create policy "anon can insert tasteprint profiles"
on public.tasteprint_profiles
for insert
to anon
with check (true);

drop policy if exists "anon can insert tasteprint events" on public.tasteprint_events;
create policy "anon can insert tasteprint events"
on public.tasteprint_events
for insert
to anon
with check (true);

-- Create a completed profile and give it an unguessable 10-character share code.
-- The code is only useful if the user deliberately shares it.
create or replace function public.tasteprint_create_profile(
  p_id uuid,
  p_session_id uuid,
  p_install_id uuid,
  p_owner_hash text,
  p_referral_id text,
  p_source text,
  p_archetype text,
  p_travel_mode text,
  p_scores jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if jsonb_typeof(p_scores) <> 'object' then
    raise exception 'scores must be a JSON object';
  end if;

  if p_owner_hash is null or p_owner_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid owner hash';
  end if;

  loop
    v_code := substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10);
    begin
      insert into public.tasteprint_profiles (
        id, session_id, install_id, owner_hash, short_code, referral_id,
        source, archetype, travel_mode, scores
      ) values (
        p_id,
        p_session_id,
        p_install_id,
        p_owner_hash,
        v_code,
        nullif(left(coalesce(p_referral_id, ''), 64), ''),
        left(coalesce(p_source, 'quiz'), 40),
        left(coalesce(p_archetype, ''), 100),
        left(coalesce(p_travel_mode, ''), 100),
        p_scores
      );
      exit;
    exception when unique_violation then
      -- A 40-bit collision is extremely unlikely, but retry rather than fail.
    end;
  end loop;

  return jsonb_build_object('id', p_id, 'short_code', v_code);
end;
$$;

revoke all on function public.tasteprint_create_profile(uuid, uuid, uuid, text, text, text, text, text, jsonb) from public;
grant execute on function public.tasteprint_create_profile(uuid, uuid, uuid, text, text, text, text, text, jsonb) to anon;

-- Resolve only the fields needed to render a result someone intentionally shared.
-- Raw events, install IDs, owner hashes, referral tokens, and session IDs stay private.
create or replace function public.tasteprint_shared_profile(p_short_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
select jsonb_build_object(
  'short_code', short_code,
  'created_at', created_at,
  'archetype', archetype,
  'travel_mode', travel_mode,
  'scores', scores
)
from public.tasteprint_profiles
where short_code = lower(p_short_code)
limit 1;
$$;

revoke all on function public.tasteprint_shared_profile(text) from public;
grant execute on function public.tasteprint_shared_profile(text) to anon;

-- Aggregate dashboard payload. No raw profile rows are exposed.
create or replace function public.tasteprint_public_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
with totals as (
  select count(*)::int as total_profiles from public.tasteprint_profiles
), archetypes as (
  select coalesce(jsonb_object_agg(archetype, count), '{}'::jsonb) as value
  from (
    select archetype, count(*)::int as count
    from public.tasteprint_profiles
    group by archetype
    order by count(*) desc
  ) x
), modes as (
  select coalesce(jsonb_object_agg(travel_mode, count), '{}'::jsonb) as value
  from (
    select travel_mode, count(*)::int as count
    from public.tasteprint_profiles
    group by travel_mode
    order by count(*) desc
  ) x
), funnel as (
  select jsonb_build_object(
    'page_view', count(*) filter (where event_name = 'page_view'),
    'quiz_start', count(*) filter (where event_name = 'quiz_start'),
    'quiz_complete', count(*) filter (where event_name = 'quiz_complete'),
    'challenge_create', count(*) filter (where event_name = 'challenge_create'),
    'challenge_receive', count(*) filter (where event_name = 'challenge_receive'),
    'challenge_complete', count(*) filter (where event_name = 'challenge_complete'),
    'remote_match_unlock', count(*) filter (where event_name = 'remote_match_unlock')
  ) as value
  from public.tasteprint_events
)
select jsonb_build_object(
  'total_profiles', totals.total_profiles,
  'archetypes', archetypes.value,
  'travel_modes', modes.value,
  'funnel', funnel.value,
  'percentiles_enabled', totals.total_profiles >= 50
)
from totals, archetypes, modes, funnel;
$$;

revoke all on function public.tasteprint_public_stats() from public;
grant execute on function public.tasteprint_public_stats() to anon;

-- Percentiles are deliberately unavailable until the minimum comparison sample exists.
create or replace function public.tasteprint_percentiles(target_scores jsonb)
returns jsonb
language sql
security definer
set search_path = public
as $$
with total as (
  select count(*)::numeric as n from public.tasteprint_profiles
), dims as (
  select unnest(array[
    'romance','novelty','comfort','structure','social',
    'activity','culture','serenity','aesthetic','spontaneity'
  ]) as dimension
), ranked as (
  select
    d.dimension,
    round(
      100 * count(*) filter (
        where (p.scores ->> d.dimension)::numeric <= (target_scores ->> d.dimension)::numeric
      )::numeric / nullif(count(*), 0),
      0
    )::int as percentile
  from dims d
  cross join public.tasteprint_profiles p
  group by d.dimension
)
select case
  when total.n < 50 then jsonb_build_object('available', false, 'sample_size', total.n::int, 'minimum', 50)
  else jsonb_build_object(
    'available', true,
    'sample_size', total.n::int,
    'values', (select jsonb_object_agg(dimension, percentile) from ranked)
  )
end
from total;
$$;

revoke all on function public.tasteprint_percentiles(jsonb) from public;
grant execute on function public.tasteprint_percentiles(jsonb) to anon;

-- Privacy deletion: possession of the browser's random deletion token is required.
-- Only its SHA-256 hash is stored with rows; the raw token never leaves the browser except
-- when the user explicitly asks the server to delete their data.
create or replace function public.tasteprint_delete_my_data(p_install_id uuid, p_owner_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_profiles int := 0;
  v_events int := 0;
begin
  if p_owner_token is null or length(p_owner_token) < 16 then
    raise exception 'invalid deletion token';
  end if;

  v_hash := encode(digest(p_owner_token, 'sha256'), 'hex');

  delete from public.tasteprint_profiles
  where install_id = p_install_id and owner_hash = v_hash;
  get diagnostics v_profiles = row_count;

  delete from public.tasteprint_events
  where install_id = p_install_id and owner_hash = v_hash;
  get diagnostics v_events = row_count;

  return jsonb_build_object('profiles', v_profiles, 'events', v_events);
end;
$$;

revoke all on function public.tasteprint_delete_my_data(uuid, text) from public;
grant execute on function public.tasteprint_delete_my_data(uuid, text) to anon;

-- Raw anonymous rows have a 180-day production retention target.
-- Call this from a trusted Supabase cron job or an operator context; it is not public.
create or replace function public.tasteprint_prune_old_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profiles int := 0;
  v_events int := 0;
begin
  delete from public.tasteprint_profiles where created_at < now() - interval '180 days';
  get diagnostics v_profiles = row_count;

  delete from public.tasteprint_events where created_at < now() - interval '180 days';
  get diagnostics v_events = row_count;

  return jsonb_build_object('profiles', v_profiles, 'events', v_events);
end;
$$;

revoke all on function public.tasteprint_prune_old_data() from public;
revoke all on function public.tasteprint_prune_old_data() from anon;
revoke all on function public.tasteprint_prune_old_data() from authenticated;

comment on table public.tasteprint_profiles is 'Anonymous Tasteprint score vectors and result labels. No raw answers, names, or email addresses.';
comment on table public.tasteprint_events is 'Anonymous product funnel events. Raw answer choices are intentionally not collected.';
comment on function public.tasteprint_delete_my_data(uuid, text) is 'Deletes anonymous Tasteprint rows for one browser only when its private deletion token matches.';
comment on function public.tasteprint_prune_old_data() is 'Trusted maintenance function enforcing the 180-day raw anonymous data retention target.';
