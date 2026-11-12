-- REVIEW ONLY. Additive private friends foundation after social-plans.sql.
-- Not part of PR #24's approved hosted staging scope. No public directory.
begin;
create table if not exists public.tasteprint_friend_connections (
 id uuid primary key default gen_random_uuid(),
 inviter_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid references auth.users(id) on delete cascade,
 state text not null default 'invited' check (state in ('invited','pending','accepted')),
 inviter_share jsonb not null, recipient_share jsonb,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz default now()+interval '7 days',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (inviter_id is distinct from recipient_id),
 check ((state='invited' and recipient_id is null and recipient_share is null) or (state in ('pending','accepted') and recipient_id is not null and recipient_share is not null)),
 check ((state='accepted' and expires_at is null) or (state<>'accepted' and expires_at is not null))
);
create index if not exists tasteprint_friend_inviter_idx on public.tasteprint_friend_connections(inviter_id);
create index if not exists tasteprint_friend_recipient_idx on public.tasteprint_friend_connections(recipient_id);
-- One live relationship per pair, in either direction; revoked/removed rows are erased.
create unique index if not exists tasteprint_friend_pair_idx on public.tasteprint_friend_connections(least(inviter_id,recipient_id),greatest(inviter_id,recipient_id)) where recipient_id is not null;
alter table public.tasteprint_friend_connections enable row level security;
revoke all on public.tasteprint_friend_connections from public,anon,authenticated;
-- All client access is through scoped RPCs; invite hashes never enter client reads.
create or replace function public.tasteprint_friend_share(p_alias text,p_interests text[])
returns jsonb language plpgsql immutable set search_path=public,extensions,pg_temp as $$
begin
 if p_alias is null or char_length(btrim(p_alias)) not between 1 and 40 or p_interests is null or cardinality(p_interests)>12 or exists (
  select 1 from unnest(p_interests) x where x is null or x not in ('animation','comedy','fantasy','drama','science-fiction','nature','art','coffee','cooking','walking','games','live-music')
 ) then raise exception 'Invalid friend share'; end if;
 return jsonb_build_object('alias',btrim(p_alias),'interests',to_jsonb(array(select distinct x from unnest(p_interests) x order by x)));
end; $$;
create or replace function public.tasteprint_friend_can_read(p_id uuid)
returns boolean language sql stable security definer set search_path=public,extensions,pg_temp as $$
 select auth.uid() is not null and exists (
  select 1 from public.tasteprint_friend_connections f where f.id=p_id and auth.uid() in (f.inviter_id,f.recipient_id)
  and (f.state='accepted' or f.expires_at>now()) and not exists (
   select 1 from public.tasteprint_social_blocks b where (b.blocker_id=f.inviter_id and b.blocked_id=f.recipient_id) or (b.blocker_id=f.recipient_id and b.blocked_id=f.inviter_id)
  )
 );
$$;
create or replace function public.tasteprint_create_friend_invite(p_alias text,p_interests text[] default '{}')
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); shared jsonb; token text; result public.tasteprint_friend_connections;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 shared:=public.tasteprint_friend_share(p_alias,p_interests);
 perform pg_advisory_xact_lock(hashtextextended(actor::text,103));
 if (select count(*) from public.tasteprint_friend_connections where actor in (inviter_id,recipient_id))>=200 or
    (select count(*) from public.tasteprint_friend_connections where inviter_id=actor and state<>'accepted' and expires_at>now())>=10 then raise exception 'Friend invitation limit reached'; end if;
 token:=encode(gen_random_bytes(32),'hex');
 insert into public.tasteprint_friend_connections(inviter_id,inviter_share,token_hash)
 values(actor,shared,encode(digest(token,'sha256'),'hex')) returning * into result;
 return jsonb_build_object('connection_id',result.id,'invite_token',token,'expires_at',result.expires_at);
