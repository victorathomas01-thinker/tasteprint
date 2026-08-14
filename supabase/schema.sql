-- Tasteprint Data MVP
-- Run this in the Supabase SQL editor for the project backing the public app.
-- The browser uses the public anon key. Row-level security only permits inserts;
-- population statistics are exposed through narrow aggregate functions.

create extension if not exists pgcrypto;

create table if not exists public.tasteprint_profiles (
  id uuid primary key,
  created_at timestamptz not null default now(),
  session_id uuid not null,
  install_id uuid not null,
  referral_id text,
  source text not null default 'quiz',
  archetype text not null,
  travel_mode text not null,
  scores jsonb not null,
  constraint tasteprint_profiles_scores_object check (jsonb_typeof(scores) = 'object')
);

create index if not exists tasteprint_profiles_created_at_idx on public.tasteprint_profiles(created_at desc);
create index if not exists tasteprint_profiles_archetype_idx on public.tasteprint_profiles(archetype);
create index if not exists tasteprint_profiles_travel_mode_idx on public.tasteprint_profiles(travel_mode);
create index if not exists tasteprint_profiles_referral_idx on public.tasteprint_profiles(referral_id) where referral_id is not null;

create table if not exists public.tasteprint_events (
  id uuid primary key,
  analytics_version integer not null,
  created_at timestamptz not null default now(),
  event_name text not null,
  session_id uuid not null,
  install_id uuid not null,
  referral_id text,
  route_kind text not null default 'standard',
  properties jsonb not null default '{}'::jsonb,
  constraint tasteprint_events_properties_object check (jsonb_typeof(properties) = 'object')
);

create index if not exists tasteprint_events_created_at_idx on public.tasteprint_events(created_at desc);
create index if not exists tasteprint_events_name_idx on public.tasteprint_events(event_name);
create index if not exists tasteprint_events_session_idx on public.tasteprint_events(session_id);
create index if not exists tasteprint_events_referral_idx on public.tasteprint_events(referral_id) where referral_id is not null;

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

grant execute on function public.tasteprint_percentiles(jsonb) to anon;

comment on table public.tasteprint_profiles is 'Anonymous Tasteprint score vectors and result labels. No raw answers, names, or email addresses.';
comment on table public.tasteprint_events is 'Anonymous product funnel events. Raw answer choices are intentionally not collected.';
