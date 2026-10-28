-- Positive and negative ACL/RLS checks with pgcrypto in managed extensions schema.
begin;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select pg_temp.assert_true((select count(*) from public.tasteprint_workspace_campaigns where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')>0,'editor can actually read own drafts');
select pg_temp.assert_true((select count(*) from public.tasteprint_workspace_campaigns where workspace_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')=0,'editor cannot read a different tenant');
insert into public.tasteprint_workspace_campaigns(workspace_id,campaign_id,manifest) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','editor-access-fixture','{}');
update public.tasteprint_workspace_campaigns set manifest='{"name":"Synthetic editor update"}',updated_by=auth.uid() where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and campaign_id='editor-access-fixture';
select pg_temp.assert_true((select manifest->>'name'='Synthetic editor update' from public.tasteprint_workspace_campaigns where campaign_id='editor-access-fixture'),'editor can actually write own draft');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
select pg_temp.assert_true((select count(*) from public.tasteprint_workspace_campaigns where campaign_id='editor-access-fixture')=1,'viewer can read allowed draft');
select pg_temp.must_fail($q$insert into public.tasteprint_workspace_campaigns(workspace_id,campaign_id,manifest) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','viewer-forgery','{}')$q$,'row-level security');
update public.tasteprint_workspace_campaigns set manifest='{"name":"forged"}',updated_by=auth.uid() where campaign_id='editor-access-fixture';
select pg_temp.assert_true((select manifest->>'name'='Synthetic editor update' from public.tasteprint_workspace_campaigns where campaign_id='editor-access-fixture'),'viewer update denied by RLS');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000006',false);
select pg_temp.assert_true((select count(*) from public.tasteprint_workspace_campaigns)=0,'nonmember reads no private draft');
select pg_temp.must_fail($q$insert into public.tasteprint_workspace_campaigns(workspace_id,campaign_id,manifest) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','nonmember-forgery','{}')$q$,'row-level security');
reset role;
rollback;
\echo 'Workspace campaign ACL/RLS PASS: real allowed editor read/write, viewer read-only, cross-tenant and nonmember denial with managed pgcrypto namespace.'
select pg_temp.assert_true(not has_function_privilege('authenticated','public.tasteprint_advance_workspace_campaign_version()','EXECUTE'),'no direct version-trigger helper calls');
-- A stale conditional update changes zero rows; even legacy writes advance the revision.
begin;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
insert into public.tasteprint_workspace_campaigns(workspace_id,campaign_id,manifest) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','revision-fixture','{"name":"Original"}');
update public.tasteprint_workspace_campaigns set manifest='{"name":"First editor"}',version=1,created_by='00000000-0000-0000-0000-000000000007' where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and campaign_id='revision-fixture' and version=1;
select pg_temp.assert_true((select version=2 and created_by=auth.uid() and updated_by=auth.uid() from public.tasteprint_workspace_campaigns where campaign_id='revision-fixture'),'server advances revision even if client omits or forges version; creator retained');
with attempted as (update public.tasteprint_workspace_campaigns set manifest='{"name":"Stale editor"}',version=2 where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and campaign_id='revision-fixture' and version=1 returning *) select pg_temp.assert_true((select count(*)=0 from attempted),'stale editor cannot replace newer work');
update public.tasteprint_workspace_campaigns set manifest='{"name":"Legacy write"}' where campaign_id='revision-fixture';
select pg_temp.assert_true((select version=3 and manifest->>'name'='Legacy write' from public.tasteprint_workspace_campaigns where campaign_id='revision-fixture'),'legacy update still invalidates prior revision');
update public.tasteprint_workspace_campaigns set manifest='{"name":"Current editor"}',version=999 where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and campaign_id='revision-fixture' and version=3;
select pg_temp.assert_true((select version=4 and manifest->>'name'='Current editor' from public.tasteprint_workspace_campaigns where campaign_id='revision-fixture'),'revision cannot be skipped by payload');
reset role;
rollback;
\echo 'Workspace draft revision PASS: server increments all updates, exact-revision writes reject stale copies, creator/actor identity retained.'
