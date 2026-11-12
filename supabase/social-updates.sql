-- REVIEW ONLY after social-plans.sql and social-friends.sql. Not approved hosted scope.
begin;
create table if not exists public.tasteprint_update_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false
);
create table if not exists public.tasteprint_private_updates (
 id uuid primary key default gen_random_uuid(),
 receiver_id uuid not null references auth.users(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 subject_type text not null check(subject_type in ('plan','friend')),
 subject_id uuid not null,
 kind text not null check(kind in ('plan_joined','plan_changed','friend_claimed','friend_confirmed','friend_changed')),
 sequence integer not null default 1 check(sequence>0),
 occurred_at timestamptz not null default now(), read_at timestamptz,
 unique(receiver_id,subject_type,subject_id),check(receiver_id<>actor_id)
);
create index if not exists tasteprint_private_updates_receiver_idx on public.tasteprint_private_updates(receiver_id,occurred_at desc);
alter table public.tasteprint_update_preferences enable row level security;
alter table public.tasteprint_private_updates enable row level security;
revoke all on public.tasteprint_update_preferences,public.tasteprint_private_updates from public,anon,authenticated;
-- No user-callable emitter; trusted source triggers check the actual JWT actor.
create or replace function public.tasteprint_emit_private_update(p_receiver uuid,p_actor uuid,p_type text,p_subject uuid,p_kind text)
returns void language plpgsql security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_actor or p_receiver is null or p_receiver=p_actor then return;end if;
 perform pg_advisory_xact_lock(hashtextextended(p_receiver::text,510));
 if not exists(select 1 from public.tasteprint_update_preferences where user_id=p_receiver and enabled) then return;end if;
 if exists(select 1 from public.tasteprint_social_blocks where (blocker_id=p_actor and blocked_id=p_receiver) or (blocker_id=p_receiver and blocked_id=p_actor)) then return;end if;
 delete from public.tasteprint_private_updates where receiver_id=p_receiver and occurred_at<=now()-interval '30 days';
 insert into public.tasteprint_private_updates(receiver_id,actor_id,subject_type,subject_id,kind)
 values(p_receiver,p_actor,p_type,p_subject,p_kind)
 on conflict(receiver_id,subject_type,subject_id) do update set actor_id=excluded.actor_id,kind=excluded.kind,sequence=tasteprint_private_updates.sequence+1,occurred_at=now(),read_at=null;
 -- A bounded current-thread inbox, not a complete event history.
 delete from public.tasteprint_private_updates where id in (select id from public.tasteprint_private_updates where receiver_id=p_receiver order by occurred_at desc,id offset 500);
end;$$;
revoke all on function public.tasteprint_emit_private_update(uuid,uuid,text,uuid,text) from public,anon,authenticated;

create or replace function public.tasteprint_plan_update_trigger()
returns trigger language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid();receiver uuid;target uuid; p public.tasteprint_social_plans;
begin
 if TG_OP='DELETE' then delete from public.tasteprint_private_updates where subject_type='plan' and subject_id=old.id;return old;end if;
 if new.recipient_id is null then return new;end if;
 if TG_OP='UPDATE' and new.recipient_id is not distinct from old.recipient_id and new.revision=old.revision and new.state=old.state then return new;end if;
 p:=new;
 if actor is null or actor not in (p.creator_id,p.recipient_id) then return new;end if;
 receiver:=case when actor=p.creator_id then p.recipient_id else p.creator_id end;
 perform public.tasteprint_emit_private_update(receiver,actor,'plan',p.id,case when TG_TABLE_NAME='tasteprint_social_plans' and TG_OP='UPDATE' and old.recipient_id is null and actor=new.recipient_id then 'plan_joined' else 'plan_changed' end);
 return new;
end;$$;
-- Separate response adapter: OLD is a response row, never read as a plan row.
create or replace function public.tasteprint_response_update_trigger()
returns trigger language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare p public.tasteprint_social_plans; actor uuid:=auth.uid();receiver uuid;
begin
 if actor is null or new.actor_id is distinct from actor then return new;end if;
 if TG_OP='UPDATE' and new.interest is not distinct from old.interest and new.approved_revision is not distinct from old.approved_revision and new.completed_at is not distinct from old.completed_at then return new;end if;
 select * into p from public.tasteprint_social_plans where id=new.plan_id;
 if actor not in (p.creator_id,p.recipient_id) then return new;end if;
 receiver:=case when actor=p.creator_id then p.recipient_id else p.creator_id end;
 perform public.tasteprint_emit_private_update(receiver,actor,'plan',p.id,'plan_changed');return new;
end;$$;
create or replace function public.tasteprint_friend_update_trigger()
returns trigger language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid();receiver uuid;
begin
 if TG_OP='DELETE' then delete from public.tasteprint_private_updates where subject_type='friend' and subject_id=old.id;return old;end if;
 if actor is null or new.recipient_id is null or actor not in (new.inviter_id,new.recipient_id) then return new;end if;
 if new.state is not distinct from old.state and new.inviter_share is not distinct from old.inviter_share and new.recipient_share is not distinct from old.recipient_share then return new;end if;
 receiver:=case when actor=new.inviter_id then new.recipient_id else new.inviter_id end;
 perform public.tasteprint_emit_private_update(receiver,actor,'friend',new.id,case when old.state='invited' and new.state='pending' then 'friend_claimed' when old.state='pending' and new.state='accepted' then 'friend_confirmed' else 'friend_changed' end);return new;
end;$$;
revoke all on function public.tasteprint_plan_update_trigger(),public.tasteprint_response_update_trigger(),public.tasteprint_friend_update_trigger() from public,anon,authenticated;
drop trigger if exists tasteprint_plan_updates on public.tasteprint_social_plans;
create trigger tasteprint_plan_updates after insert or update or delete on public.tasteprint_social_plans for each row execute function public.tasteprint_plan_update_trigger();
drop trigger if exists tasteprint_response_updates on public.tasteprint_social_plan_responses;
create trigger tasteprint_response_updates after insert or update on public.tasteprint_social_plan_responses for each row execute function public.tasteprint_response_update_trigger();
drop trigger if exists tasteprint_friend_updates on public.tasteprint_friend_connections;
create trigger tasteprint_friend_updates after update or delete on public.tasteprint_friend_connections for each row execute function public.tasteprint_friend_update_trigger();

create or replace function public.tasteprint_set_my_updates(p_enabled boolean)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null or p_enabled is null then raise exception 'Sign in required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,510));
 insert into public.tasteprint_update_preferences values(auth.uid(),p_enabled) on conflict(user_id) do update set enabled=excluded.enabled;
 -- Disabled receipts are erased, not recalled from previous downloads/devices.
 if not p_enabled then delete from public.tasteprint_private_updates where receiver_id=auth.uid();end if;
 return p_enabled;
end;$$;
create or replace function public.tasteprint_my_updates()
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare enabled boolean;items jsonb;upcoming jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 delete from public.tasteprint_private_updates where receiver_id=auth.uid() and occurred_at<=now()-interval '30 days';
 select coalesce((select p.enabled from public.tasteprint_update_preferences p where user_id=auth.uid()),false) into enabled;
 if not enabled then return jsonb_build_object('enabled',false,'items','[]'::jsonb,'upcoming','[]'::jsonb);end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'subject_type',u.subject_type,'subject_id',u.subject_id,'kind',u.kind,'sequence',u.sequence,'occurred_at',u.occurred_at,'read',u.read_at is not null,'title',case when u.subject_type='plan' then p.title else 'Friend connection' end) order by u.occurred_at desc,u.id),'[]'::jsonb) into items
 from public.tasteprint_private_updates u left join public.tasteprint_social_plans p on u.subject_type='plan' and p.id=u.subject_id
 where u.receiver_id=auth.uid() and u.occurred_at>now()-interval '30 days' and ((u.subject_type='plan' and public.tasteprint_social_can_read(u.subject_id)) or (u.subject_type='friend' and public.tasteprint_friend_can_read(u.subject_id)));
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'starts_at',p.details->>'starts_at') order by (p.details->>'starts_at')::timestamptz),'[]'::jsonb) into upcoming from public.tasteprint_social_plans p
 where auth.uid() in (p.creator_id,p.recipient_id) and public.tasteprint_social_can_read(p.id) and p.state='scheduled' and (p.details->>'starts_at')::timestamptz between now() and now()+interval '7 days';
 return jsonb_build_object('enabled',true,'items',items,'upcoming',upcoming);
end;$$;
create or replace function public.tasteprint_read_my_update(p_id uuid,p_sequence integer)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 update public.tasteprint_private_updates set read_at=now() where id=p_id and receiver_id=auth.uid() and sequence=p_sequence and occurred_at>now()-interval '30 days' and ((subject_type='plan' and public.tasteprint_social_can_read(subject_id)) or (subject_type='friend' and public.tasteprint_friend_can_read(subject_id)));
 return found;
end;$$;
revoke all on function public.tasteprint_set_my_updates(boolean),public.tasteprint_my_updates(),public.tasteprint_read_my_update(uuid,integer) from public,anon;
grant execute on function public.tasteprint_set_my_updates(boolean),public.tasteprint_my_updates(),public.tasteprint_read_my_update(uuid,integer) to authenticated;
commit;
