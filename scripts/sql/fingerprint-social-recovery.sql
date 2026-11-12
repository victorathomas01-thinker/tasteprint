-- Canonical complete rows, including timestamps, response versions and hashes.
-- The shell hashes this stream; it never prints the fixture contents.
select jsonb_build_object(
 'plans',(select coalesce(jsonb_agg(to_jsonb(p) order by id),'[]'::jsonb) from public.tasteprint_social_plans p),
 'responses',(select coalesce(jsonb_agg(to_jsonb(r) order by plan_id,actor_id),'[]'::jsonb) from public.tasteprint_social_plan_responses r),
 'invites',(select coalesce(jsonb_agg(to_jsonb(i) order by plan_id),'[]'::jsonb) from public.tasteprint_social_plan_invites i),
 'blocks',(select coalesce(jsonb_agg(to_jsonb(b) order by blocker_id,blocked_id),'[]'::jsonb) from public.tasteprint_social_blocks b)
)::text;
