-- Tasteprint recommendation-intelligence feedback pipeline
-- Run after supabase/schema.sql.
-- Structured recommendation feedback is stored as anonymous tasteprint_events rows.
-- This file adds a trusted aggregate review function only; it does not expose raw feedback
-- or automatically modify scoring weights.

create or replace function public.tasteprint_intelligence_summary(p_module text default null)
returns jsonb
language sql
security definer
set search_path = public
as $$
with feedback_events as (
  select
    created_at,
    lower(coalesce(properties ->> 'module', '')) as module,
    nullif(properties ->> 'result_key', '') as result_key,
    case
      when (properties ->> 'rating') ~ '^[1-4]$' then (properties ->> 'rating')::int
      else null
    end as rating,
    nullif(properties ->> 'archetype', '') as archetype,
    nullif(properties ->> 'mode', '') as mode,
    nullif(properties ->> 'confidence_level', '') as confidence_level,
    nullif(properties ->> 'experience_mode', '') as experience_mode,
    nullif(properties ->> 'mismatch_dimension', '') as mismatch_dimension,
    nullif(properties ->> 'mismatch_direction', '') as mismatch_direction,
    nullif(properties ->> 'feedback_stage', '') as feedback_stage
  from public.tasteprint_events
  where event_name = 'recommendation_feedback'
    and (p_module is null or lower(coalesce(properties ->> 'module', '')) = lower(p_module))
), ranked as (
  select
    *,
    row_number() over (
      partition by module, result_key
      order by created_at desc
    ) as latest_rank
  from feedback_events
  where result_key is not null and rating between 1 and 4
), latest as (
  select * from ranked where latest_rank = 1
), totals as (
  select
    count(*)::int as sample_size,
    round(avg(rating)::numeric, 2) as average_rating,
    count(*) filter (where rating = 4)::int as nailed,
    count(*) filter (where rating = 3)::int as mostly,
    count(*) filter (where rating = 2)::int as mixed,
    count(*) filter (where rating = 1)::int as missed
  from latest
), mismatches as (
  select coalesce(jsonb_object_agg(key, count), '{}'::jsonb) as value
  from (
    select
      mismatch_dimension || ':' || mismatch_direction as key,
      count(*)::int as count
    from latest
    where mismatch_dimension is not null
      and mismatch_direction in ('higher', 'lower')
    group by mismatch_dimension, mismatch_direction
    order by count(*) desc
  ) x
), confidence as (
  select coalesce(jsonb_object_agg(confidence_level, count), '{}'::jsonb) as value
  from (
    select confidence_level, count(*)::int as count
    from latest
    where confidence_level is not null
    group by confidence_level
    order by count(*) desc
  ) x
), experience as (
  select coalesce(jsonb_object_agg(experience_mode, count), '{}'::jsonb) as value
  from (
    select experience_mode, count(*)::int as count
    from latest
    where experience_mode is not null
    group by experience_mode
    order by count(*) desc
  ) x
), archetypes as (
  select coalesce(jsonb_object_agg(archetype, payload), '{}'::jsonb) as value
  from (
    select
      archetype,
      jsonb_build_object(
        'sample_size', count(*)::int,
        'average_rating', round(avg(rating)::numeric, 2)
      ) as payload
    from latest
    where archetype is not null
    group by archetype
    order by count(*) desc
  ) x
), modes as (
  select coalesce(jsonb_object_agg(mode, payload), '{}'::jsonb) as value
  from (
    select
      mode,
      jsonb_build_object(
        'sample_size', count(*)::int,
        'average_rating', round(avg(rating)::numeric, 2)
      ) as payload
    from latest
    where mode is not null
    group by mode
    order by count(*) desc
  ) x
)
select jsonb_build_object(
  'module', p_module,
  'sample_size', totals.sample_size,
  'minimum_for_review', 50,
  'learning_ready', totals.sample_size >= 50,
  'average_rating', totals.average_rating,
  'ratings', jsonb_build_object(
    'nailed', totals.nailed,
    'mostly', totals.mostly,
    'mixed', totals.mixed,
    'missed', totals.missed
  ),
  'mismatches', mismatches.value,
  'confidence_levels', confidence.value,
  'experience_modes', experience.value,
  'archetypes', archetypes.value,
  'modes', modes.value,
  'automatic_weight_updates', false
)
from totals, mismatches, confidence, experience, archetypes, modes;
$$;

revoke all on function public.tasteprint_intelligence_summary(text) from public;
revoke all on function public.tasteprint_intelligence_summary(text) from anon;
revoke all on function public.tasteprint_intelligence_summary(text) from authenticated;
grant execute on function public.tasteprint_intelligence_summary(text) to service_role;

comment on function public.tasteprint_intelligence_summary(text) is
'Trusted aggregate review of structured recommendation feedback. Requires service role, exposes no raw events, and never changes Tasteprint weights automatically.';
