-- REVIEW ONLY: apply after social-plans.sql, never to hosted infrastructure
-- without staging approval. No scheduled cleanup or external activation.
begin;
create or replace function public.tasteprint_remove_my_plan_participation(p_plan_id uuid)
returns boolean language plpgsql security definer set search_path=public,extensions,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 -- Whole-record erasure is the initial two-person policy, matching existing Auth
 -- deletion cascades. Works when blocked/expired; membership is still required.
 delete from public.tasteprint_social_plans where id=p_plan_id and auth.uid() in (creator_id,recipient_id);
 return found;
end;
$$;
create or replace function public.tasteprint_export_my_plan_participation(p_after uuid default null,p_limit integer default 100)
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid(); result jsonb; next_id uuid;
begin
 if actor is null then raise exception 'Sign in required'; end if;
 if p_limit is null or p_limit not between 1 and 200 then raise exception 'Invalid export page size'; end if;
 with page as (
  select p.*,public.tasteprint_social_can_read(p.id) as accessible
  from public.tasteprint_social_plans p
  where actor in (p.creator_id,p.recipient_id) and (p_after is null or p.id>p_after)
  order by p.id limit p_limit
 )
 select coalesce(jsonb_agg(jsonb_build_object(
  'plan_id',p.id,'role',case when p.creator_id=actor then 'creator' else 'recipient' end,
  'accessible',p.accessible,
  'own_response',case when r.actor_id is null then null else jsonb_build_object('interest',r.interest,'approved_revision',r.approved_revision,'completed_at',r.completed_at) end,
  -- Blocking must not become an alternate path to the other person's identity,
  -- response or shared schedule. Only the caller's response/plan ID survives.
  'shared_plan',case when p.accessible then jsonb_build_object('id',p.id,'creator_id',p.creator_id,'recipient_id',p.recipient_id,'title',p.title,'idea_url',p.idea_url,'state',p.state,'revision',p.revision,'details',p.details,'expires_at',p.expires_at) else null end
 ) order by p.id),'[]'::jsonb) into result
 from page p left join public.tasteprint_social_plan_responses r on r.plan_id=p.id and r.actor_id=actor;
 if jsonb_array_length(result)>0 then
  next_id:=(result->-1->>'plan_id')::uuid;
  if not exists(select 1 from public.tasteprint_social_plans p where actor in (p.creator_id,p.recipient_id) and p.id>next_id) then next_id:=null; end if;
 end if;
 return jsonb_build_object('version',1,'records',result,'next_cursor',next_id);
end;
$$;
create or replace function public.tasteprint_cleanup_my_expired_plan_invites()
returns integer language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare removed integer;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 -- Explicit own-account operation, not a background retention job. Accepted
 -- plans have no invitation deadline and must never be swept by this function.
 delete from public.tasteprint_social_plans
 where creator_id=auth.uid() and recipient_id is null and expires_at<=now()-interval '7 days';
 get diagnostics removed=row_count;
 return removed;
end;
$$;
revoke all on function public.tasteprint_remove_my_plan_participation(uuid),public.tasteprint_export_my_plan_participation(uuid,integer),public.tasteprint_cleanup_my_expired_plan_invites() from public,anon;
grant execute on function public.tasteprint_remove_my_plan_participation(uuid),public.tasteprint_export_my_plan_participation(uuid,integer),public.tasteprint_cleanup_my_expired_plan_invites() to authenticated;
commit;
