\set ON_ERROR_STOP on
set timezone='UTC';
create function pg_temp.assert_true(value boolean,message text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',message;end if;end$$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when insufficient_privilege or raise_exception or check_violation then return;end;
 raise exception 'FAIL: forbidden operation succeeded';
end$$;
-- Isolated synthetic lifecycle matrix, separate from existing transition tests.
begin;
delete from public.tasteprint_social_plans;
delete from public.tasteprint_social_blocks;
select pg_temp.assert_true(not has_function_privilege('anon','public.tasteprint_export_my_plan_participation(uuid,integer)','EXECUTE'),'anonymous export denied');
select pg_temp.assert_true(not has_function_privilege('anon','public.tasteprint_remove_my_plan_participation(uuid)','EXECUTE'),'anonymous removal denied');
select pg_temp.assert_true(not has_function_privilege('anon','public.tasteprint_cleanup_my_expired_plan_invites()','EXECUTE'),'anonymous cleanup denied');
set role authenticated;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.denied($q$select public.tasteprint_export_my_plan_participation()$q$);
select pg_temp.denied($q$select public.tasteprint_remove_my_plan_participation(null)$q$);
select pg_temp.denied($q$select public.tasteprint_cleanup_my_expired_plan_invites()$q$);
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
select public.tasteprint_create_private_plan('Privacy synthetic shared plan') as privacy_created \gset
select (:'privacy_created'::jsonb->>'plan_id') as privacy_id,(:'privacy_created'::jsonb->>'invite_token') as privacy_token \gset
select public.tasteprint_create_private_plan('Privacy synthetic pending plan') as privacy_pending \gset
select (:'privacy_pending'::jsonb->>'plan_id') as pending_id \gset
select pg_temp.denied($q$select public.tasteprint_export_my_plan_participation(null,0)$q$);
select pg_temp.denied($q$select public.tasteprint_export_my_plan_participation(null,null)$q$);
select pg_temp.denied($q$select public.tasteprint_export_my_plan_participation(null,201)$q$);
select public.tasteprint_export_my_plan_participation(null,1) as first_page \gset
select pg_temp.assert_true(jsonb_array_length(:'first_page'::jsonb->'records')=1 and (:'first_page'::jsonb->>'next_cursor') is not null,'bounded export announces more records');
select public.tasteprint_export_my_plan_participation((:'first_page'::jsonb->>'next_cursor')::uuid,1) as second_page \gset
select pg_temp.assert_true(jsonb_array_length(:'second_page'::jsonb->'records')=1 and (:'second_page'::jsonb->>'next_cursor') is null,'cursor covers remaining own record without truncation');
select pg_temp.assert_true((:'first_page'::jsonb->'records'->0->>'plan_id')<>(:'second_page'::jsonb->'records'->0->>'plan_id'),'export pages do not duplicate');
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',true);
select pg_temp.assert_true(public.tasteprint_export_my_plan_participation()->'records'='[]'::jsonb,'nonparticipant export cannot enumerate others');
select pg_temp.assert_true(not public.tasteprint_remove_my_plan_participation(:'privacy_id'),'nonparticipant cannot erase plan');
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
select public.tasteprint_accept_plan_invite(:'privacy_token');
select public.tasteprint_respond_private_plan(:'privacy_id','interest',1);
select public.tasteprint_export_my_plan_participation() as recipient_export \gset
select pg_temp.assert_true(jsonb_array_length(:'recipient_export'::jsonb->'records')=1,'recipient exports only own participation');
select pg_temp.assert_true(:'recipient_export'::jsonb->'records'->0->>'role'='recipient','recipient role is explicit');
select pg_temp.assert_true(:'recipient_export'::jsonb->'records'->0->'own_response'->>'interest'='interested','export contains only actor response');
select pg_temp.assert_true(:'recipient_export'::jsonb->'records'->0->'shared_plan'->>'title'='Privacy synthetic shared plan','readable shared content is exported');
select pg_temp.assert_true(:'recipient_export' not like '%'||:'privacy_token'||'%' and :'recipient_export' not like '%token_hash%' and :'recipient_export' not like '%actor_id%','exports omit tokens and other response actor records');
insert into public.tasteprint_social_blocks values(auth.uid(),'11111111-1111-1111-1111-111111111111');
select public.tasteprint_export_my_plan_participation() as blocked_export \gset
select pg_temp.assert_true(:'blocked_export'::jsonb->'records'->0->'shared_plan'='null'::jsonb,'blocked export withholds shared content');
select pg_temp.assert_true(:'blocked_export'::jsonb->'records'->0->>'accessible'='false','blocked export marks unreadable');
select pg_temp.assert_true(:'blocked_export' not like '%11111111-1111-1111-1111-111111111111%' and :'blocked_export' not like '%Privacy synthetic shared plan%','blocked export does not reveal other actor or title');
select pg_temp.assert_true(:'blocked_export'::jsonb->'records'->0->'own_response'->>'interest'='interested','own response remains exportable while blocked');
select pg_temp.assert_true(public.tasteprint_remove_my_plan_participation(:'privacy_id'),'recipient erasure works while blocked');
select pg_temp.assert_true(not public.tasteprint_remove_my_plan_participation(:'privacy_id'),'repeated erasure does not falsely succeed');
reset role;
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_social_plans where id=:'privacy_id') and not exists(select 1 from public.tasteprint_social_plan_responses where plan_id=:'privacy_id') and not exists(select 1 from public.tasteprint_social_plan_invites where plan_id=:'privacy_id'),'participation erasure removes shared record, all responses and invite hashes');
-- Regression: own exports must not silently stop at the UI's 50-row list cap.
insert into public.tasteprint_social_plans(id,creator_id,title,expires_at)
select ('b0000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'11111111-1111-1111-1111-111111111111','Bulk synthetic export '||n,null from generate_series(1,120) n;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
do $$declare cursor_id uuid; page jsonb; entry jsonb; matched integer:=0; attempts integer:=0;
begin
 loop
  page:=public.tasteprint_export_my_plan_participation(cursor_id,100);attempts:=attempts+1;
  for entry in select value from jsonb_array_elements(page->'records') loop
   if entry->>'plan_id' like 'b0000000-%' then matched:=matched+1; end if;
  end loop;
  cursor_id:=(page->>'next_cursor')::uuid;
  exit when cursor_id is null;
  if attempts>5 then raise exception 'FAIL: export cursor did not finish'; end if;
 end loop;
 perform pg_temp.assert_true(matched=120 and attempts>1,'all 120 own bulk records export across pages');
end$$;
reset role;
-- Five old/recent/joined/missing-deadline/other-owner fixtures prove the sweep boundary.
insert into public.tasteprint_social_plans(id,creator_id,recipient_id,title,expires_at) values
 ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',null,'Old own unclaimed',now()-interval '8 days'),
 ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',null,'Recently expired',now()-interval '1 day'),
 ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','Accepted old deadline',now()-interval '8 days'),
 ('a0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111',null,'Missing deadline',null),
 ('a0000000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333',null,'Other owner',now()-interval '8 days');
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
select pg_temp.assert_true(public.tasteprint_cleanup_my_expired_plan_invites()=1,'cleanup only removes own old unclaimed record');
select pg_temp.assert_true(public.tasteprint_cleanup_my_expired_plan_invites()=0,'cleanup is idempotent');
reset role;
select pg_temp.assert_true((select count(*)=4 from public.tasteprint_social_plans where id between 'a0000000-0000-0000-0000-000000000001' and 'a0000000-0000-0000-0000-000000000005'),'cleanup preserves recent, accepted, missing-deadline and other-owner plans');
rollback;
select 'Social privacy PASS: actor-scoped paginated export, blocked-content redaction, participant erasure/cascades and bounded own expired-invite cleanup. No background job or hosted migration.';
