-- REVIEW-ONLY social foundation. Rehearse on disposable PostgreSQL; do not apply to
-- a hosted project without separate staging approval. No live data or Auth activation.
begin;
create extension if not exists pgcrypto;
create table if not exists public.tasteprint_social_plans (
 id uuid primary key default gen_random_uuid(),
 creator_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid references auth.users(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 1 and 120),
 idea_url text,
 state text not null default 'proposed' check (state in ('proposed','interested','mutual_interest','scheduled','declined','cancelled','completed_self_reported','expired')),
 revision integer not null default 1 check (revision > 0),
 details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object' and octet_length(details::text)<=1024),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 expires_at timestamptz default now()+interval '7 days',
 check (creator_id is distinct from recipient_id)
);
create table if not exists public.tasteprint_social_plan_responses (
 plan_id uuid not null references public.tasteprint_social_plans(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 interest text not null default 'pending' check (interest in ('pending','interested','declined')),
 approved_revision integer check (approved_revision>0), completed_at timestamptz,
 primary key(plan_id,actor_id)
);
create table if not exists public.tasteprint_social_plan_invites (
 plan_id uuid primary key references public.tasteprint_social_plans(id) on delete cascade,
 token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz not null, revoked_at timestamptz, claimed_at timestamptz
);
create table if not exists public.tasteprint_social_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 primary key(blocker_id,blocked_id), check (blocker_id<>blocked_id)
);
create index if not exists tasteprint_social_plans_creator_idx on public.tasteprint_social_plans(creator_id,updated_at desc);
create index if not exists tasteprint_social_plans_recipient_idx on public.tasteprint_social_plans(recipient_id,updated_at desc);
create index if not exists tasteprint_social_blocks_reverse_idx on public.tasteprint_social_blocks(blocked_id,blocker_id);
alter table public.tasteprint_social_plans enable row level security;
alter table public.tasteprint_social_plan_responses enable row level security;
alter table public.tasteprint_social_plan_invites enable row level security;
alter table public.tasteprint_social_blocks enable row level security;
revoke all on public.tasteprint_social_plans,public.tasteprint_social_plan_responses,public.tasteprint_social_plan_invites,public.tasteprint_social_blocks from public,anon,authenticated;
grant select on public.tasteprint_social_plans,public.tasteprint_social_plan_responses to authenticated;
grant select,insert,delete on public.tasteprint_social_blocks to authenticated;

create or replace function public.tasteprint_social_can_read(p_plan_id uuid)
returns boolean language sql stable security definer set search_path=public,extensions,pg_temp as $$
 select auth.uid() is not null and exists (
  select 1 from public.tasteprint_social_plans p
  where p.id=p_plan_id and auth.uid() in (p.creator_id,p.recipient_id)
  and not exists (select 1 from public.tasteprint_social_blocks b where
   (b.blocker_id=p.creator_id and b.blocked_id=p.recipient_id) or
   (b.blocker_id=p.recipient_id and b.blocked_id=p.creator_id))
 );
$$;
revoke all on function public.tasteprint_social_can_read(uuid) from public,anon;
grant execute on function public.tasteprint_social_can_read(uuid) to authenticated;
drop policy if exists "social participant plan reads" on public.tasteprint_social_plans;
create policy "social participant plan reads" on public.tasteprint_social_plans for select to authenticated using (public.tasteprint_social_can_read(id));
drop policy if exists "social participant response reads" on public.tasteprint_social_plan_responses;
create policy "social participant response reads" on public.tasteprint_social_plan_responses for select to authenticated using (public.tasteprint_social_can_read(plan_id));
drop policy if exists "social own block reads" on public.tasteprint_social_blocks;
create policy "social own block reads" on public.tasteprint_social_blocks for select to authenticated using (blocker_id=(select auth.uid()));
drop policy if exists "social own block inserts" on public.tasteprint_social_blocks;
create policy "social own block inserts" on public.tasteprint_social_blocks for insert to authenticated with check (blocker_id=(select auth.uid()));
drop policy if exists "social own block deletes" on public.tasteprint_social_blocks;
create policy "social own block deletes" on public.tasteprint_social_blocks for delete to authenticated using (blocker_id=(select auth.uid()));

