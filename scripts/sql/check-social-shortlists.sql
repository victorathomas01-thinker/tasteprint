\set ON_ERROR_STOP on
create function pg_temp.assert_true(value boolean,message text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',message;end if;end$$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$begin begin execute statement; exception when insufficient_privilege or raise_exception or check_violation or unique_violation then return;end;raise exception 'FAIL: forbidden operation succeeded';end$$;
begin;
insert into auth.users(id) values('88888888-8888-8888-8888-888888888888'),('99999999-9999-9999-9999-999999999999'),('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_shortlist_choices','INSERT'),'no forged direct choices');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_shortlist_options','SELECT'),'no raw shortlist browsing');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_shortlist_responses','UPDATE'),'no rewriting another response');
select pg_temp.assert_true(not has_function_privilege('anon','public.tasteprint_read_shared_shortlist(uuid)','EXECUTE'),'anonymous cannot read private shortlist');
set role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-8888-8888-888888888888',true);
select public.tasteprint_create_friend_invite('Synthetic list sender',array['art']) as proposal \gset
select (:'proposal'::jsonb->>'connection_id') as fid,(:'proposal'::jsonb->>'invite_token') as token \gset
select pg_temp.denied(format('select public.tasteprint_read_shared_shortlist(%L)',:'fid'));
select set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true);
select public.tasteprint_claim_friend_invite(:'token','Synthetic list friend',array['coffee']);
select pg_temp.denied(format('select public.tasteprint_add_shortlist_option(%L,''Unconfirmed pair'')',:'fid'));
select set_config('request.jwt.claim.sub','88888888-8888-8888-8888-888888888888',true);
select public.tasteprint_respond_friend_connection(:'fid','approve');
select public.tasteprint_add_shortlist_option(:'fid','Synthetic first idea','https://example.invalid/one','synthetic-item') as oid \gset
select pg_temp.assert_true(jsonb_array_length(public.tasteprint_read_shared_shortlist(:'fid')->'options')=1,'shared concrete suggestion persisted');
-- Sharing a friend does not grant access to that person's other private connection.
select public.tasteprint_create_friend_invite('Separate connection') as other_proposal \gset
select (:'other_proposal'::jsonb->>'connection_id') as other_fid,(:'other_proposal'::jsonb->>'invite_token') as other_token \gset
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true);
select public.tasteprint_claim_friend_invite(:'other_token','Separate friend');
select pg_temp.denied(format('select public.tasteprint_read_shared_shortlist(%L)',:'fid'));
select set_config('request.jwt.claim.sub','88888888-8888-8888-8888-888888888888',true);
select public.tasteprint_respond_friend_connection(:'other_fid','approve');
select public.tasteprint_add_shortlist_option(:'other_fid','Other connection private idea','https://example.invalid/other-pair') as foreign_option \gset
select public.tasteprint_respond_shortlist(:'other_fid',:'foreign_option','interest');select public.tasteprint_respond_shortlist(:'other_fid',:'foreign_option','choose');
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true);
select public.tasteprint_respond_shortlist(:'other_fid',:'foreign_option','interest');select public.tasteprint_respond_shortlist(:'other_fid',:'foreign_option','choose');
select set_config('request.jwt.claim.sub','88888888-8888-8888-8888-888888888888',true);
select pg_temp.denied(format('select public.tasteprint_respond_shortlist(%L,%L,''interest'')',:'fid',:'foreign_option'));
select pg_temp.denied(format('select public.tasteprint_plan_from_shortlist(%L,%L)',:'fid',:'foreign_option'));
select pg_temp.assert_true(not public.tasteprint_export_my_shortlist(:'fid')::text like '%Other connection private idea%','own export remains scoped to this pair');
select pg_temp.denied(format('select public.tasteprint_add_shortlist_option(%L,''Unsafe URL'',''javascript:alert(1)'')',:'fid'));
select pg_temp.denied(format('select public.tasteprint_add_shortlist_option(%L,''Credentials URL'',''https://user:pass@example.invalid/'')',:'fid'));
select pg_temp.denied(format('select public.tasteprint_respond_shortlist(%L,%L,''choose'')',:'fid',:'oid'));
select public.tasteprint_respond_shortlist(:'fid',:'oid','interest');
select public.tasteprint_respond_shortlist(:'fid',:'oid','choose');
select pg_temp.denied(format('select public.tasteprint_plan_from_shortlist(%L,%L)',:'fid',:'oid'));
select set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true);
select pg_temp.assert_true(public.tasteprint_add_shortlist_option(:'fid','Attempted overwrite','https://example.invalid/changed','synthetic-item')=:'oid'::uuid,'duplicate cannot mutate original source or create vote split');
select pg_temp.assert_true(public.tasteprint_read_shared_shortlist(:'fid')->'options'->0->>'title'='Synthetic first idea','another participant cannot edit suggestion content');
select pg_temp.denied(format('select public.tasteprint_respond_shortlist(%L,%L,''remove'')',:'fid',:'oid'));
select public.tasteprint_respond_shortlist(:'fid',:'oid','interest');
select public.tasteprint_respond_shortlist(:'fid',:'oid','choose');
select public.tasteprint_respond_shortlist(:'fid',:'oid','pass');
select pg_temp.assert_true(jsonb_array_length(public.tasteprint_read_shared_shortlist(:'fid')->'choices')=1,'passing removes only own choice');
select pg_temp.denied(format('select public.tasteprint_plan_from_shortlist(%L,%L)',:'fid',:'oid'));
select public.tasteprint_respond_shortlist(:'fid',:'oid','interest');select public.tasteprint_respond_shortlist(:'fid',:'oid','choose');
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true);
select pg_temp.denied(format('select public.tasteprint_read_shared_shortlist(%L)',:'fid'));
select pg_temp.denied(format('select public.tasteprint_export_my_shortlist(%L)',:'fid'));
select pg_temp.denied(format('select public.tasteprint_respond_shortlist(%L,%L,''interest'')',:'fid',:'oid'));
select pg_temp.denied(format('select public.tasteprint_plan_from_shortlist(%L,%L)',:'fid',:'oid'));
select set_config('request.jwt.claim.sub','88888888-8888-8888-8888-888888888888',true);
select public.tasteprint_plan_from_shortlist(:'fid',:'oid') as pid \gset
select pg_temp.assert_true(public.tasteprint_plan_from_shortlist(:'fid',:'oid')=:'pid'::uuid,'plan creation retries idempotent');
select pg_temp.assert_true((select state='mutual_interest' and recipient_id='99999999-9999-9999-9999-999999999999' and expires_at is null and details='{}'::jsonb from public.tasteprint_social_plans where id=:'pid'),'joint choice creates only mutual interest, never schedule/booking');
select pg_temp.assert_true((select count(*)=2 from public.tasteprint_social_plan_responses where plan_id=:'pid' and interest='interested' and approved_revision is null),'each actor consent represented, no time/place approval invented');
select pg_temp.denied(format('select public.tasteprint_respond_shortlist(%L,%L,''pass'')',:'fid',:'oid'));
select public.tasteprint_add_shortlist_option(:'fid','Synthetic second idea','https://example.invalid/two') as second_oid \gset
select public.tasteprint_respond_shortlist(:'fid',:'second_oid','interest');select public.tasteprint_respond_shortlist(:'fid',:'second_oid','choose');
select public.tasteprint_respond_shortlist(:'fid',:'second_oid','remove');
select pg_temp.assert_true(jsonb_array_length(public.tasteprint_read_shared_shortlist(:'fid')->'choices')=1,'withdrawal cascades invalid choices');
insert into public.tasteprint_social_blocks values(auth.uid(),'99999999-9999-9999-9999-999999999999');
select pg_temp.denied(format('select public.tasteprint_read_shared_shortlist(%L)',:'fid'));
select pg_temp.assert_true(public.tasteprint_export_my_shortlist(:'fid')->'shared_shortlist'='null'::jsonb,'blocked export excludes other shares/responses');
select set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true);
select pg_temp.denied(format('select public.tasteprint_plan_from_shortlist(%L,%L)',:'fid',:'oid'));
select pg_temp.assert_true(public.tasteprint_export_my_shortlist(:'fid')->'own_suggestions'='[]'::jsonb,'blocked recipient cannot export another author idea text');
reset role;
select pg_temp.assert_true((select revoked_at is not null from public.tasteprint_social_plan_invites where plan_id=:'pid'),'no reusable invitation capability for already connected pair');
delete from public.tasteprint_social_blocks where blocker_id='88888888-8888-8888-8888-888888888888';
set role authenticated;
select set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true);
select public.tasteprint_remove_my_plan_participation(:'pid');
select pg_temp.denied(format('select public.tasteprint_plan_from_shortlist(%L,%L)',:'fid',:'oid'));
select pg_temp.assert_true(public.tasteprint_read_shared_shortlist(:'fid')->'options'->0->'plan_id'='null'::jsonb,'erasure clears link without silently resurrecting plan');
select public.tasteprint_repeat_shortlist_option(:'fid',:'oid') as repeat_id \gset
select pg_temp.assert_true(:'repeat_id'::uuid<>:'oid'::uuid,'explicit repeat creates a fresh immutable suggestion');
select pg_temp.assert_true(public.tasteprint_repeat_shortlist_option(:'fid',:'oid')=:'repeat_id'::uuid,'repeat retries reuse one fresh active suggestion');
select pg_temp.assert_true(exists(select 1 from jsonb_array_elements(public.tasteprint_read_shared_shortlist(:'fid')->'options') x where x->>'id'=:'repeat_id' and x->'responses'='[]'::jsonb and x->>'planned'='false' and x->>'repeat_of'=:'oid'),'repeat never copies responses or restores erased plan');
select pg_temp.denied(format('select public.tasteprint_plan_from_shortlist(%L,%L)',:'fid',:'repeat_id'));
select public.tasteprint_add_shortlist_option(:'fid','Synthetic retained plan','https://example.invalid/retained') as retained_option \gset
select public.tasteprint_respond_shortlist(:'fid',:'retained_option','interest');select public.tasteprint_respond_shortlist(:'fid',:'retained_option','choose');
select set_config('request.jwt.claim.sub','88888888-8888-8888-8888-888888888888',true);
select public.tasteprint_respond_shortlist(:'fid',:'retained_option','interest');select public.tasteprint_respond_shortlist(:'fid',:'retained_option','choose');
select public.tasteprint_plan_from_shortlist(:'fid',:'retained_option') as retained_plan \gset
select set_config('tasteprint.shortlist_fixture',:'fid',true);
do $$declare amount integer;begin select jsonb_array_length(public.tasteprint_read_shared_shortlist(current_setting('tasteprint.shortlist_fixture')::uuid)->'options') into amount;for i in amount+1..50 loop perform public.tasteprint_add_shortlist_option(current_setting('tasteprint.shortlist_fixture')::uuid,'Synthetic capacity '||i,'https://example.invalid/cap/'||i);end loop;end$$;
select pg_temp.denied(format('select public.tasteprint_add_shortlist_option(%L,''Capacity exceeded'',''https://example.invalid/too-many'')',:'fid'));
select public.tasteprint_respond_friend_connection(:'fid','remove');
reset role;
select pg_temp.assert_true(exists(select 1 from public.tasteprint_social_plans where id=:'retained_plan'),'friend removal preserves existing independent plan record');
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_shortlist_options where connection_id=:'fid'),'friend erasure cascades shortlist');
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_shortlist_responses where option_id=:'oid'),'no orphan responses after erasure');
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_shortlist_choices where connection_id=:'fid'),'no orphan choices after erasure');
delete from auth.users where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_friend_connections where id=:'other_fid'),'Auth deletion erases its private connection');
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_shortlist_options where id=:'foreign_option'),'Auth deletion cascades suggestion snapshots');
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_shortlist_responses where option_id=:'foreign_option'),'Auth deletion leaves no other-person response orphan');
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_shortlist_choices where connection_id=:'other_fid'),'Auth deletion cascades both choices');
set constraints all immediate;
rollback;
select 'Shared shortlist SQL PASS: accepted-pair authority, immutable suggestions, own interest/choice, no unilateral plan, retraction, one mutual-interest plan, no booking/approval invention, block redaction and cascade/erasure without resurrection.';
