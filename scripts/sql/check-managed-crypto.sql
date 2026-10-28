-- Anonymous erasure must also resolve pgcrypto in the managed extensions schema.
begin;
insert into public.tasteprint_events(id,analytics_version,event_name,session_id,install_id,owner_hash) values
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',1,'synthetic_test','dddddddd-dddd-4ddd-8ddd-dddddddddddd','cccccccc-cccc-4ccc-8ccc-cccccccccccc',encode(digest('synthetic-owner-token-1','sha256'),'hex')),
('ffffffff-ffff-4fff-8fff-ffffffffffff',1,'synthetic_test','dddddddd-dddd-4ddd-8ddd-dddddddddddd','cccccccc-cccc-4ccc-8ccc-cccccccccccc',encode(digest('synthetic-owner-token-2','sha256'),'hex'));
set role anon;
select pg_temp.assert_true(public.tasteprint_delete_my_data('cccccccc-cccc-4ccc-8ccc-cccccccccccc','synthetic-wrong-token')->>'events'='0','wrong deletion token does not erase data');
select pg_temp.assert_true(public.tasteprint_delete_my_data('cccccccc-cccc-4ccc-8ccc-cccccccccccc','synthetic-owner-token-1')->>'events'='1','correct owner token resolves managed digest and deletes its own row');
reset role;
select pg_temp.assert_true((select count(*) from public.tasteprint_events where install_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc')=1,'other owner token row preserved');
rollback;
\echo 'Managed crypto PASS: owner-token erasure works with extensions schema, rejects wrong tokens and preserves other owner data.'
