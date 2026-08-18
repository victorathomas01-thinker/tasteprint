-- Tasteprint referral attribution reporting
-- Run after supabase/schema.sql.
-- Public clients get aggregate loop metrics only. Raw referral tokens and event rows stay private.

create index if not exists tasteprint_events_referral_token_idx
on public.tasteprint_events ((properties ->> 'referral_token'))
where event_name in ('challenge_create', 'challenge_share_outcome');

create or replace function public.tasteprint_referral_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
with created as (
  select distinct properties ->> 'referral_token' as token
  from public.tasteprint_events
  where event_name = 'challenge_create'
    and coalesce(properties ->> 'referral_token', '') ~ '^[A-Za-z0-9]{8,64}$'
), share_outcomes as (
  select
    count(*) filter (where properties ->> 'outcome' = 'shared')::int as shared,
    count(*) filter (where properties ->> 'outcome' = 'copied')::int as copied,
    count(*) filter (where properties ->> 'outcome' = 'show')::int as show,
    count(*) filter (where properties ->> 'outcome' = 'cancelled')::int as cancelled,
    count(*) filter (where properties ->> 'outcome' in ('shared','copied'))::int as successful
  from public.tasteprint_events
  where event_name = 'challenge_share_outcome'
), opens as (
  select
    count(*)::int as total,
    count(*) filter (where referral_id ~ '^[A-Za-z0-9]{8,64}$')::int as attributed,
    count(distinct session_id)::int as unique_sessions,
    count(distinct session_id) filter (where referral_id ~ '^[A-Za-z0-9]{8,64}$')::int as attributed_unique_sessions
  from public.tasteprint_events
  where event_name = 'challenge_receive'
), completes as (
  select count(*)::int as total
  from public.tasteprint_events
  where event_name = 'challenge_complete'
    and referral_id ~ '^[A-Za-z0-9]{8,64}$'
), matches as (
  select count(*)::int as total
  from public.tasteprint_events
  where event_name = 'remote_match_unlock'
    and referral_id ~ '^[A-Za-z0-9]{8,64}$'
), actions as (
  select count(*)::int as total
  from public.tasteprint_events
  where event_name = 'challenge_create'
), token_outcomes as (
  select
    c.token,
    exists (
      select 1 from public.tasteprint_events e
      where e.event_name = 'challenge_receive' and e.referral_id = c.token
    ) as opened,
    exists (
      select 1 from public.tasteprint_events e
      where e.event_name = 'challenge_complete' and e.referral_id = c.token
    ) as completed
  from created c
), token_totals as (
  select
    count(*)::int as creator_tokens,
    count(*) filter (where opened)::int as tokens_opened,
    count(*) filter (where completed)::int as tokens_completed
  from token_outcomes
), secondary as (
  select count(distinct session_id)::int as sessions
  from public.tasteprint_events
  where event_name = 'challenge_share_outcome'
    and referral_id ~ '^[A-Za-z0-9]{8,64}$'
    and properties ->> 'outcome' in ('shared','copied')
)
select jsonb_build_object(
  'report_version', 1,
  'minimum', 20,
  'sample_ready', token_totals.creator_tokens >= 20,
  'challenge_actions', actions.total,
  'creator_tokens', token_totals.creator_tokens,
  'successful_share_actions', share_outcomes.successful,
  'share_outcomes', jsonb_build_object(
    'shared', share_outcomes.shared,
    'copied', share_outcomes.copied,
    'show', share_outcomes.show,
    'cancelled', share_outcomes.cancelled
  ),
  'recipient_opens', opens.total,
  'attributed_opens', opens.attributed,
  'unique_recipient_sessions', opens.unique_sessions,
  'attributed_recipient_sessions', opens.attributed_unique_sessions,
  'recipient_completions', completes.total,
  'match_unlocks', matches.total,
  'tokens_opened', token_totals.tokens_opened,
  'tokens_completed', token_totals.tokens_completed,
  'secondary_share_sessions', secondary.sessions,
  'attribution_coverage_pct', case when opens.total > 0 then round(100.0 * opens.attributed / opens.total, 1) else null end,
  'token_activation_pct', case when token_totals.creator_tokens >= 20 then round(100.0 * token_totals.tokens_opened / nullif(token_totals.creator_tokens,0), 1) else null end,
  'completion_producing_token_pct', case when token_totals.creator_tokens >= 20 then round(100.0 * token_totals.tokens_completed / nullif(token_totals.creator_tokens,0), 1) else null end,
  'recipient_completion_pct', case when opens.attributed >= 20 then round(100.0 * completes.total / nullif(opens.attributed,0), 1) else null end,
  'same_session_reshare_pct', case when opens.attributed_unique_sessions >= 20 then round(100.0 * secondary.sessions / nullif(opens.attributed_unique_sessions,0), 1) else null end
)
from actions, share_outcomes, opens, completes, matches, token_totals, secondary;
$$;

revoke all on function public.tasteprint_referral_stats() from public;
grant execute on function public.tasteprint_referral_stats() to anon;

comment on function public.tasteprint_referral_stats() is
'Privacy-safe aggregate referral funnel. Never returns referral tokens, install IDs, session IDs, owner hashes, or raw event rows. Rate claims remain gated until enough creator/recipient samples exist.';
