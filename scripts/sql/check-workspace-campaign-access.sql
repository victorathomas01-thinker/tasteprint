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
