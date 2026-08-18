-- Tasteprint workspace member-reference privacy hardening
-- Run after supabase/workspaces.sql and before/with workspace-lifecycle.sql.
--
-- Browser-visible member_ref values are scoped to the workspace. The same Auth user gets
-- a different opaque reference in every workspace, preventing member lists from becoming
-- a cross-tenant account-correlation identifier.

create or replace function public.tasteprint_workspace_members_public(p_workspace_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.tasteprint_workspace_role(p_workspace_id) is null then '[]'::jsonb
    else coalesce((
      select jsonb_agg(jsonb_build_object(
        'member_ref', substring(encode(digest(p_workspace_id::text || ':' || m.user_id::text, 'sha256'), 'hex') from 1 for 12),
        'role', m.role,
        'joined_at', m.joined_at,
        'is_me', m.user_id = auth.uid()
      ) order by m.joined_at)
      from public.tasteprint_workspace_members m
      where m.workspace_id = p_workspace_id
    ), '[]'::jsonb)
  end;
$$;

revoke all on function public.tasteprint_workspace_members_public(uuid) from public;
grant execute on function public.tasteprint_workspace_members_public(uuid) to authenticated;

create or replace function public.tasteprint_set_workspace_member_role(
  p_workspace_id uuid,
  p_member_ref text,
  p_role text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
  v_current_role text;
  v_role text := lower(trim(coalesce(p_role, '')));
begin
  if public.tasteprint_workspace_role(p_workspace_id) <> 'owner' then raise exception 'owner permission required'; end if;
  if v_role not in ('admin','editor','analyst','viewer') then raise exception 'invalid role'; end if;

  select user_id, role into v_target, v_current_role
  from public.tasteprint_workspace_members
  where workspace_id = p_workspace_id
    and substring(encode(digest(p_workspace_id::text || ':' || user_id::text, 'sha256'), 'hex') from 1 for 12) = lower(trim(p_member_ref))
  limit 1;

  if v_target is null then raise exception 'member not found'; end if;
  if v_current_role = 'owner' then raise exception 'owner role cannot be changed here'; end if;

  update public.tasteprint_workspace_members
  set role = v_role
  where workspace_id = p_workspace_id and user_id = v_target;
  return true;
end;
$$;

revoke all on function public.tasteprint_set_workspace_member_role(uuid, text, text) from public;
grant execute on function public.tasteprint_set_workspace_member_role(uuid, text, text) to authenticated;

create or replace function public.tasteprint_remove_workspace_member(p_workspace_id uuid, p_member_ref text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
  v_target_role text;
begin
  if public.tasteprint_workspace_role(p_workspace_id) <> 'owner' then raise exception 'owner permission required'; end if;

  select user_id, role into v_target, v_target_role
  from public.tasteprint_workspace_members
  where workspace_id = p_workspace_id
    and substring(encode(digest(p_workspace_id::text || ':' || user_id::text, 'sha256'), 'hex') from 1 for 12) = lower(trim(p_member_ref))
  limit 1;

  if v_target is null then raise exception 'member not found'; end if;
  if v_target_role = 'owner' then raise exception 'owner cannot be removed'; end if;

  delete from public.tasteprint_workspace_members
  where workspace_id = p_workspace_id and user_id = v_target;
  return true;
end;
$$;

revoke all on function public.tasteprint_remove_workspace_member(uuid, text) from public;
grant execute on function public.tasteprint_remove_workspace_member(uuid, text) to authenticated;

comment on function public.tasteprint_workspace_members_public(uuid) is
'Privacy-limited workspace member list. member_ref is a workspace-scoped SHA-256-derived reference so it cannot correlate one Auth user across tenants.';
