-- REVIEW ONLY: after social-plans.sql and social-friends.sql. No hosted activation.
begin;
create table if not exists public.tasteprint_shortlist_options (
 id uuid primary key default gen_random_uuid(),
 connection_id uuid not null references public.tasteprint_friend_connections(id) on delete cascade,
 added_by uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 120), idea_url text check(char_length(idea_url)<=2048),
 catalog_id text check(catalog_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
 created_at timestamptz not null default now(),
 planned boolean not null default false,
 repeat_of uuid references public.tasteprint_shortlist_options(id) on delete set null deferrable initially deferred,
 plan_id uuid references public.tasteprint_social_plans(id) on delete set null,
 unique(id,connection_id)
);
create index if not exists tasteprint_shortlist_connection_idx on public.tasteprint_shortlist_options(connection_id,created_at);
create unique index if not exists tasteprint_shortlist_catalog_idx on public.tasteprint_shortlist_options(connection_id,catalog_id) where catalog_id is not null and not planned;
create table if not exists public.tasteprint_shortlist_responses (
 option_id uuid not null references public.tasteprint_shortlist_options(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 response text not null check(response in ('interested','dismissed')),primary key(option_id,actor_id)
);
create table if not exists public.tasteprint_shortlist_choices (
 connection_id uuid not null references public.tasteprint_friend_connections(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 option_id uuid not null,
 primary key(connection_id,actor_id),
 foreign key(option_id,connection_id) references public.tasteprint_shortlist_options(id,connection_id) on delete cascade
);
alter table public.tasteprint_shortlist_options enable row level security;
alter table public.tasteprint_shortlist_responses enable row level security;
alter table public.tasteprint_shortlist_choices enable row level security;
revoke all on public.tasteprint_shortlist_options,public.tasteprint_shortlist_responses,public.tasteprint_shortlist_choices from public,anon,authenticated;
create or replace function public.tasteprint_read_shared_shortlist(p_connection_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
declare f public.tasteprint_friend_connections;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id;
 if not found or f.state<>'accepted' or not public.tasteprint_friend_can_read(f.id) then raise exception 'Shortlist unavailable'; end if;
 return jsonb_build_object('version',1,'connection',jsonb_build_object('id',f.id,'inviter_id',f.inviter_id,'recipient_id',f.recipient_id,'state',f.state,'inviter_share',f.inviter_share,'recipient_share',f.recipient_share,'expires_at',f.expires_at),
  'options',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'added_by',o.added_by,'title',o.title,'idea_url',o.idea_url,'catalog_id',o.catalog_id,'planned',o.planned,'plan_id',o.plan_id,'repeat_of',o.repeat_of,
   'responses',coalesce((select jsonb_agg(jsonb_build_object('actor_id',r.actor_id,'response',r.response) order by r.actor_id) from public.tasteprint_shortlist_responses r where r.option_id=o.id),'[]'::jsonb)
  ) order by o.created_at,o.id) from public.tasteprint_shortlist_options o where o.connection_id=f.id),'[]'::jsonb),
  'choices',coalesce((select jsonb_agg(jsonb_build_object('actor_id',c.actor_id,'option_id',c.option_id) order by c.actor_id) from public.tasteprint_shortlist_choices c where c.connection_id=f.id),'[]'::jsonb));
