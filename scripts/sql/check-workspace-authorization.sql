-- Extends the reporting runner's synthetic fixtures. Never run against production.
begin;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000006',false);
-- The baseline NULL NOT IN / NULL <> guards incorrectly allow nonmember actions.
select pg_temp.must_fail($q$select public.tasteprint_create_workspace_invite('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','admin')$q$,'invite permission denied');
select pg_temp.must_fail($q$select public.tasteprint_delete_workspace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$q$,'owner permission required');

-- The member reference is obtained as fixture setup, not exposed by a public API.
reset role;
select set_config('test.viewer_ref',substring(encode(digest('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:00000000-0000-0000-0000-000000000005','sha256'),'hex') from 1 for 12),false);
set role authenticated;
do $$
declare actor integer; target_ref text := current_setting('test.viewer_ref');
begin
  foreach actor in array array[2,3,4,5,6,7] loop
    perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-'||lpad(actor::text,12,'0'),false);
    perform pg_temp.must_fail(format('select public.tasteprint_set_workspace_member_role(%L,%L,%L)','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',target_ref,'admin'),'owner permission required');
    perform pg_temp.must_fail(format('select public.tasteprint_remove_workspace_member(%L,%L)','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',target_ref),'owner permission required');
    perform pg_temp.must_fail(format('select public.tasteprint_transfer_workspace_ownership(%L,%L)','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',target_ref),'owner permission required');
    perform pg_temp.must_fail($q$select public.tasteprint_delete_workspace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$q$,'owner permission required');
    if actor <> 2 then
      perform pg_temp.must_fail($q$select public.tasteprint_create_workspace_invite('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','editor')$q$,'invite permission denied');
    end if;
  end loop;
end;
$$;
-- Owners/admins retain their intended invitation permissions.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select pg_temp.assert_true(public.tasteprint_create_workspace_invite('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','editor')->>'token' is not null,'admin can invite editor');
select pg_temp.must_fail($q$select public.tasteprint_create_workspace_invite('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','admin')$q$,'only owners can invite admins');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select pg_temp.assert_true(public.tasteprint_create_workspace_invite('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','admin')->>'token' is not null,'owner can invite admin');
select pg_temp.assert_true(public.tasteprint_set_workspace_member_role('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',current_setting('test.viewer_ref'),'analyst'),'owner can change a nonowner role');
select pg_temp.assert_true(public.tasteprint_transfer_workspace_ownership('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',current_setting('test.viewer_ref')),'owner can intentionally transfer ownership');
select pg_temp.must_fail($q$select public.tasteprint_delete_workspace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$q$,'owner permission required');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
select pg_temp.assert_true(public.tasteprint_delete_workspace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),'new owner can intentionally delete own workspace');
reset role;
rollback;
\echo 'Workspace authorization PASS: fail-closed nonmembers, cross-tenant/role matrix, invitation scope and explicit owner lifecycle.'
