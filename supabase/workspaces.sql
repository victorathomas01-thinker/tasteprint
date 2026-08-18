-- Tasteprint multi-user Campaign Workspace
-- Run after supabase/schema.sql and supabase/campaign-registry.sql.
--
-- Privacy/security goals:
-- 1. Workspace membership is authenticated and tenant-scoped with RLS.
-- 2. The workspace tables do not store member email addresses, names, lead contacts,
--    anonymous install IDs, or raw quiz answers.
-- 3. Invitations use one-time random tokens. Only a SHA-256 hash is stored.
-- 4. Browser-visible member lists use a short hash reference instead of auth.users UUIDs.
-- 5. Public campaign RPCs remain the only anonymous read path for published manifests.

create extension if not exists pgcrypto;

create table if not exists public.tasteprint_workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasteprint_workspace_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,47}$'),
  constraint tasteprint_workspace_name_length check (char_length(name) between 1 and 120)
);

create table if not exists public.tasteprint_workspace_members (
  workspace_id uuid not null references public.tasteprint_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','analyst','viewer')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.tasteprint_workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.tasteprint_workspaces(id) on delete cascade,
  token_hash text not null unique,
  role text not null check (role in ('admin','editor','analyst','viewer')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  constraint tasteprint_workspace_invite_hash check (token_hash ~ '^[0-9a-f]{64}$')
);

create table if not exists public.tasteprint_workspace_campaigns (
  workspace_id uuid not null references public.tasteprint_workspaces(id) on delete cascade,
  campaign_id text not null,
  manifest jsonb not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  updated_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, campaign_id),
  constraint tasteprint_workspace_campaign_id check (campaign_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  constraint tasteprint_workspace_campaign_manifest check (jsonb_typeof(manifest) = 'object')
);

create index if not exists tasteprint_workspace_members_user_idx
  on public.tasteprint_workspace_members(user_id, workspace_id);
create index if not exists tasteprint_workspace_campaigns_updated_idx
  on public.tasteprint_workspace_campaigns(workspace_id, updated_at desc);
create index if not exists tasteprint_workspace_invites_expiry_idx
  on public.tasteprint_workspace_invites(workspace_id, expires_at)
  where used_at is null;

-- Link the deliberately public/published registry row back to its owning tenant.
alter table public.tasteprint_campaigns
  add column if not exists workspace_id uuid references public.tasteprint_workspaces(id) on delete set null;
alter table public.tasteprint_campaigns
  add column if not exists updated_by uuid references auth.users(id) on delete set null;
create index if not exists tasteprint_campaigns_workspace_idx
  on public.tasteprint_campaigns(workspace_id, status, updated_at desc)
  where workspace_id is not null;

alter table public.tasteprint_workspaces enable row level security;
alter table public.tasteprint_workspace_members enable row level security;
alter table public.tasteprint_workspace_invites enable row level security;
alter table public.tasteprint_workspace_campaigns enable row level security;

-- Security-definer helper avoids recursive membership-policy lookups. It returns only
-- the current authenticated caller's role for one workspace.
create or replace function public.tasteprint_workspace_role(p_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.tasteprint_workspace_members m
  where m.workspace_id = p_workspace_id
    and m.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.tasteprint_workspace_role(uuid) from public;
grant execute on function public.tasteprint_workspace_role(uuid) to authenticated;

-- Workspace rows are visible only to members. Creation is handled by the RPC below.
drop policy if exists "workspace members can view workspace" on public.tasteprint_workspaces;
create policy "workspace members can view workspace"
on public.tasteprint_workspaces
for select
to authenticated
using (public.tasteprint_workspace_role(id) is not null);

-- Membership rows are not exposed directly to browser clients. The narrow member-list
-- RPC below returns only a short member reference, role, join time, and whether it is me.
-- No direct policies are intentionally created on tasteprint_workspace_members.

-- Invite rows are service/RPC only. Raw invitation tokens are never stored and there are
-- intentionally no browser table policies on this table.

-- Campaign drafts are tenant-scoped. Editors can create/update, analysts/viewers are read-only.
drop policy if exists "workspace members can view campaigns" on public.tasteprint_workspace_campaigns;
create policy "workspace members can view campaigns"
on public.tasteprint_workspace_campaigns
for select
to authenticated
using (public.tasteprint_workspace_role(workspace_id) is not null);

drop policy if exists "workspace editors can create campaigns" on public.tasteprint_workspace_campaigns;
create policy "workspace editors can create campaigns"
on public.tasteprint_workspace_campaigns
for insert
to authenticated
with check (
  public.tasteprint_workspace_role(workspace_id) in ('owner','admin','editor')
  and created_by = auth.uid()
  and updated_by = auth.uid()
);

drop policy if exists "workspace editors can update campaigns" on public.tasteprint_workspace_campaigns;
create policy "workspace editors can update campaigns"
on public.tasteprint_workspace_campaigns
for update
to authenticated
using (public.tasteprint_workspace_role(workspace_id) in ('owner','admin','editor'))
with check (
  public.tasteprint_workspace_role(workspace_id) in ('owner','admin','editor')
  and updated_by = auth.uid()
);

drop policy if exists "workspace admins can delete campaigns" on public.tasteprint_workspace_campaigns;
create policy "workspace admins can delete campaigns"
on public.tasteprint_workspace_campaigns
for delete
to authenticated
using (public.tasteprint_workspace_role(workspace_id) in ('owner','admin'));

-- Keep tenant identity and original creator immutable on update even if a client attempts
-- to tamper with those fields. updated_by is always the authenticated caller.
create or replace function public.tasteprint_lock_workspace_campaign_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.workspace_id := old.workspace_id;
  new.campaign_id := old.campaign_id;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasteprint_workspace_campaign_identity on public.tasteprint_workspace_campaigns;
create trigger tasteprint_workspace_campaign_identity
before update on public.tasteprint_workspace_campaigns
for each row execute function public.tasteprint_lock_workspace_campaign_identity();

create or replace function public.tasteprint_create_workspace(p_name text, p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_name text := left(trim(coalesce(p_name, '')), 120);
  v_slug text := lower(trim(coalesce(p_slug, '')));
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if char_length(v_name) < 1 then raise exception 'workspace name is required'; end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,47}$' then raise exception 'invalid workspace slug'; end if;

  insert into public.tasteprint_workspaces (slug, name, created_by)
  values (v_slug, v_name, v_user)
  returning id into v_id;

  insert into public.tasteprint_workspace_members (workspace_id, user_id, role)
  values (v_id, v_user, 'owner');

  return jsonb_build_object('id', v_id, 'slug', v_slug, 'name', v_name, 'role', 'owner');
end;
$$;

revoke all on function public.tasteprint_create_workspace(text, text) from public;
grant execute on function public.tasteprint_create_workspace(text, text) to authenticated;

create or replace function public.tasteprint_workspace_context()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', w.id,
    'slug', w.slug,
    'name', w.name,
    'role', m.role,
    'created_at', w.created_at
  ) order by w.created_at), '[]'::jsonb)
  from public.tasteprint_workspace_members m
  join public.tasteprint_workspaces w on w.id = m.workspace_id
  where m.user_id = auth.uid();