end; $$;
create or replace function public.tasteprint_add_shortlist_option(p_connection_id uuid,p_title text,p_url text default null,p_catalog_id text default null)
returns uuid language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); f public.tasteprint_friend_connections; result uuid;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id for update;
 if not found or f.state<>'accepted' or not public.tasteprint_friend_can_read(f.id) then raise exception 'Shortlist unavailable'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 120 or (p_url is not null and (char_length(p_url)>2048 or p_url !~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$')) or (p_catalog_id is not null and p_catalog_id !~ '^[a-z0-9][a-z0-9-]{0,63}$') then raise exception 'Invalid suggestion'; end if;
 select id into result from public.tasteprint_shortlist_options where connection_id=f.id and
  ((p_catalog_id is not null and catalog_id=p_catalog_id) or (title=btrim(p_title) and idea_url is not distinct from p_url)) order by planned asc,created_at desc limit 1;
 if found then return result; end if;
 if (select count(*) from public.tasteprint_shortlist_options where connection_id=f.id)>=50 then raise exception 'Shortlist limit reached'; end if;
 insert into public.tasteprint_shortlist_options(connection_id,added_by,title,idea_url,catalog_id) values(f.id,actor,btrim(p_title),p_url,p_catalog_id) returning id into result;
 return result;
end; $$;
create or replace function public.tasteprint_repeat_shortlist_option(p_connection_id uuid,p_option_id uuid)
returns uuid language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); f public.tasteprint_friend_connections; o public.tasteprint_shortlist_options; result uuid;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id for update;
 if not found or f.state<>'accepted' or not public.tasteprint_friend_can_read(f.id) then raise exception 'Shortlist unavailable'; end if;
 select * into o from public.tasteprint_shortlist_options where id=p_option_id and connection_id=f.id;
 if not found or not o.planned then raise exception 'Use the existing active suggestion'; end if;
 select id into result from public.tasteprint_shortlist_options where connection_id=f.id and not planned and (repeat_of=o.id or (o.catalog_id is not null and catalog_id=o.catalog_id)) limit 1;
 if found then return result; end if;
 if (select count(*) from public.tasteprint_shortlist_options where connection_id=f.id)>=50 then raise exception 'Shortlist limit reached'; end if;
 insert into public.tasteprint_shortlist_options(connection_id,added_by,title,idea_url,catalog_id,repeat_of) values(f.id,actor,o.title,o.idea_url,o.catalog_id,o.id) returning id into result;
 -- No response/choice is copied. Prior plans and their erasure remain separate.
 return result;
end; $$;
create or replace function public.tasteprint_respond_shortlist(p_connection_id uuid,p_option_id uuid,p_action text)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); f public.tasteprint_friend_connections; o public.tasteprint_shortlist_options;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id for update;
 if not found or f.state<>'accepted' or not public.tasteprint_friend_can_read(f.id) then raise exception 'Shortlist unavailable'; end if;
 select * into o from public.tasteprint_shortlist_options where id=p_option_id and connection_id=f.id for update;
 if not found then raise exception 'Suggestion unavailable'; end if;
 if p_action='remove' and o.added_by=actor then delete from public.tasteprint_shortlist_options where id=o.id;return true; end if;
 if o.planned then raise exception 'Manage the existing plan separately'; end if;
 if p_action in ('interest','pass') then
  insert into public.tasteprint_shortlist_responses(option_id,actor_id,response) values(o.id,actor,case when p_action='interest' then 'interested' else 'dismissed' end)
  on conflict(option_id,actor_id) do update set response=excluded.response;
  if p_action='pass' then delete from public.tasteprint_shortlist_choices where connection_id=f.id and actor_id=actor and option_id=o.id; end if;
 elsif p_action='clear' then
  delete from public.tasteprint_shortlist_responses where option_id=o.id and actor_id=actor;
  delete from public.tasteprint_shortlist_choices where connection_id=f.id and actor_id=actor and option_id=o.id;
 elsif p_action='choose' then
  if not exists(select 1 from public.tasteprint_shortlist_responses where option_id=o.id and actor_id=actor and response='interested') then raise exception 'Express your own interest before choosing'; end if;
  insert into public.tasteprint_shortlist_choices(connection_id,actor_id,option_id) values(f.id,actor,o.id) on conflict(connection_id,actor_id) do update set option_id=excluded.option_id;
 elsif p_action='unchoose' then
  delete from public.tasteprint_shortlist_choices where connection_id=f.id and actor_id=actor and option_id=o.id;return found;
 else raise exception 'Invalid shortlist action'; end if;
 return true;
