\set ON_ERROR_STOP on
begin;
create function pg_temp.updates_assert(value boolean,message text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',message;end if;end$$;
create function pg_temp.updates_denied(statement text) returns void language plpgsql as $$begin begin execute statement;exception when insufficient_privilege or raise_exception then return;end;raise exception 'FAIL: forbidden updates operation succeeded';end$$;
insert into auth.users(id) values('88888888-8888-4888-8888-888888888888'),('99999999-9999-4999-8999-999999999999'),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
select pg_temp.updates_assert(not has_table_privilege('authenticated','public.tasteprint_private_updates','SELECT'),'no raw access');
select pg_temp.updates_assert(not has_function_privilege('anon','public.tasteprint_my_updates()','EXECUTE'),'no anonymous inbox');
select pg_temp.updates_assert(not has_function_privilege('authenticated','public.tasteprint_emit_private_update(uuid,uuid,text,uuid,text)','EXECUTE'),'no forged emitter');
set role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select pg_temp.updates_assert(public.tasteprint_my_updates()->>'enabled'='false','off by default');
select public.tasteprint_create_private_plan('Synthetic updates') as created \gset
select (:'created'::jsonb->>'plan_id') as plan_id,(:'created'::jsonb->>'invite_token') as token \gset
select set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',true);
select public.tasteprint_accept_plan_invite(:'token');
reset role;
select pg_temp.updates_assert((select count(*) from public.tasteprint_private_updates)=0,'disabled stores no receipt');
set role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select public.tasteprint_set_my_updates(true);
select pg_temp.updates_assert(public.tasteprint_my_updates()->'items'='[]'::jsonb,'no backfill');
select set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',true);
select public.tasteprint_respond_private_plan(:'plan_id','interest',1);
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select pg_temp.updates_assert(jsonb_array_length(public.tasteprint_my_updates()->'items')=1,'other response emits');
select (public.tasteprint_my_updates()->'items'->0->>'id') as update_id,(public.tasteprint_my_updates()->'items'->0->>'sequence') as seq \gset
select pg_temp.updates_assert(public.tasteprint_read_my_update(:'update_id',:seq),'own seen');
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select pg_temp.updates_assert(not public.tasteprint_read_my_update(:'update_id',:seq),'other actor cannot mark seen');
select pg_temp.updates_denied($q$select * from public.tasteprint_private_updates$q$);
select set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',true);
select public.tasteprint_respond_private_plan(:'plan_id','decline',1);
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select pg_temp.updates_assert(not public.tasteprint_read_my_update(:'update_id',:seq),'old acknowledgement cannot mark new update');
select pg_temp.updates_assert(public.tasteprint_my_updates()->'items'->0->>'read'='false','new update unread');
insert into public.tasteprint_social_blocks values('88888888-8888-4888-8888-888888888888','99999999-9999-4999-8999-999999999999');
select pg_temp.updates_assert(public.tasteprint_my_updates()->'items'='[]'::jsonb,'blocked source hidden');
select public.tasteprint_set_my_updates(false);
reset role;
select pg_temp.updates_assert((select count(*) from public.tasteprint_private_updates)=0,'opt out erases stored receipts');
set role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select public.tasteprint_set_my_updates(true);
select public.tasteprint_create_friend_invite('Synthetic sender','{}') as friendship \gset
select set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',true);
delete from public.tasteprint_social_blocks; -- Other person's block is protected by RLS.
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
delete from public.tasteprint_social_blocks;
select set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',true);
select public.tasteprint_claim_friend_invite(:'friendship'::jsonb->>'invite_token','Synthetic recipient','{}') as friend_id \gset
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select pg_temp.updates_assert(public.tasteprint_my_updates()->'items'->0->>'kind'='friend_claimed','claim needs explicit sender confirmation');
select public.tasteprint_respond_friend_connection(:'friend_id','remove');
reset role;
select pg_temp.updates_assert((select count(*) from public.tasteprint_private_updates)=0,'source erasure removes receipts');
select set_config('request.jwt.claim.sub','',true);
update public.tasteprint_social_plans set state='scheduled',details=jsonb_build_object('starts_at',now()+interval '1 day'),expires_at=null where id=:'plan_id';
set role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select pg_temp.updates_assert(jsonb_array_length(public.tasteprint_my_updates()->'upcoming')=1,'agreed upcoming plan visible');
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select public.tasteprint_set_my_updates(true);
select pg_temp.updates_assert(public.tasteprint_my_updates()->'upcoming'='[]'::jsonb,'nonparticipant cannot see upcoming plans');
reset role;
select set_config('request.jwt.claim.sub','',true);
update public.tasteprint_social_plans set details=jsonb_build_object('starts_at',now()-interval '1 day') where id=:'plan_id';
set role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select pg_temp.updates_assert(public.tasteprint_my_updates()->'upcoming'='[]'::jsonb,'past plan not upcoming');
select public.tasteprint_respond_private_plan(:'plan_id','complete',1);
reset role;
select pg_temp.updates_assert((select count(*) from public.tasteprint_private_updates)=0,'disabled receiver stores no new update');
delete from auth.users where id='88888888-8888-4888-8888-888888888888';
select pg_temp.updates_assert(not exists(select 1 from public.tasteprint_update_preferences where user_id='88888888-8888-4888-8888-888888888888'),'Auth deletion cascades preference');
rollback;
\echo 'Updates SQL PASS: opt-in collection, JWT-only emitter, own-only seen sequence, block projection, no backfill, opt-out and source erasure.'