create or replace function public.tasteprint_create_private_plan(p_title text,p_idea_url text default null)
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); plan_id uuid; invite text; expiry timestamptz:=now()+interval '7 days';
begin
 if actor is null then raise exception 'Sign in required'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 120 then raise exception 'Invalid title'; end if;
 if p_idea_url is not null and (char_length(p_idea_url)>2000 or p_idea_url !~ '^https://[^/@[:space:]?#]+([/?#][^[:space:]]*)?$') then raise exception 'Use a safe HTTPS idea URL'; end if;
 -- Serialize the basic per-account outstanding-invitation cap. This is not a
 -- substitute for gateway rate limiting/abuse operations before live release.
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if (select count(*) from public.tasteprint_social_plans where creator_id=actor and state not in ('declined','cancelled','completed_self_reported','expired') and expires_at>now())>=10 then raise exception 'Too many outstanding invitations'; end if;
 insert into public.tasteprint_social_plans(creator_id,title,idea_url,expires_at) values(actor,btrim(p_title),p_idea_url,expiry) returning id into plan_id;
 insert into public.tasteprint_social_plan_responses(plan_id,actor_id) values(plan_id,actor);
 invite:=encode(gen_random_bytes(32),'hex');
 insert into public.tasteprint_social_plan_invites(plan_id,token_hash,expires_at) values(plan_id,encode(digest(invite,'sha256'),'hex'),expiry);
 return jsonb_build_object('plan_id',plan_id,'invite_token',invite,'expires_at',expiry);
end;
$$;
create or replace function public.tasteprint_accept_plan_invite(p_token text)
returns uuid language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); target uuid; p public.tasteprint_social_plans; invite public.tasteprint_social_plan_invites;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Invitation unavailable'; end if;
 select plan_id into target from public.tasteprint_social_plan_invites where token_hash=encode(digest(p_token,'sha256'),'hex');
 if not found then raise exception 'Invitation unavailable'; end if;
 -- All transitions lock the plan first, then its invitation, avoiding opposing
 -- lock order when cancellation races a claim. Recheck under both locks.
 select * into p from public.tasteprint_social_plans where id=target for update;
 if not found then raise exception 'Invitation unavailable'; end if;
 select * into invite from public.tasteprint_social_plan_invites where plan_id=target for update;
 if not found then raise exception 'Invitation unavailable'; end if;
 if p.creator_id=actor or p.recipient_id is not null or p.expires_at<=now() or p.state<>'proposed'
  or invite.revoked_at is not null or invite.claimed_at is not null or invite.expires_at<=now()
  or exists(select 1 from public.tasteprint_social_blocks b where (b.blocker_id=p.creator_id and b.blocked_id=actor) or (b.blocker_id=actor and b.blocked_id=p.creator_id))
 then raise exception 'Invitation unavailable'; end if;
 update public.tasteprint_social_plans set recipient_id=actor,expires_at=null,updated_at=now() where id=target;
 insert into public.tasteprint_social_plan_responses(plan_id,actor_id) values(target,actor);
 update public.tasteprint_social_plan_invites set claimed_at=now() where plan_id=target;
 return target;