end; $$;
create or replace function public.tasteprint_plan_from_shortlist(p_connection_id uuid,p_option_id uuid)
returns uuid language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); f public.tasteprint_friend_connections; o public.tasteprint_shortlist_options; created jsonb; pid uuid; other_actor uuid;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id for update;
 if not found or f.state<>'accepted' or not public.tasteprint_friend_can_read(f.id) then raise exception 'Shortlist unavailable'; end if;
 select * into o from public.tasteprint_shortlist_options where id=p_option_id and connection_id=f.id for update;
 if not found then raise exception 'Suggestion unavailable'; end if;
 if o.planned then
  if o.plan_id is null then raise exception 'Prior plan erased; make a new suggestion and new choices'; end if;
  return o.plan_id;
 end if;
 if (select count(*) from public.tasteprint_shortlist_choices where connection_id=f.id and option_id=o.id and actor_id in(f.inviter_id,f.recipient_id))<>2 or
    (select count(*) from public.tasteprint_shortlist_responses where option_id=o.id and response='interested' and actor_id in(f.inviter_id,f.recipient_id))<>2 then raise exception 'Both participants must independently choose this suggestion'; end if;
 other_actor:=case when actor=f.inviter_id then f.recipient_id else f.inviter_id end;
 created:=public.tasteprint_create_private_plan(o.title,o.idea_url);pid:=(created->>'plan_id')::uuid;
 update public.tasteprint_social_plans set recipient_id=other_actor,expires_at=null,state='mutual_interest' where id=pid;
 update public.tasteprint_social_plan_responses set interest='interested' where plan_id=pid and actor_id=actor;
 insert into public.tasteprint_social_plan_responses(plan_id,actor_id,interest) values(pid,other_actor,'interested');
 -- No claimable capability is returned: membership comes from this confirmed pair's choices.
 update public.tasteprint_social_plan_invites set revoked_at=now() where plan_id=pid;
 update public.tasteprint_shortlist_options set planned=true,plan_id=pid where id=o.id;
 return pid;
end; $$;
create or replace function public.tasteprint_export_my_shortlist(p_connection_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); f public.tasteprint_friend_connections;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id;
 if not found or actor not in(f.inviter_id,coalesce(f.recipient_id,f.inviter_id)) then raise exception 'Shortlist unavailable'; end if;
 return jsonb_build_object('version',1,'connection_id',f.id,
  'own_suggestions',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'title',o.title,'idea_url',o.idea_url,'catalog_id',o.catalog_id,'planned',o.planned,'plan_id',o.plan_id,'repeat_of',o.repeat_of) order by o.id) from public.tasteprint_shortlist_options o where o.connection_id=f.id and o.added_by=actor),'[]'::jsonb),
  'own_responses',coalesce((select jsonb_agg(jsonb_build_object('option_id',r.option_id,'response',r.response) order by r.option_id) from public.tasteprint_shortlist_responses r join public.tasteprint_shortlist_options o on o.id=r.option_id where o.connection_id=f.id and r.actor_id=actor),'[]'::jsonb),
  'own_choice',(select option_id from public.tasteprint_shortlist_choices where connection_id=f.id and actor_id=actor),
  'shared_shortlist',case when f.state='accepted' and public.tasteprint_friend_can_read(f.id) then public.tasteprint_read_shared_shortlist(f.id) else null end);
end; $$;
revoke all on function public.tasteprint_repeat_shortlist_option(uuid,uuid),public.tasteprint_read_shared_shortlist(uuid),public.tasteprint_add_shortlist_option(uuid,text,text,text),public.tasteprint_respond_shortlist(uuid,uuid,text),public.tasteprint_plan_from_shortlist(uuid,uuid),public.tasteprint_export_my_shortlist(uuid) from public,anon;
grant execute on function public.tasteprint_repeat_shortlist_option(uuid,uuid),public.tasteprint_read_shared_shortlist(uuid),public.tasteprint_add_shortlist_option(uuid,text,text,text),public.tasteprint_respond_shortlist(uuid,uuid,text),public.tasteprint_plan_from_shortlist(uuid,uuid),public.tasteprint_export_my_shortlist(uuid) to authenticated;
commit;
