\set ON_ERROR_STOP on
create function pg_temp.assert_true(value boolean,message text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',message;end if;end$$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$begin begin execute statement; exception when insufficient_privilege or raise_exception or check_violation or unique_violation then return;end;raise exception 'FAIL: forbidden operation succeeded';end$$;
begin;
insert into auth.users(id) values('55555555-5555-5555-5555-555555555555'),('66666666-6666-6666-6666-666666666666'),('77777777-7777-7777-7777-777777777777');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_friend_connections','SELECT'),'raw connection rows and hashes unreadable');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.tasteprint_friend_connections','INSERT'),'no direct relationship forgery');
select pg_temp.assert_true(not has_function_privilege('anon','public.tasteprint_my_friend_connections()','EXECUTE'),'anonymous friend RPC denied by grant');
select pg_temp.assert_true((select relrowsecurity from pg_class where oid='public.tasteprint_friend_connections'::regclass),'friend RLS enabled');
set role authenticated;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.denied($q$select public.tasteprint_create_friend_invite('Synthetic')$q$);
select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
select pg_temp.denied($q$select public.tasteprint_create_friend_invite('Synthetic',array['unknown'])$q$);
select pg_temp.denied($q$select public.tasteprint_create_friend_invite(null,array['art'])$q$);
select pg_temp.denied($q$select public.tasteprint_create_friend_invite('Synthetic',null)$q$);
select public.tasteprint_create_friend_invite('Synthetic sender',array['art','coffee']) as proposal \gset
select (:'proposal'::jsonb->>'connection_id') as fid,(:'proposal'::jsonb->>'invite_token') as token \gset
select pg_temp.assert_true((public.tasteprint_my_friend_connections()->0->>'state')='invited','creation not friendship');
select pg_temp.denied(format('select public.tasteprint_claim_friend_invite(%L,''self'')',:'token'));
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',true);
select public.tasteprint_claim_friend_invite(:'token','Synthetic recipient',array['art']);
select pg_temp.denied(format('select public.tasteprint_claim_friend_invite(%L,''replay'')',:'token'));
select pg_temp.assert_true((public.tasteprint_my_friend_connections()->0->>'state')='pending','claim requires inviter confirmation');
select pg_temp.denied(format('select public.tasteprint_respond_friend_connection(%L,''approve'')',:'fid'));
select set_config('request.jwt.claim.sub','77777777-7777-7777-7777-777777777777',true);
select pg_temp.assert_true(jsonb_array_length(public.tasteprint_my_friend_connections())=0,'unrelated actor sees no relationship');
select pg_temp.assert_true(public.tasteprint_respond_friend_connection(:'fid','remove')=false,'unrelated removal denied');
select pg_temp.denied('select * from public.tasteprint_friend_connections');
select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
select public.tasteprint_respond_friend_connection(:'fid','approve');
select pg_temp.assert_true((public.tasteprint_my_friend_connections()->0->>'state')='accepted','creator independently confirms connection');
select public.tasteprint_respond_friend_connection(:'fid','share','Sender updated',array['walking']);
select pg_temp.assert_true((public.tasteprint_my_friend_connections()->0->'recipient_share'->'interests')='["art"]'::jsonb,'sender cannot rewrite recipient shared preferences');
select pg_temp.assert_true((public.tasteprint_my_friend_connections()->0->'inviter_share'->'interests')='["walking"]'::jsonb,'own share can change');
insert into public.tasteprint_social_blocks values(auth.uid(),'66666666-6666-6666-6666-666666666666');
select pg_temp.assert_true(jsonb_array_length(public.tasteprint_my_friend_connections())=0,'blocker connection hidden');
select pg_temp.assert_true((public.tasteprint_export_my_friend_connections()->'connections'->0->'shared_connection')='null'::jsonb,'blocked export excludes other identity and interests');
select pg_temp.denied(format('select public.tasteprint_respond_friend_connection(%L,''share'',''x'',array[''art''])',:'fid'));
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',true);
select pg_temp.assert_true(jsonb_array_length(public.tasteprint_my_friend_connections())=0,'blocked actor hidden too');
select pg_temp.assert_true((public.tasteprint_export_my_friend_connections()->'connections'->0->'own_share'->'interests')='["art"]'::jsonb,'blocked actor can export own contribution');
select public.tasteprint_respond_friend_connection(:'fid','remove');
select pg_temp.assert_true(jsonb_array_length(public.tasteprint_export_my_friend_connections()->'connections')=0,'recipient removal erases shared relationship');
reset role;
delete from public.tasteprint_social_blocks where blocker_id='55555555-5555-5555-5555-555555555555';
set role authenticated;
select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
select public.tasteprint_create_friend_invite('Expiry fixture') as proposal \gset
select (:'proposal'::jsonb->>'connection_id') as expired_id,(:'proposal'::jsonb->>'invite_token') as expired_token \gset
reset role;
update public.tasteprint_friend_connections set expires_at=now()-interval '1 second' where id=:'expired_id';
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_friend_connections where token_hash=:'expired_token'),'no plaintext invite stored');
set role authenticated;
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',true);
select pg_temp.denied(format('select public.tasteprint_claim_friend_invite(%L,''expired'')',:'expired_token'));
select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
select public.tasteprint_respond_friend_connection(:'expired_id','remove');
select public.tasteprint_create_friend_invite('Revocation fixture') as proposal \gset
select (:'proposal'::jsonb->>'connection_id') as revoked_id,(:'proposal'::jsonb->>'invite_token') as revoked_token \gset
select public.tasteprint_respond_friend_connection(:'revoked_id','remove');
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',true);
select pg_temp.denied(format('select public.tasteprint_claim_friend_invite(%L,''revoked'')',:'revoked_token'));
select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
select public.tasteprint_create_friend_invite('Deletion fixture') as proposal \gset
select (:'proposal'::jsonb->>'connection_id') as cascade_id,(:'proposal'::jsonb->>'invite_token') as cascade_token \gset
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',true);
select public.tasteprint_claim_friend_invite(:'cascade_token','Synthetic deleted user');
reset role;
delete from auth.users where id='66666666-6666-6666-6666-666666666666';
select pg_temp.assert_true(not exists(select 1 from public.tasteprint_friend_connections where id=:'cascade_id'),'Auth deletion cascades connection data');
set role authenticated;
select set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
do $$begin for i in 1..10 loop perform public.tasteprint_create_friend_invite('Synthetic cap');end loop;end$$;
select pg_temp.denied($q$select public.tasteprint_create_friend_invite('Exceeds outstanding invitation cap')$q$);
select pg_temp.assert_true(jsonb_array_length(public.tasteprint_export_my_friend_connections()->'connections')=10,'bounded full own export includes all pending invites');
reset role;
rollback;
select 'Friends SQL PASS: one-use hashed invitations, explicit creator confirmation, own sharing only, no raw reads, blocks, redacted export, removal/revocation/expiry, Auth deletion and pending invitation cap.';
