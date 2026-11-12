-- REVIEW ONLY after passport-sync.sql. Outside the PR #24 hosted approval.
begin;
create table if not exists public.tasteprint_private_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision integer not null default 1 check(revision>0),
 preferences jsonb,
 updated_at timestamptz not null default now()
);
alter table public.tasteprint_private_preferences enable row level security;
revoke all on public.tasteprint_private_preferences from public,anon,authenticated;
create or replace function public.tasteprint_validate_private_preferences(p_value jsonb)
returns boolean language plpgsql immutable set search_path=public,extensions,pg_temp as $$
declare key text;value jsonb;
begin
 if jsonb_typeof(p_value) is distinct from 'object' or octet_length(p_value::text)>16000 or p_value->'version' is distinct from '1'::jsonb or exists(select 1 from jsonb_object_keys(p_value) k where k not in ('version','liked','disliked','shared','saved','dismissed')) then raise exception 'Invalid private preferences';end if;
 foreach key in array array['liked','disliked','shared','saved','dismissed'] loop
  value:=p_value->key;
  if jsonb_typeof(value) is distinct from 'array' then raise exception 'Invalid preference array';end if;
  if jsonb_array_length(value)>60 or exists(select 1 from jsonb_array_elements(value) x where jsonb_typeof(x)<>'string') or (select count(*) from jsonb_array_elements_text(value))<>(select count(distinct x) from jsonb_array_elements_text(value) x) then raise exception 'Invalid preference array';end if;
  if key in ('saved','dismissed') then
   if exists(select 1 from jsonb_array_elements_text(value) x where x!~'^[a-z0-9][a-z0-9-]{0,63}$') then raise exception 'Invalid item ID';end if;
  elsif exists(select 1 from jsonb_array_elements_text(value) x where x not in ('animation','comedy','fantasy','drama','science-fiction','nature','art','coffee','cooking','walking','games','live-music')) then raise exception 'Unknown preference';end if;
 end loop;
 if exists(select 1 from jsonb_array_elements_text(p_value->'shared') x where not(p_value->'liked' ? x)) or exists(select 1 from jsonb_array_elements_text(p_value->'liked') x where p_value->'disliked' ? x) then raise exception 'Conflicting preference choices';end if;
 return true;
end;$$;
create or replace function public.tasteprint_read_my_private_preferences()
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 return coalesce((select jsonb_build_object('revision',revision,'preferences',preferences,'updated_at',updated_at) from public.tasteprint_private_preferences where user_id=auth.uid()),jsonb_build_object('revision',0,'preferences',null,'updated_at',null));
end;$$;
create or replace function public.tasteprint_write_my_private_preferences(p_expected_revision integer,p_preferences jsonb)
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid();current_revision integer;
begin
 if actor is null or p_expected_revision is null or p_expected_revision<0 then raise exception 'Sign in and review current account copy';end if;
 if p_preferences is not null then perform public.tasteprint_validate_private_preferences(p_preferences);end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,810));
 select coalesce((select revision from public.tasteprint_private_preferences where user_id=actor),0) into current_revision;
 if current_revision<>p_expected_revision then raise exception 'Account copy changed; refresh before retrying';end if;
 insert into public.tasteprint_private_preferences(user_id,revision,preferences) values(actor,current_revision+1,p_preferences)
 on conflict(user_id) do update set revision=excluded.revision,preferences=excluded.preferences,updated_at=now();
 -- A null payload erases content but keeps the monotonic revision to reject late saves.
 return public.tasteprint_read_my_private_preferences();
end;$$;
create or replace function public.tasteprint_clear_my_passport_content()
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'Sign in required';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,810));
 delete from public.tasteprint_passport_snapshots where user_id=actor;
 insert into public.tasteprint_private_preferences(user_id,revision,preferences) values(actor,1,null)
 on conflict(user_id) do update set revision=tasteprint_private_preferences.revision+1,preferences=null,updated_at=now();
 return true;
end;$$;
revoke all on function public.tasteprint_validate_private_preferences(jsonb),public.tasteprint_read_my_private_preferences(),public.tasteprint_write_my_private_preferences(integer,jsonb),public.tasteprint_clear_my_passport_content() from public,anon,authenticated;
grant execute on function public.tasteprint_read_my_private_preferences(),public.tasteprint_write_my_private_preferences(integer,jsonb),public.tasteprint_clear_my_passport_content() to authenticated;
commit;