end; $$;
create or replace function public.tasteprint_claim_friend_invite(p_token text,p_alias text,p_interests text[] default '{}')
returns uuid language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); shared jsonb; f public.tasteprint_friend_connections;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Invitation unavailable'; end if;
 shared:=public.tasteprint_friend_share(p_alias,p_interests);
 perform pg_advisory_xact_lock(hashtextextended(actor::text,103));
 select * into f from public.tasteprint_friend_connections where token_hash=encode(digest(p_token,'sha256'),'hex') for update;
 if not found or f.inviter_id=actor or f.recipient_id is not null or f.state<>'invited' or f.expires_at<=now() or exists (
  select 1 from public.tasteprint_social_blocks b where (b.blocker_id=actor and b.blocked_id=f.inviter_id) or (b.blocker_id=f.inviter_id and b.blocked_id=actor)
 ) then raise exception 'Invitation unavailable'; end if;
 if (select count(*) from public.tasteprint_friend_connections where actor in (inviter_id,recipient_id))>=200 then raise exception 'Friend connection limit reached'; end if;
 update public.tasteprint_friend_connections set recipient_id=actor,recipient_share=shared,state='pending',updated_at=now() where id=f.id;
 -- The inviter must explicitly confirm the claimant; opening/claiming is not friendship.
 return f.id;
end; $$;
create or replace function public.tasteprint_respond_friend_connection(p_id uuid,p_action text,p_alias text default null,p_interests text[] default null)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); f public.tasteprint_friend_connections; shared jsonb;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 select * into f from public.tasteprint_friend_connections where id=p_id for update;
 if not found or actor not in (f.inviter_id,coalesce(f.recipient_id,f.inviter_id)) then return false; end if;
 -- Removal/revocation works even when expired or blocked; retained copies cannot be recalled.
 if p_action in ('remove','decline') then delete from public.tasteprint_friend_connections where id=f.id; return true; end if;
 if not public.tasteprint_friend_can_read(f.id) then raise exception 'Connection unavailable'; end if;
 if p_action='approve' and actor=f.inviter_id and f.state='pending' then
  update public.tasteprint_friend_connections set state='accepted',expires_at=null,updated_at=now() where id=f.id;
 elsif p_action='share' and f.state='accepted' then
  shared:=public.tasteprint_friend_share(p_alias,p_interests);
  update public.tasteprint_friend_connections set inviter_share=case when actor=f.inviter_id then shared else inviter_share end,
   recipient_share=case when actor=f.recipient_id then shared else recipient_share end,updated_at=now() where id=f.id;
 else raise exception 'Invalid connection action'; end if;
 return true;
end; $$;
create or replace function public.tasteprint_my_friend_connections()
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'inviter_id',f.inviter_id,'recipient_id',f.recipient_id,'state',f.state,
  'inviter_share',f.inviter_share,'recipient_share',f.recipient_share,'expires_at',f.expires_at) order by f.updated_at desc)
  from public.tasteprint_friend_connections f where public.tasteprint_friend_can_read(f.id)),'[]'::jsonb);
end; $$;
create or replace function public.tasteprint_export_my_friend_connections()
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return jsonb_build_object('version',1,'connections',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'state',f.state,
  'own_share',case when auth.uid()=f.inviter_id then f.inviter_share else f.recipient_share end,
  'shared_connection',case when public.tasteprint_friend_can_read(f.id) then jsonb_build_object('inviter_id',f.inviter_id,'recipient_id',f.recipient_id,'inviter_share',f.inviter_share,'recipient_share',f.recipient_share) else null end
 ) order by f.id) from public.tasteprint_friend_connections f where auth.uid() in (f.inviter_id,f.recipient_id)),'[]'::jsonb));
end; $$;
revoke all on function public.tasteprint_friend_share(text,text[]),public.tasteprint_friend_can_read(uuid),public.tasteprint_create_friend_invite(text,text[]),public.tasteprint_claim_friend_invite(text,text,text[]),public.tasteprint_respond_friend_connection(uuid,text,text,text[]),public.tasteprint_my_friend_connections(),public.tasteprint_export_my_friend_connections() from public,anon;
grant execute on function public.tasteprint_create_friend_invite(text,text[]),public.tasteprint_claim_friend_invite(text,text,text[]),public.tasteprint_respond_friend_connection(uuid,text,text,text[]),public.tasteprint_my_friend_connections(),public.tasteprint_export_my_friend_connections() to authenticated;
commit;
