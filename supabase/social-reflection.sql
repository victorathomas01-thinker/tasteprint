-- Review-only, additive after social-plans.sql. Private self-reports, never conversions.
begin;
create table if not exists public.tasteprint_plan_reflections (
 plan_id uuid not null references public.tasteprint_social_plans(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 revision integer not null check(revision>0),
 attendance text not null check(attendance in ('attended','did_not_attend','prefer_not_to_say')),
 enjoyment text check(enjoyment in ('enjoyed','mixed','did_not_enjoy')),
 again text check(again in ('yes','no','unsure')),
 updated_at timestamptz not null default now(),
 primary key(plan_id,actor_id,revision),
 check(attendance='attended' or enjoyment is null)
);
alter table public.tasteprint_plan_reflections enable row level security;
revoke all on public.tasteprint_plan_reflections from public,anon,authenticated;
create or replace function public.tasteprint_save_my_plan_reflection(p_plan_id uuid,p_revision integer,p_attendance text,p_enjoyment text default null,p_again text default null)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); p public.tasteprint_social_plans;
begin
 if actor is null then raise exception 'Sign in required';end if;
 select * into p from public.tasteprint_social_plans where id=p_plan_id and actor in (creator_id,recipient_id) for update;
 if not found or not public.tasteprint_social_can_read(p.id) or p.revision is distinct from p_revision then raise exception 'Plan unavailable or changed';end if;
 if p.state not in ('scheduled','completed_self_reported') or p.details->>'starts_at' is null or (p.details->>'starts_at')::timestamptz>now() then raise exception 'Feedback opens after the agreed start';end if;
 if p_attendance is null or p_attendance not in ('attended','did_not_attend','prefer_not_to_say') or (p_enjoyment is not null and p_enjoyment not in ('enjoyed','mixed','did_not_enjoy')) or (p_again is not null and p_again not in ('yes','no','unsure')) or (p_attendance<>'attended' and p_enjoyment is not null) then raise exception 'Invalid self-report';end if;
 insert into public.tasteprint_plan_reflections(plan_id,actor_id,revision,attendance,enjoyment,again) values(p.id,actor,p.revision,p_attendance,p_enjoyment,p_again)
 on conflict(plan_id,actor_id,revision) do update set attendance=excluded.attendance,enjoyment=excluded.enjoyment,again=excluded.again,updated_at=now();
 return true;
end;$$;
create or replace function public.tasteprint_read_my_plan_reflection(p_plan_id uuid,p_revision integer)
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 -- Own feedback remains accessible after blocking, without shared plan details.
 return coalesce((select to_jsonb(r)-'actor_id' from public.tasteprint_plan_reflections r where r.plan_id=p_plan_id and r.actor_id=auth.uid() and r.revision=p_revision),'null'::jsonb);
end;$$;
create or replace function public.tasteprint_export_my_plan_reflections()
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 -- Bound output and fail rather than silently truncate. No free text or other-person data.
 if (select count(*) from public.tasteprint_plan_reflections where actor_id=auth.uid())>10000 then raise exception 'Export requires paginated support';end if;
 return coalesce((select jsonb_agg(to_jsonb(r)-'actor_id' order by r.plan_id,r.revision) from public.tasteprint_plan_reflections r where r.actor_id=auth.uid()),'[]'::jsonb);
end;$$;
create or replace function public.tasteprint_delete_my_plan_reflections(p_plan_id uuid)
returns integer language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare removed integer;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 delete from public.tasteprint_plan_reflections where plan_id=p_plan_id and actor_id=auth.uid();get diagnostics removed=row_count;return removed;
end;$$;
revoke all on function public.tasteprint_save_my_plan_reflection(uuid,integer,text,text,text),public.tasteprint_read_my_plan_reflection(uuid,integer),public.tasteprint_export_my_plan_reflections(),public.tasteprint_delete_my_plan_reflections(uuid) from public,anon;
grant execute on function public.tasteprint_save_my_plan_reflection(uuid,integer,text,text,text),public.tasteprint_read_my_plan_reflection(uuid,integer),public.tasteprint_export_my_plan_reflections(),public.tasteprint_delete_my_plan_reflections(uuid) to authenticated;
commit;
