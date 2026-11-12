\set ON_ERROR_STOP on
set timezone='UTC';
create function pg_temp.assert_true(value boolean,message text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',message;end if;end$$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when insufficient_privilege or raise_exception or check_violation then return;end;
 raise exception 'FAIL: forbidden operation succeeded';
end$$;
insert into auth.users(id) values('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222'),('33333333-3333-3333-3333-333333333333'),('44444444-4444-4444-4444-444444444444');
select pg_temp.assert_true(not has_function_privilege('anon','public.tasteprint_create_private_plan(text,text)','EXECUTE'),'anonymous create denied by grants');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_social_plan_invites','SELECT'),'invitation hashes are not browser-readable');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_social_plan_responses','UPDATE'),'responses cannot be directly rewritten');
set role authenticated;
select set_config('request.jwt.claim.sub','',false);
select pg_temp.denied($q$select public.tasteprint_create_private_plan('Not authenticated')$q$);
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select pg_temp.denied($q$select public.tasteprint_create_private_plan('Bad link','https://user:secret@example.com')$q$);
select public.tasteprint_create_private_plan('Synthetic film choice','https://example.com/film') as proposal \gset
select (:'proposal'::jsonb->>'plan_id') as pid,(:'proposal'::jsonb->>'invite_token') as token \gset
select pg_temp.assert_true((select count(*)=1 from public.tasteprint_social_plans),'creator reads own plan');
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_plan_responses where interest='interested'),'proposal does not imply interest');
select pg_temp.denied(format('select public.tasteprint_accept_plan_invite(%L)',:'token'));
select pg_temp.denied(format('update public.tasteprint_social_plans set state=''scheduled'' where id=%L',:'pid'));
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',false);
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_plans),'nonparticipant cannot read');
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_plan_responses),'nonparticipant cannot read responses');
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''interest'',1)',:'pid'));
select pg_temp.denied($q$select public.tasteprint_accept_plan_invite('invalid')$q$);
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select public.tasteprint_accept_plan_invite(:'token');
select pg_temp.denied(format('select public.tasteprint_accept_plan_invite(%L)',:'token'));
select pg_temp.assert_true((select count(*)=1 from public.tasteprint_social_plans where recipient_id=auth.uid() and expires_at is null),'claim binds authenticated recipient and removes invitation deadline from accepted plan');
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''approve'',1)',:'pid'));
select public.tasteprint_respond_private_plan(:'pid','interest',1);
select pg_temp.assert_true((select interest='pending' from public.tasteprint_social_plan_responses where actor_id='11111111-1111-1111-1111-111111111111'),'recipient cannot express creator interest');
select pg_temp.denied(format('update public.tasteprint_social_plan_responses set interest=''interested'' where actor_id=''11111111-1111-1111-1111-111111111111'' and plan_id=%L',:'pid'));
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select public.tasteprint_respond_private_plan(:'pid','interest',1);
select pg_temp.assert_true((select state='mutual_interest' from public.tasteprint_social_plans where id=:'pid'),'both explicitly interested');
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,null,1)',:'pid'));
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''details'',null)',:'pid'));
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''details'',1,null)',:'pid'));
select public.tasteprint_respond_private_plan(:'pid','details',1,jsonb_build_object('starts_at',to_char(now()+interval '2 days','YYYY-MM-DD"T"HH24:MI:SS')||'Z','place','Synthetic review venue'));
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''approve'',1)',:'pid'));
select public.tasteprint_respond_private_plan(:'pid','approve',2);
select pg_temp.assert_true((select state='mutual_interest' from public.tasteprint_social_plans where id=:'pid'),'one approval cannot schedule');
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select public.tasteprint_respond_private_plan(:'pid','approve',2);
select pg_temp.assert_true((select state='scheduled' from public.tasteprint_social_plans where id=:'pid'),'same-version bilateral approval schedules');
select public.tasteprint_respond_private_plan(:'pid','approve',2);
select pg_temp.assert_true((select state='scheduled' from public.tasteprint_social_plans where id=:'pid'),'approval retries are idempotent');
select public.tasteprint_respond_private_plan(:'pid','details',2,jsonb_build_object('starts_at',to_char(now()+interval '3 days','YYYY-MM-DD"T"HH24:MI:SS')||'Z','place','Different synthetic venue'));
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_plan_responses where approved_revision is not null),'material changes reset all approvals');
select pg_temp.assert_true((select state='mutual_interest' and revision=3 from public.tasteprint_social_plans where id=:'pid'),'rescheduling requires reapproval');
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''complete'',3)',:'pid'));
select public.tasteprint_respond_private_plan(:'pid','approve',3);
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select public.tasteprint_respond_private_plan(:'pid','approve',3);
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''complete'',3)',:'pid'));
-- Simulate passage of time only in this owned disposable fixture.
reset role;
update public.tasteprint_social_plans set details=jsonb_set(details,'{starts_at}',to_jsonb(now()-interval '1 day')) where id=:'pid';
set role authenticated;
select public.tasteprint_respond_private_plan(:'pid','complete',3);
select pg_temp.assert_true((select count(*)=1 from public.tasteprint_social_plan_responses where completed_at is not null),'only actor completion recorded');
select pg_temp.assert_true((select state='completed_self_reported' from public.tasteprint_social_plans where id=:'pid'),'completion stays self-reported');
insert into public.tasteprint_social_blocks values(auth.uid(),'22222222-2222-2222-2222-222222222222');
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_plans),'blocking denies both participant paths');
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_plans),'blocked recipient cannot read');
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_blocks),'blocked user cannot enumerate blocker records');
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''complete'',3)',:'pid'));
select pg_temp.denied($q$insert into public.tasteprint_social_blocks values('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333')$q$);
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select pg_temp.assert_true(public.tasteprint_delete_my_private_plan(:'pid'),'creator deletion works even while blocked');
select pg_temp.assert_true((select count(*)=0 from public.tasteprint_social_plan_responses),'deletion cascades responses');
select public.tasteprint_create_private_plan('Revoked synthetic proposal') as proposal \gset
select (:'proposal'::jsonb->>'plan_id') as revoked_pid,(:'proposal'::jsonb->>'invite_token') as revoked_token \gset
select public.tasteprint_respond_private_plan(:'revoked_pid','cancel',1);
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',false);
select pg_temp.denied(format('select public.tasteprint_accept_plan_invite(%L)',:'revoked_token'));
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select public.tasteprint_create_private_plan('Expired synthetic proposal') as proposal \gset
select (:'proposal'::jsonb->>'plan_id') as expired_pid,(:'proposal'::jsonb->>'invite_token') as expired_token \gset
reset role;
update public.tasteprint_social_plan_invites set expires_at=now()-interval '1 day' where plan_id=:'expired_pid';
update public.tasteprint_social_plans set expires_at=now()-interval '1 day' where id=:'expired_pid';
set role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',false);
select pg_temp.denied(format('select public.tasteprint_accept_plan_invite(%L)',:'expired_token'));
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select pg_temp.denied(format('select public.tasteprint_respond_private_plan(%L,''cancel'',1)',:'expired_pid'));
select pg_temp.assert_true(public.tasteprint_delete_my_private_plan(:'expired_pid'),'expired data remains deletable by creator');
select public.tasteprint_create_private_plan('Blocked synthetic claim') as proposal \gset
select (:'proposal'::jsonb->>'invite_token') as blocked_token \gset
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select pg_temp.denied(format('select public.tasteprint_accept_plan_invite(%L)',:'blocked_token'));
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select public.tasteprint_create_private_plan('Synthetic deletion case') as proposal \gset
select (:'proposal'::jsonb->>'plan_id') as deleted_pid,(:'proposal'::jsonb->>'invite_token') as deleted_token \gset
select set_config('request.jwt.claim.sub','44444444-4444-4444-4444-444444444444',false);
select public.tasteprint_accept_plan_invite(:'deleted_token');
reset role;
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_social_plan_invites where token_hash=:'deleted_token'),'plaintext invitation tokens are not stored');
delete from auth.users where id='44444444-4444-4444-4444-444444444444';
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_social_plans where id=:'deleted_pid'),'account removal cascades the shared social record');
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_social_plan_responses where plan_id=:'deleted_pid'),'account removal leaves no response orphans');
select 'Social plans PASS: actor-bound responses, tenant-independent private RLS, hashed one-use invites, expiry/revocation/blocks, bilateral version approvals, reapproval, self-report and cascaded deletion.';