end;
$$;
create or replace function public.tasteprint_respond_private_plan(p_plan_id uuid,p_action text,p_revision integer,p_details jsonb default null)
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); p public.tasteprint_social_plans; agreed integer; start_time timestamptz; end_time timestamptz;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 select * into p from public.tasteprint_social_plans where id=p_plan_id for update;
 if not found then raise exception 'Plan unavailable'; end if;
 if not public.tasteprint_social_can_read(p.id) or (p.expires_at is not null and p.expires_at<=now()) then raise exception 'Plan unavailable'; end if;
 if p_revision is distinct from p.revision then raise exception 'Plan changed; review the latest revision'; end if;
 if p_action is null or p_action not in ('interest','decline','cancel','details','approve','complete') then raise exception 'Invalid response'; end if;
 if p.state in ('cancelled','declined','expired') then raise exception 'Plan closed'; end if;
 if p_action='cancel' then
  if p.state='completed_self_reported' then raise exception 'Plan already self-reported'; end if;
  update public.tasteprint_social_plans set state='cancelled',updated_at=now() where id=p.id;
  update public.tasteprint_social_plan_invites set revoked_at=now() where plan_id=p.id;
 elsif p_action='decline' then
  if p.state not in ('proposed','interested','mutual_interest') then raise exception 'Cancel an already scheduled plan instead'; end if;
  update public.tasteprint_social_plan_responses set interest='declined' where plan_id=p.id and actor_id=actor;
  update public.tasteprint_social_plans set state='declined',updated_at=now() where id=p.id;
  update public.tasteprint_social_plan_invites set revoked_at=now() where plan_id=p.id;
 elsif p_action='interest' then
  if p.recipient_id is null or p.state not in ('proposed','interested','mutual_interest') then raise exception 'A recipient must join before interest'; end if;
  update public.tasteprint_social_plan_responses set interest='interested' where plan_id=p.id and actor_id=actor;
  select count(*) into agreed from public.tasteprint_social_plan_responses where plan_id=p.id and interest='interested';
  update public.tasteprint_social_plans set state=case when agreed=2 then 'mutual_interest' else 'interested' end,updated_at=now() where id=p.id;
 elsif p_action='details' then
  if p.state not in ('mutual_interest','scheduled') then raise exception 'Mutual interest required'; end if;
  if jsonb_typeof(p_details) is distinct from 'object' then raise exception 'Invalid plan details'; end if;
  if octet_length(p_details::text)>1024 or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('starts_at','ends_at','place'))
   or coalesce(char_length(btrim(p_details->>'place')),0) not between 1 and 160
   or coalesce(p_details->>'starts_at','') !~ 'T.*(Z|[+-][0-9]{2}:[0-9]{2})$'
   or (p_details?'ends_at' and coalesce(p_details->>'ends_at','') !~ 'T.*(Z|[+-][0-9]{2}:[0-9]{2})$') then raise exception 'Invalid plan details'; end if;
  begin
   start_time:=(p_details->>'starts_at')::timestamptz;
   end_time:=case when p_details?'ends_at' then (p_details->>'ends_at')::timestamptz else null end;
  exception when invalid_datetime_format or datetime_field_overflow then raise exception 'Invalid plan time'; end;
  if start_time<=now() or (end_time is not null and end_time<=start_time) then raise exception 'Invalid plan time'; end if;
  update public.tasteprint_social_plans set details=p_details,revision=revision+1,state='mutual_interest',updated_at=now() where id=p.id;
  update public.tasteprint_social_plan_responses set approved_revision=null where plan_id=p.id;
 elsif p_action='approve' then
  if p.state not in ('mutual_interest','scheduled') or p.details='{}'::jsonb then raise exception 'Mutual interest and details required'; end if;
  update public.tasteprint_social_plan_responses set approved_revision=p.revision where plan_id=p.id and actor_id=actor and interest='interested';
  if not found then raise exception 'Express your own interest first'; end if;
  select count(*) into agreed from public.tasteprint_social_plan_responses where plan_id=p.id and approved_revision=p.revision;
  if agreed=2 then update public.tasteprint_social_plans set state='scheduled',updated_at=now() where id=p.id; end if;
 elsif p_action='complete' then
  if p.state not in ('scheduled','completed_self_reported') then raise exception 'Agree on details first'; end if;
  update public.tasteprint_social_plan_responses set completed_at=coalesce(completed_at,now()) where plan_id=p.id and actor_id=actor;
  update public.tasteprint_social_plans set state='completed_self_reported',updated_at=now() where id=p.id;
 end if;
 select * into p from public.tasteprint_social_plans where id=p.id;
 return jsonb_build_object('plan_id',p.id,'state',p.state,'revision',p.revision);
end;
$$;
create or replace function public.tasteprint_delete_my_private_plan(p_plan_id uuid)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 delete from public.tasteprint_social_plans where id=p_plan_id and creator_id=auth.uid();
 return found;
end;
$$;
revoke all on function public.tasteprint_create_private_plan(text,text),public.tasteprint_accept_plan_invite(text),public.tasteprint_respond_private_plan(uuid,text,integer,jsonb),public.tasteprint_delete_my_private_plan(uuid) from public,anon;
grant execute on function public.tasteprint_create_private_plan(text,text),public.tasteprint_accept_plan_invite(text),public.tasteprint_respond_private_plan(uuid,text,integer,jsonb),public.tasteprint_delete_my_private_plan(uuid) to authenticated;
commit;
