-- REVIEW ONLY: after workspaces.sql and the existing Workspace dependencies.
-- Separate trigger so canonical identity/RPC reapplication cannot remove this guard.
begin;
create or replace function public.tasteprint_advance_workspace_campaign_version()
returns trigger language plpgsql security invoker set search_path=public,extensions,pg_temp as $$
begin
 -- Include legacy/raw authorized updates and publication-status changes. Clients
 -- cannot reset/skip the counter to make an old conditional edit appear current.
 new.version:=old.version+1;
 return new;
end;$$;
revoke all on function public.tasteprint_advance_workspace_campaign_version() from public,anon,authenticated;
drop trigger if exists tasteprint_workspace_campaign_revision on public.tasteprint_workspace_campaigns;
create trigger tasteprint_workspace_campaign_revision before update on public.tasteprint_workspace_campaigns for each row execute function public.tasteprint_advance_workspace_campaign_version();
commit;
