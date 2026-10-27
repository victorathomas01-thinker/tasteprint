-- REVIEW ONLY. After social-shortlists.sql and catalog-contributors.sql.
-- New schema is outside the PR #24 hosted staging approval.
begin;
create table if not exists public.tasteprint_shortlist_decisions (
 connection_id uuid primary key references public.tasteprint_friend_connections(id) on delete cascade,
 revision integer not null check(revision>0)
);
create table if not exists public.tasteprint_shortlist_requirements (
 connection_id uuid not null references public.tasteprint_friend_connections(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 requirements jsonb not null, primary key(connection_id,actor_id)
);
alter table public.tasteprint_shortlist_decisions enable row level security;
alter table public.tasteprint_shortlist_requirements enable row level security;
revoke all on public.tasteprint_shortlist_decisions,public.tasteprint_shortlist_requirements from public,anon,authenticated;
create or replace function public.tasteprint_normalize_shortlist_requirements(p_value jsonb)
returns jsonb language plpgsql immutable set search_path=public,extensions,pg_temp as $$
declare k text;v jsonb;result jsonb:='{"maxCost":null,"maxMinutes":null,"currency":"USD","stepFree":false,"requireAvailable":false,"excludedTags":[]}'::jsonb;
begin
 if jsonb_typeof(p_value) is distinct from 'object' or octet_length(p_value::text)>2000 or exists(select 1 from jsonb_object_keys(p_value) x where x not in ('maxCost','maxMinutes','currency','stepFree','requireAvailable','excludedTags')) then raise exception 'Invalid shared requirements';end if;
 foreach k in array array['maxCost','maxMinutes'] loop
  v:=p_value->k;
  if v is not null and v<>'null'::jsonb then
   if jsonb_typeof(v)<>'number' then raise exception 'Invalid shared limit';end if;
   if (v::text)::numeric<0 or (v::text)::numeric>(case when k='maxCost' then 1000000 else 10080 end) then raise exception 'Invalid shared limit';end if;
   result:=jsonb_set(result,array[k],v);
  end if;
 end loop;
 if p_value?'currency' and p_value->'currency'<>'"USD"'::jsonb then raise exception 'Shared budgets use USD';end if;
 foreach k in array array['stepFree','requireAvailable'] loop
  if p_value?k then if jsonb_typeof(p_value->k)<>'boolean' then raise exception 'Invalid shared requirement';end if;result:=jsonb_set(result,array[k],p_value->k);end if;
 end loop;
 if p_value?'excludedTags' then
  if jsonb_typeof(p_value->'excludedTags')<>'array' then raise exception 'Invalid exclusions';end if;
  if jsonb_array_length(p_value->'excludedTags')>12 or exists(select 1 from jsonb_array_elements(p_value->'excludedTags') x where jsonb_typeof(x)<>'string' or x#>>'{}' not in ('animation','comedy','fantasy','drama','science-fiction','nature','art','coffee','cooking','walking','games','live-music')) or (select count(*)<>count(distinct x) from jsonb_array_elements(p_value->'excludedTags') x) then raise exception 'Use known exclusions';end if;
  result:=jsonb_set(result,'{excludedTags}',coalesce((select jsonb_agg(x order by x) from jsonb_array_elements(p_value->'excludedTags') x),'[]'::jsonb));
 end if;
 return result;
end;$$;
create or replace function public.tasteprint_save_shortlist_requirements(p_connection_id uuid,p_expected_revision integer,p_requirements jsonb)
returns integer language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare f public.tasteprint_friend_connections;r integer;v jsonb;previous jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id for update;
 if not found or f.state<>'accepted' or not public.tasteprint_friend_can_read(f.id) then raise exception 'Shortlist unavailable';end if;
 select coalesce((select revision from public.tasteprint_shortlist_decisions where connection_id=f.id),0) into r;
 if p_expected_revision is null or p_expected_revision<>r then raise exception 'Requirements changed; refresh before saving';end if;
 v:=public.tasteprint_normalize_shortlist_requirements(p_requirements);
 if v=public.tasteprint_normalize_shortlist_requirements('{}') then v:=null;end if;
 select requirements into previous from public.tasteprint_shortlist_requirements where connection_id=f.id and actor_id=auth.uid();
 if previous is not distinct from v then return r;end if;
 if v is null then delete from public.tasteprint_shortlist_requirements where connection_id=f.id and actor_id=auth.uid();
 else insert into public.tasteprint_shortlist_requirements values(f.id,auth.uid(),v) on conflict(connection_id,actor_id) do update set requirements=excluded.requirements;end if;
 insert into public.tasteprint_shortlist_decisions values(f.id,r+1) on conflict(connection_id) do update set revision=excluded.revision;
 delete from public.tasteprint_shortlist_choices where connection_id=f.id;
 return r+1;
end;$$;
-- Owner-only erasure remains possible after blocking. No other participant is returned.
create or replace function public.tasteprint_erase_my_shortlist_requirements(p_connection_id uuid)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare f public.tasteprint_friend_connections;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id for update;
 if not found or auth.uid() not in(f.inviter_id,coalesce(f.recipient_id,f.inviter_id)) then raise exception 'Shortlist unavailable';end if;
 delete from public.tasteprint_shortlist_requirements where connection_id=f.id and actor_id=auth.uid();
 if found then
  insert into public.tasteprint_shortlist_decisions values(f.id,1) on conflict(connection_id) do update set revision=tasteprint_shortlist_decisions.revision+1;
  delete from public.tasteprint_shortlist_choices where connection_id=f.id;
 end if;
 return true;
end;$$;
create or replace function public.tasteprint_read_checked_shortlist(p_connection_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
declare result jsonb;participants jsonb;
begin
 result:=public.tasteprint_read_shared_shortlist(p_connection_id);
 select jsonb_agg(jsonb_build_object('actor_id',a,'requirements',(select requirements from public.tasteprint_shortlist_requirements where connection_id=p_connection_id and actor_id=a)) order by a) into participants from unnest(array[(result->'connection'->>'inviter_id')::uuid,(result->'connection'->>'recipient_id')::uuid]) a;
 return result||jsonb_build_object('decision',jsonb_build_object('revision',coalesce((select revision from public.tasteprint_shortlist_decisions where connection_id=p_connection_id),0),'participants',participants));
end;$$;
-- Private helper: validates source identity and ALL participants' hard rules.
create or replace function public.tasteprint_assert_shortlist_eligible(p_option_id uuid)
returns void language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
declare o public.tasteprint_shortlist_options;item jsonb;r jsonb;k text;fact text;
begin
 select * into strict o from public.tasteprint_shortlist_options where id=p_option_id;
 if not exists(select 1 from public.tasteprint_shortlist_requirements where connection_id=o.connection_id) then return;end if;
 select e.item into item from public.tasteprint_catalog_entries e where e.id=o.catalog_id and e.state='published' and e.reviewer_id is not null and e.item->>'status'='active' and e.item->>'title'=o.title and coalesce(e.item->>'action_url',e.item->'source'->>'url')=o.idea_url and (e.item->'source'->>'verified_at')::timestamptz between now()-interval '30 days' and now();
 if item is null then raise exception 'Current reviewed source and facts not confirmed';end if;
 if item->'availability'->>'status'='unavailable' or (item->'availability'->>'until')::timestamptz<=now() then raise exception 'Item unavailable';end if;
 for r in select requirements from public.tasteprint_shortlist_requirements where connection_id=o.connection_id loop
  foreach k in array array['maxCost','maxMinutes'] loop
   fact:=case when k='maxCost' then 'cost' else 'duration_minutes' end;
   if r->k<>'null'::jsonb and (item->'constraints'->>fact is null or (k='maxCost' and item->'constraints'->>'currency' is distinct from r->>'currency') or (item->'constraints'->>fact)::numeric>(r->>k)::numeric) then raise exception 'Shared limit not confirmed';end if;
  end loop;
  if (r->>'stepFree')::boolean and item->'constraints'->>'step_free' is distinct from 'true' then raise exception 'Step-free access not confirmed';end if;
  if (r->>'requireAvailable')::boolean and item->'availability'->>'status' is distinct from 'available' then raise exception 'Availability not confirmed';end if;
  if exists(select 1 from jsonb_array_elements_text(r->'excludedTags') x where item->'tags'?x) then raise exception 'Excluded interest';end if;
 end loop;
end;$$;
create or replace function public.tasteprint_guard_shortlist_decision()
returns trigger language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare r integer;cid uuid;oid uuid;
begin
 -- A direct owner maintenance/restore session is already able to alter these tables.
 -- API sessions (including SET ROLE authenticated fixtures) must never take this path.
 if auth.uid() is null and session_user=current_user and current_setting('role')='none' then return new;end if;
 if tg_table_name='tasteprint_shortlist_options' then if old.planned or not new.planned then return new;end if;cid:=new.connection_id;oid:=new.id;
 else cid:=new.connection_id;oid:=new.option_id;if new.actor_id is distinct from auth.uid() then raise exception 'Own choice required';end if;end if;
 select revision into r from public.tasteprint_shortlist_decisions where connection_id=cid;
 if r is null then return new;end if;
 if auth.uid() is null or not public.tasteprint_friend_can_read(cid) or current_setting('tasteprint.checked_shortlist',true) is distinct from cid::text||':'||r::text then raise exception 'Refresh requirements before choosing or proposing';end if;
 perform public.tasteprint_assert_shortlist_eligible(oid);
 return new;
end;$$;
drop trigger if exists tasteprint_checked_choice on public.tasteprint_shortlist_choices;
create trigger tasteprint_checked_choice before insert or update on public.tasteprint_shortlist_choices for each row execute function public.tasteprint_guard_shortlist_decision();
drop trigger if exists tasteprint_checked_plan on public.tasteprint_shortlist_options;
create trigger tasteprint_checked_plan before update of planned on public.tasteprint_shortlist_options for each row execute function public.tasteprint_guard_shortlist_decision();
create or replace function public.tasteprint_checked_shortlist_context(p_connection_id uuid,p_expected_revision integer)
returns void language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare f public.tasteprint_friend_connections;r integer;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select * into f from public.tasteprint_friend_connections where id=p_connection_id for update;
 if not found or f.state<>'accepted' or not public.tasteprint_friend_can_read(f.id) then raise exception 'Shortlist unavailable';end if;
 select coalesce((select revision from public.tasteprint_shortlist_decisions where connection_id=f.id),0) into r;
 if p_expected_revision is null or r<>p_expected_revision then raise exception 'Requirements changed; refresh before choosing';end if;
 perform set_config('tasteprint.checked_shortlist',f.id::text||':'||r::text,true);
end;$$;
create or replace function public.tasteprint_respond_checked_shortlist(p_connection_id uuid,p_option_id uuid,p_action text,p_expected_revision integer)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare result boolean;previous text:=current_setting('tasteprint.checked_shortlist',true);
begin
 perform public.tasteprint_checked_shortlist_context(p_connection_id,p_expected_revision);
 result:=public.tasteprint_respond_shortlist(p_connection_id,p_option_id,p_action);
 perform set_config('tasteprint.checked_shortlist',coalesce(previous,''),true);return result;
end;$$;
create or replace function public.tasteprint_plan_checked_shortlist(p_connection_id uuid,p_option_id uuid,p_expected_revision integer)
returns uuid language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare result uuid;previous text:=current_setting('tasteprint.checked_shortlist',true);
begin
 perform public.tasteprint_checked_shortlist_context(p_connection_id,p_expected_revision);
 result:=public.tasteprint_plan_from_shortlist(p_connection_id,p_option_id);
 perform set_config('tasteprint.checked_shortlist',coalesce(previous,''),true);return result;
end;$$;
create or replace function public.tasteprint_export_checked_shortlist(p_connection_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
declare result jsonb;
begin
 result:=public.tasteprint_export_my_shortlist(p_connection_id);
 return result||jsonb_build_object('own_requirements',(select requirements from public.tasteprint_shortlist_requirements where connection_id=p_connection_id and actor_id=auth.uid()),'shared_shortlist',case when result->'shared_shortlist'<>'null'::jsonb then public.tasteprint_read_checked_shortlist(p_connection_id) else null end);
end;$$;
revoke all on function public.tasteprint_normalize_shortlist_requirements(jsonb),public.tasteprint_assert_shortlist_eligible(uuid),public.tasteprint_guard_shortlist_decision(),public.tasteprint_checked_shortlist_context(uuid,integer),public.tasteprint_save_shortlist_requirements(uuid,integer,jsonb),public.tasteprint_erase_my_shortlist_requirements(uuid),public.tasteprint_read_checked_shortlist(uuid),public.tasteprint_respond_checked_shortlist(uuid,uuid,text,integer),public.tasteprint_plan_checked_shortlist(uuid,uuid,integer),public.tasteprint_export_checked_shortlist(uuid) from public,anon,authenticated;
grant execute on function public.tasteprint_save_shortlist_requirements(uuid,integer,jsonb),public.tasteprint_erase_my_shortlist_requirements(uuid),public.tasteprint_read_checked_shortlist(uuid),public.tasteprint_respond_checked_shortlist(uuid,uuid,text,integer),public.tasteprint_plan_checked_shortlist(uuid,uuid,integer),public.tasteprint_export_checked_shortlist(uuid) to authenticated;
commit;
