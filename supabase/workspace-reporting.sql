-- Tasteprint authenticated Workspace campaign reporting
-- Run after supabase/campaigns.sql and supabase/workspaces.sql.
--
-- Client campaign performance can be commercially sensitive even when it contains no PII.
-- The original aggregate RPC is therefore removed from public browser roles and a
-- workspace-scoped replacement checks authenticated membership before returning metrics.

revoke all on function public.tasteprint_campaign_stats(text) from public, anon, authenticated;
grant execute on function public.tasteprint_campaign_stats(text) to service_role;

create or replace function public.tasteprint_workspace_campaign_stats(
  p_workspace_id uuid,
  p_campaign_id text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_campaign_id text := lower(trim(coalesce(p_campaign_id, '')));
  v_owned boolean := false;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  v_role := public.tasteprint_workspace_role(p_workspace_id);
  if v_role is null then
    raise exception 'workspace membership required';
  end if;

  select exists (
    select 1
    from public.tasteprint_workspace_campaigns wc
    where wc.workspace_id = p_workspace_id
      and wc.campaign_id = v_campaign_id
  ) into v_owned;

  if not v_owned then
    raise exception 'campaign does not belong to this workspace';
  end if;

  select public.tasteprint_campaign_stats(v_campaign_id) into v_result;
  return v_result;
end;
$$;

revoke all on function public.tasteprint_workspace_campaign_stats(uuid, text) from public;
grant execute on function public.tasteprint_workspace_campaign_stats(uuid, text) to authenticated;

comment on function public.tasteprint_workspace_campaign_stats(uuid, text) is
'Authenticated tenant-scoped aggregate campaign report. Requires membership in the owning workspace; does not expose raw event or lead rows.';
