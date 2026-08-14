-- Tasteprint commercial campaign reporting extension.
-- Run after supabase/schema.sql when enabling the campaign engine in production.

create or replace function public.tasteprint_campaign_stats(p_campaign_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
with scoped as (
  select *
  from public.tasteprint_events
  where properties ->> 'campaign_id' = left(coalesce(p_campaign_id, ''), 80)
), totals as (
  select
    count(*) filter (where event_name = 'campaign_view')::int as views,
    count(*) filter (where event_name = 'campaign_result_match')::int as result_matches,
    count(*) filter (where event_name = 'campaign_cta')::int as cta_clicks,
    count(distinct session_id) filter (where event_name = 'campaign_view')::int as unique_view_sessions,
    count(distinct session_id) filter (where event_name = 'campaign_cta')::int as unique_cta_sessions
  from scoped
), item_clicks as (
  select coalesce(jsonb_object_agg(item_id, clicks), '{}'::jsonb) as value
  from (
    select properties ->> 'item_id' as item_id, count(*)::int as clicks
    from scoped
    where event_name = 'campaign_cta' and properties ? 'item_id'
    group by properties ->> 'item_id'
    order by count(*) desc
  ) ranked
)
select jsonb_build_object(
  'campaign_id', left(coalesce(p_campaign_id, ''), 80),
  'views', totals.views,
  'result_matches', totals.result_matches,
  'cta_clicks', totals.cta_clicks,
  'unique_view_sessions', totals.unique_view_sessions,
  'unique_cta_sessions', totals.unique_cta_sessions,
  'cta_rate', case when totals.views = 0 then 0 else round(100.0 * totals.cta_clicks / totals.views, 1) end,
  'item_clicks', item_clicks.value
)
from totals, item_clicks;
$$;

revoke all on function public.tasteprint_campaign_stats(text) from public;
grant execute on function public.tasteprint_campaign_stats(text) to anon;

comment on function public.tasteprint_campaign_stats(text) is 'Aggregate campaign views, matches, CTA activity and item clicks without exposing raw event rows.';
