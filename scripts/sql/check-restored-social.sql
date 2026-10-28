\set ON_ERROR_STOP on
create function pg_temp.assert_true(value boolean,message text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',message;end if;end$$;
select pg_temp.assert_true((select count(*)=3 from auth.users),'Auth references survive teardown/restore');
select pg_temp.assert_true((select value='Unrelated application data stays intact' from public.recovery_unrelated_sentinel where id=1),'unrelated application data survives');
select pg_temp.assert_true(not has_function_privilege('anon','public.tasteprint_export_my_plan_participation(uuid,integer)','EXECUTE'),'restored exports deny anonymous');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_social_plan_invites','SELECT'),'restored invite hashes remain unreadable');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_social_plan_responses','UPDATE'),'restored responses remain RPC-only');
select pg_temp.assert_true((select count(*)=4 from pg_class where relnamespace='public'::regnamespace and relname in ('tasteprint_social_plans','tasteprint_social_plan_responses','tasteprint_social_plan_invites','tasteprint_social_blocks') and relrowsecurity),'all restored social tables have RLS');
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false) as actor \gset
select pg_temp.assert_true((select count(*)=1 from public.tasteprint_social_plans),'recipient sees only restored membership');
select pg_temp.assert_true((select state='scheduled' and revision=2 from public.tasteprint_social_plans where id='a0000000-0000-0000-0000-000000000001'),'agreed details and revision survive');
select pg_temp.assert_true((select count(*)=2 from public.tasteprint_social_plan_responses where approved_revision=2),'both revision approvals survive');
select pg_temp.assert_true(public.tasteprint_export_my_plan_participation()->'records'->0->'own_response'->>'approved_revision'='2','privacy export works after restore');
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',false) as actor \gset
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_plans),'blocked actor cannot read restored content');
select pg_temp.assert_true(public.tasteprint_export_my_plan_participation()->'records'->0->'shared_plan'='null'::jsonb,'restored blocked export remains redacted');
-- The pending invitation hash still recognizes its synthetic capability.
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false) as actor \gset
select public.tasteprint_accept_plan_invite(repeat('c',64)) as claimed_id \gset
select pg_temp.assert_true(:'claimed_id'::uuid='a0000000-0000-0000-0000-000000000002','pending invite remains claimable after restore');
select pg_temp.assert_true(public.tasteprint_remove_my_plan_participation(:'claimed_id'),'recipient erasure still works after restore');
reset role;
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_social_plan_responses where plan_id=:'claimed_id') and not exists(select 1 from public.tasteprint_social_plan_invites where plan_id=:'claimed_id'),'restored cascades leave no orphans');
select 'Social recovery behavior PASS: private grants/RLS, blocked redaction, revision approvals, hashed invitation claim and erasure cascades.';
