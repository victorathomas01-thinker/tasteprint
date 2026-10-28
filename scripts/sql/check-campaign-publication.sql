-- Synthetic-only server publication transaction checks; helper assertions are
-- installed by check-workspace-reporting.sql in this same disposable connection.
-- Reproduce the old service upsert takeover in a rolled-back transaction with
-- only the new guard temporarily absent. No production schema is changed.
begin;
drop trigger tasteprint_public_campaign_owner on public.tasteprint_campaigns;
insert into public.tasteprint_campaigns(campaign_id,manifest,status,workspace_id)
 values('legacy-upsert-proof','{}','published','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
insert into public.tasteprint_campaigns(campaign_id,manifest,status,workspace_id)
 values('legacy-upsert-proof','{}','published','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
 on conflict(campaign_id) do update set workspace_id=excluded.workspace_id,manifest=excluded.manifest;
select pg_temp.assert_true((select workspace_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' from public.tasteprint_campaigns where campaign_id='legacy-upsert-proof'),'old unconditional service upsert can take over an ID after stale ownership preflight');
rollback;
select pg_temp.assert_true(not has_function_privilege('anon','public.tasteprint_commit_campaign_publication(text,uuid,uuid,text,jsonb)','execute'),'anonymous publication denied');
select pg_temp.assert_true(not has_function_privilege('authenticated','public.tasteprint_commit_campaign_publication(text,uuid,uuid,text,jsonb)','execute'),'clients cannot impersonate the server actor');
select pg_temp.assert_true(has_function_privilege('service_role','public.tasteprint_commit_campaign_publication(text,uuid,uuid,text,jsonb)','execute'),'verified server publication allowed');
select set_config('request.jwt.claim.sub','',false);
insert into public.tasteprint_workspace_campaigns(workspace_id,campaign_id,manifest,created_by,updated_by)
values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','atomic-publish','{"id":"atomic-publish","name":"Reviewed","localDraft":true}',
'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');
set role authenticated;
select pg_temp.must_fail($q$select public.tasteprint_commit_campaign_publication('publish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000001','atomic-publish','{"id":"atomic-publish","name":"Reviewed"}')$q$,'permission denied');
reset role;
set role service_role;
select pg_temp.must_fail($q$select public.tasteprint_commit_campaign_publication('publish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000003','atomic-publish','{"id":"atomic-publish","name":"Reviewed"}')$q$,'owner or admin');
select pg_temp.must_fail($q$select public.tasteprint_commit_campaign_publication('publish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000006','atomic-publish','{"id":"atomic-publish","name":"Reviewed"}')$q$,'owner or admin');
select pg_temp.must_fail($q$select public.tasteprint_commit_campaign_publication('publish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000001','atomic-publish','{"id":"atomic-publish","name":"Unsaved"}')$q$,'team draft changed');
select public.tasteprint_commit_campaign_publication('publish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000001','atomic-publish','{"id":"atomic-publish","name":"Reviewed"}');
reset role;
select pg_temp.assert_true(current_setting('request.jwt.claim.sub',true)='','server actor context restored');
select pg_temp.assert_true((select status='published' and version=1 and updated_by='00000000-0000-0000-0000-000000000001' from public.tasteprint_campaigns where campaign_id='atomic-publish'),'public result and audit actor');
select pg_temp.assert_true((select status='published' and version=2 and updated_by='00000000-0000-0000-0000-000000000001' and created_by=updated_by from public.tasteprint_workspace_campaigns where campaign_id='atomic-publish'),'team result, revision and immutable creator');
-- An unrelated service writer cannot reassign a claimed registry ID either.
select pg_temp.must_fail($q$update public.tasteprint_campaigns set workspace_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where campaign_id='atomic-publish'$q$,'campaign owner is immutable');
-- Force the second write to fail AFTER the public update; the entire function
-- call must roll back, not leave a newly public or partially archived campaign.
create function pg_temp.fail_publication_write() returns trigger language plpgsql as $$begin raise exception 'synthetic second write failed';end;$$;
create trigger synthetic_fail_publication before update on public.tasteprint_workspace_campaigns
for each row when (old.campaign_id='atomic-publish') execute function pg_temp.fail_publication_write();
set role service_role;
select pg_temp.must_fail($q$select public.tasteprint_commit_campaign_publication('publish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000002','atomic-publish','{"id":"atomic-publish","name":"Reviewed"}')$q$,'synthetic second write failed');
select pg_temp.must_fail($q$select public.tasteprint_commit_campaign_publication('unpublish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000001','atomic-publish')$q$,'synthetic second write failed');
reset role;
select pg_temp.assert_true((select status='published' and version=1 from public.tasteprint_campaigns where campaign_id='atomic-publish'),'failed publish/archive leaves registry unchanged');
select pg_temp.assert_true(current_setting('request.jwt.claim.sub',true)='','failed operation restores actor context');
drop trigger synthetic_fail_publication on public.tasteprint_workspace_campaigns;
set role service_role;
select public.tasteprint_commit_campaign_publication('publish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000002','atomic-publish','{"id":"atomic-publish","name":"Reviewed"}');
select pg_temp.must_fail($q$select public.tasteprint_commit_campaign_publication('unpublish','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000007','atomic-publish')$q$,'campaign belongs to another workspace');
select public.tasteprint_commit_campaign_publication('unpublish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000001','atomic-publish');
reset role;
select pg_temp.assert_true((select status='archived' and version=2 from public.tasteprint_campaigns where campaign_id='atomic-publish'),'successful archive retains public revision');
select pg_temp.assert_true((select status='archived' and version=4 and created_by='00000000-0000-0000-0000-000000000001' from public.tasteprint_workspace_campaigns where campaign_id='atomic-publish'),'successful publish and archive advance draft once each');
-- Cross-tenant first-claim race fixtures (run concurrently by the shell runner).
insert into public.tasteprint_workspace_campaigns(workspace_id,campaign_id,manifest,created_by,updated_by)
values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','publication-race','{"id":"publication-race","name":"Team A"}','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','publication-race','{"id":"publication-race","name":"Team B"}','00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000007');
\echo 'Atomic publication SQL PASS: server-only ACL, locked role/tenant checks, saved-content requirement, immutable registry ownership, public/draft consistency, audit actor and failed second-write rollback.'