$$;

revoke all on function public.tasteprint_workspace_context() from public;
grant execute on function public.tasteprint_workspace_context() to authenticated;

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
        'member_ref', substring(encode(digest(m.user_id::text, 'sha256'), 'hex') from 1 for 12),
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

-- One-time invitation links need no email address. The raw token is returned only to the
-- authorized inviter; the database stores only its SHA-256 hash.
create or replace function public.tasteprint_create_workspace_invite(p_workspace_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text := public.tasteprint_workspace_role(p_workspace_id);
  v_role text := lower(trim(coalesce(p_role, 'viewer')));
  v_token text;
  v_hash text;
  v_expires timestamptz := now() + interval '7 days';
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if v_caller_role not in ('owner','admin') then raise exception 'invite permission denied'; end if;
  if v_role not in ('admin','editor','analyst','viewer') then raise exception 'invalid invite role'; end if;
  if v_caller_role = 'admin' and v_role = 'admin' then raise exception 'only owners can invite admins'; end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.tasteprint_workspace_invites (
    workspace_id, token_hash, role, invited_by, expires_at
  ) values (
    p_workspace_id, v_hash, v_role, auth.uid(), v_expires
  );

  return jsonb_build_object('token', v_token, 'role', v_role, 'expires_at', v_expires);
end;
$$;

revoke all on function public.tasteprint_create_workspace_invite(uuid, text) from public;
grant execute on function public.tasteprint_create_workspace_invite(uuid, text) to authenticated;

create or replace function public.tasteprint_accept_workspace_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_invite public.tasteprint_workspace_invites%rowtype;
  v_name text;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_token is null or p_token !~ '^[0-9a-fA-F]{48}$' then raise exception 'invalid invite token'; end if;
  v_hash := encode(digest(lower(p_token), 'sha256'), 'hex');

  select * into v_invite
  from public.tasteprint_workspace_invites
  where token_hash = v_hash
    and used_at is null
    and expires_at > now()
  for update;

  if v_invite.id is null then raise exception 'invite is invalid or expired'; end if;

  insert into public.tasteprint_workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, v_user, v_invite.role)
  on conflict (workspace_id, user_id) do nothing;

  update public.tasteprint_workspace_invites set used_at = now() where id = v_invite.id;
  select name into v_name from public.tasteprint_workspaces where id = v_invite.workspace_id;

  return jsonb_build_object(
    'workspace_id', v_invite.workspace_id,
    'workspace_name', v_name,
    'role', coalesce(public.tasteprint_workspace_role(v_invite.workspace_id), v_invite.role)
  );
end;
$$;

revoke all on function public.tasteprint_accept_workspace_invite(text) from public;
grant execute on function public.tasteprint_accept_workspace_invite(text) to authenticated;

-- Owners can change non-owner roles without ever receiving auth user UUIDs in the browser.
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
    and substring(encode(digest(user_id::text, 'sha256'), 'hex') from 1 for 12) = lower(trim(p_member_ref))
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
    and substring(encode(digest(user_id::text, 'sha256'), 'hex') from 1 for 12) = lower(trim(p_member_ref))
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

comment on table public.tasteprint_workspace_members is
'Authenticated tenant membership. No email/name columns; browser member lists use hashed member_ref values.';
comment on table public.tasteprint_workspace_invites is
'One-time workspace invitations. Stores SHA-256 token hashes only; no invitee email address.';
comment on table public.tasteprint_workspace_campaigns is
'Private workspace campaign drafts. RLS restricts rows to members of the owning workspace.';
