-- Tasteprint Workspace lifecycle safeguards
-- Run after supabase/workspaces.sql and supabase/workspace-member-refs.sql.
--
-- This migration prevents Auth-account deletion from being blocked by nonessential audit
-- foreign keys, while still requiring a workspace owner to transfer or delete owned
-- workspaces before deleting the Auth account.

-- Audit references should not keep a departed Auth user alive. Membership is the actual
-- authorization record; created_by / updated_by are nullable audit metadata.
alter table public.tasteprint_workspaces
  drop constraint if exists tasteprint_workspaces_created_by_fkey;
alter table public.tasteprint_workspaces
  alter column created_by drop not null;
alter table public.tasteprint_workspaces
  add constraint tasteprint_workspaces_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.tasteprint_workspace_campaigns
  drop constraint if exists tasteprint_workspace_campaigns_created_by_fkey;
alter table public.tasteprint_workspace_campaigns
  drop constraint if exists tasteprint_workspace_campaigns_updated_by_fkey;
alter table public.tasteprint_workspace_campaigns
  alter column created_by drop not null,
  alter column updated_by drop not null;
alter table public.tasteprint_workspace_campaigns
  add constraint tasteprint_workspace_campaigns_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;
alter table public.tasteprint_workspace_campaigns
  add constraint tasteprint_workspace_campaigns_updated_by_fkey
  foreign key (updated_by) references auth.users(id) on delete set null;

-- Transfer ownership without exposing Auth UUIDs to the browser. The current owner is
-- demoted to admin and the selected member becomes the sole owner in one transaction.
create or replace function public.tasteprint_transfer_workspace_ownership(
  p_workspace_id uuid,
  p_member_ref text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_target uuid;
  v_target_role text;
begin
  if v_caller is null then raise exception 'authentication required'; end if;
  if public.tasteprint_workspace_role(p_workspace_id) <> 'owner' then
    raise exception 'owner permission required';
  end if;

  select user_id, role into v_target, v_target_role
  from public.tasteprint_workspace_members
  where workspace_id = p_workspace_id
    and substring(encode(digest(p_workspace_id::text || ':' || user_id::text, 'sha256'), 'hex') from 1 for 12) = lower(trim(p_member_ref))
  limit 1;

  if v_target is null then raise exception 'member not found'; end if;
  if v_target = v_caller then raise exception 'choose another member'; end if;
  if v_target_role = 'owner' then raise exception 'member is already owner'; end if;

  update public.tasteprint_workspace_members
  set role = 'admin'
  where workspace_id = p_workspace_id and user_id = v_caller and role = 'owner';

  update public.tasteprint_workspace_members
  set role = 'owner'
  where workspace_id = p_workspace_id and user_id = v_target;

  return true;
end;
$$;

revoke all on function public.tasteprint_transfer_workspace_ownership(uuid, text) from public;
grant execute on function public.tasteprint_transfer_workspace_ownership(uuid, text) to authenticated;

-- A sole owner can intentionally delete the workspace. Public campaign registry entries
-- owned by that workspace are removed first so an abandoned tenant cannot leave a public
-- campaign or permanently reserve a campaign id. Aggregate anonymous campaign events are
-- not keyed by the workspace and are unaffected by this admin cleanup.
create or replace function public.tasteprint_delete_workspace(p_workspace_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if public.tasteprint_workspace_role(p_workspace_id) <> 'owner' then
    raise exception 'owner permission required';
  end if;

  delete from public.tasteprint_campaigns
  where workspace_id = p_workspace_id;

  delete from public.tasteprint_workspaces
  where id = p_workspace_id;

  return true;
end;
$$;

revoke all on function public.tasteprint_delete_workspace(uuid) from public;
grant execute on function public.tasteprint_delete_workspace(uuid) to authenticated;

comment on function public.tasteprint_transfer_workspace_ownership(uuid, text) is
'Transfers workspace ownership using a workspace-scoped privacy-limited member_ref instead of exposing or correlating auth user UUIDs.';
comment on function public.tasteprint_delete_workspace(uuid) is
'Owner-only destructive workspace deletion; removes public registry manifests for that tenant before cascading private workspace data.';
