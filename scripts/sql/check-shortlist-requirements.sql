\set ON_ERROR_STOP on
begin;
create function pg_temp.rules_assert(value boolean,message text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',message;end if;end$$;
create function pg_temp.rules_denied(statement text) returns void language plpgsql as $$begin begin execute statement;exception when insufficient_privilege or raise_exception then return;end;raise exception 'FAIL: forbidden requirements operation succeeded: %',statement;end$$;
insert into auth.users(id) values('81818181-8181-4181-8181-818181818181'),('82828282-8282-4282-8282-828282828282'),('83838383-8383-4383-8383-838383838383');
select pg_temp.rules_assert(not has_table_privilege('authenticated','public.tasteprint_shortlist_requirements','SELECT'),'no raw shared requirements');
select pg_temp.rules_assert(not has_table_privilege('authenticated','public.tasteprint_shortlist_decisions','UPDATE'),'no revision forgery');
select pg_temp.rules_assert(not has_function_privilege('anon','public.tasteprint_read_checked_shortlist(uuid)','EXECUTE'),'no anonymous shared limits');
select pg_temp.rules_assert(not has_function_privilege('authenticated','public.tasteprint_checked_shortlist_context(uuid,integer)','EXECUTE'),'no context bypass helper');
select pg_temp.rules_assert(not has_function_privilege('authenticated','public.tasteprint_assert_shortlist_eligible(uuid)','EXECUTE'),'no source probing helper');
select jsonb_build_object('id','synthetic-rules-item','title','Synthetic requirements idea','description','Synthetic rules fixture only.','category','activity','tags',jsonb_build_array('art'),'revision',1,'status','active','source',jsonb_build_object('url','https://synthetic.invalid/rules','publisher','Synthetic','note','No real listing.','verified_at',now()-interval '1 hour'),'attributes','{}'::jsonb,'constraints',jsonb_build_object('cost',5,'currency','USD','duration_minutes',60,'step_free',true),'availability',jsonb_build_object('status','available')) as item \gset
insert into public.tasteprint_catalog_entries(id,author_id,item,source_key,version,state,reviewer_id) values('synthetic-rules-item','81818181-8181-4181-8181-818181818181',:'item','https://synthetic.invalid/rules',4,'published','83838383-8383-4383-8383-838383838383');
set role authenticated;
select set_config('request.jwt.claim.sub','81818181-8181-4181-8181-818181818181',true);
select public.tasteprint_create_friend_invite('Synthetic requirements sender') as proposal \gset
select (:'proposal'::jsonb->>'connection_id') as fid,(:'proposal'::jsonb->>'invite_token') as token \gset
select pg_temp.rules_denied(format('select public.tasteprint_save_shortlist_requirements(%L,0,''{}'')',:'fid'));
select set_config('request.jwt.claim.sub','82828282-8282-4282-8282-828282828282',true);
select public.tasteprint_claim_friend_invite(:'token','Synthetic requirements friend');
select set_config('request.jwt.claim.sub','81818181-8181-4181-8181-818181818181',true);
select public.tasteprint_respond_friend_connection(:'fid','approve');
select public.tasteprint_add_shortlist_option(:'fid','Synthetic requirements idea','https://synthetic.invalid/rules','synthetic-rules-item') as oid \gset
select public.tasteprint_add_shortlist_option(:'fid','Custom unknown idea','https://synthetic.invalid/custom') as custom \gset
select public.tasteprint_add_shortlist_option(:'fid','Fake title with real ID','https://synthetic.invalid/rules','synthetic-rules-fake') as fake \gset
select pg_temp.rules_assert((public.tasteprint_read_checked_shortlist(:'fid')->'decision'->>'revision')::int=0,'legacy pair starts revision zero');
select public.tasteprint_respond_shortlist(:'fid',:'oid','interest');select public.tasteprint_respond_shortlist(:'fid',:'oid','choose');
select pg_temp.rules_assert(public.tasteprint_save_shortlist_requirements(:'fid',0,'{"maxCost":10,"stepFree":true}')=1,'own requirements saved');
select pg_temp.rules_assert(public.tasteprint_read_checked_shortlist(:'fid')->'choices'='[]'::jsonb,'changed requirements clear both choices');
select pg_temp.rules_assert(public.tasteprint_save_shortlist_requirements(:'fid',1,'{"stepFree":true,"maxCost":10}')=1,'same normalized rules are a no-op');
select pg_temp.rules_denied(format('select public.tasteprint_save_shortlist_requirements(%L,0,''{}'')',:'fid'));
select pg_temp.rules_denied(format('select public.tasteprint_save_shortlist_requirements(%L,1,''{"diagnosis":"no"}'')',:'fid'));
select pg_temp.rules_denied(format('select public.tasteprint_save_shortlist_requirements(%L,1,''{"maxCost":"10"}'')',:'fid'));
select pg_temp.rules_denied(format('select public.tasteprint_save_shortlist_requirements(%L,1,''{"stepFree":null}'')',:'fid'));
select pg_temp.rules_denied(format('select public.tasteprint_save_shortlist_requirements(%L,1,''{"excludedTags":["art","art"]}'')',:'fid'));
select pg_temp.rules_denied(format('select public.tasteprint_respond_shortlist(%L,%L,''choose'')',:'fid',:'oid'));
select pg_temp.rules_denied(format('select public.tasteprint_respond_checked_shortlist(%L,%L,''choose'',0)',:'fid',:'oid'));
select public.tasteprint_respond_checked_shortlist(:'fid',:'oid','choose',1);
-- Context is restored: an earlier checked call in this transaction cannot bless a legacy write.
select pg_temp.rules_denied(format('select public.tasteprint_respond_shortlist(%L,%L,''choose'')',:'fid',:'oid'));
select public.tasteprint_respond_checked_shortlist(:'fid',:'custom','interest',1);
select pg_temp.rules_denied(format('select public.tasteprint_respond_checked_shortlist(%L,%L,''choose'',1)',:'fid',:'custom'));
select set_config('request.jwt.claim.sub','82828282-8282-4282-8282-828282828282',true);
select pg_temp.rules_assert(public.tasteprint_save_shortlist_requirements(:'fid',1,'{"maxMinutes":70,"requireAvailable":true,"excludedTags":["coffee"]}')=2,'other actor sets own limits');
select pg_temp.rules_assert(jsonb_array_length(public.tasteprint_read_checked_shortlist(:'fid')->'decision'->'participants')=2,'only accepted pair shares requirements');
select public.tasteprint_respond_checked_shortlist(:'fid',:'oid','interest',2);select public.tasteprint_respond_checked_shortlist(:'fid',:'oid','choose',2);
select set_config('request.jwt.claim.sub','83838383-8383-4383-8383-838383838383',true);
select pg_temp.rules_denied(format('select public.tasteprint_read_checked_shortlist(%L)',:'fid'));
select pg_temp.rules_denied(format('select public.tasteprint_export_checked_shortlist(%L)',:'fid'));
select pg_temp.rules_denied(format('select public.tasteprint_save_shortlist_requirements(%L,2,''{}'')',:'fid'));
select pg_temp.rules_denied(format('select public.tasteprint_erase_my_shortlist_requirements(%L)',:'fid'));
select set_config('request.jwt.claim.sub','81818181-8181-4181-8181-818181818181',true);
select public.tasteprint_respond_checked_shortlist(:'fid',:'oid','choose',2);
select pg_temp.rules_denied(format('select public.tasteprint_plan_from_shortlist(%L,%L)',:'fid',:'oid'));
-- Facts can change after choosing. Plan creation must recheck and roll back atomically.
reset role;
select count(*) as plans_before from public.tasteprint_social_plans \gset
update public.tasteprint_catalog_entries set item=jsonb_set(item,'{constraints,cost}','11') where id='synthetic-rules-item';
set role authenticated;
select pg_temp.rules_denied(format('select public.tasteprint_plan_checked_shortlist(%L,%L,2)',:'fid',:'oid'));
reset role;
select pg_temp.rules_assert((select count(*)=:'plans_before'::int from public.tasteprint_social_plans),'ineligible conversion leaves no orphan plan or invitation');
select set_config('tasteprint.rules_item',:'item',true);
select set_config('tasteprint.rules_fixture',:'fid',true),set_config('tasteprint.rules_option',:'oid',true);
do $$declare patch jsonb;begin
 for patch in select value from jsonb_array_elements('[{"constraints":{"cost":5,"currency":"EUR","duration_minutes":60,"step_free":true}},{"constraints":{"cost":5,"currency":"USD","duration_minutes":80,"step_free":true}},{"constraints":{"cost":5,"currency":"USD","duration_minutes":60,"step_free":false}},{"constraints":{}},{"availability":{"status":"unknown"}},{"availability":{"status":"unavailable"}},{"availability":{"status":"available","until":"2000-01-01T00:00:00Z"}},{"tags":["coffee"]},{"title":"Changed title"},{"action_url":"https://synthetic.invalid/changed"}]') loop
  update public.tasteprint_catalog_entries set item=current_setting('tasteprint.rules_item')::jsonb||patch where id='synthetic-rules-item';
  perform pg_temp.rules_denied(format('select public.tasteprint_plan_checked_shortlist(%L,%L,2)',current_setting('tasteprint.rules_fixture'),current_setting('tasteprint.rules_option')));
 end loop;
end$$;
update public.tasteprint_catalog_entries set item=:'item',state='draft' where id='synthetic-rules-item';
set role authenticated;
select pg_temp.rules_denied(format('select public.tasteprint_plan_checked_shortlist(%L,%L,2)',:'fid',:'oid'));
reset role;
update public.tasteprint_catalog_entries set state='published',item=jsonb_set(:'item','{source,verified_at}',to_jsonb((now()-interval '31 days')::text)) where id='synthetic-rules-item';
set role authenticated;
select pg_temp.rules_denied(format('select public.tasteprint_plan_checked_shortlist(%L,%L,2)',:'fid',:'oid'));
reset role;
update public.tasteprint_catalog_entries set item=:'item' where id='synthetic-rules-item';
set role authenticated;
select public.tasteprint_plan_checked_shortlist(:'fid',:'oid',2) as pid \gset
select pg_temp.rules_assert(public.tasteprint_plan_checked_shortlist(:'fid',:'oid',2)=:'pid'::uuid,'checked plan retry idempotent');
select pg_temp.rules_assert(public.tasteprint_save_shortlist_requirements(:'fid',2,'{"maxCost":1}')=3,'new rule version after planning');
select public.tasteprint_erase_my_shortlist_requirements(:'fid');
select pg_temp.rules_assert((public.tasteprint_read_checked_shortlist(:'fid')->'decision'->>'revision')::int=4,'owner erasure keeps increasing revision');
insert into public.tasteprint_social_blocks values(auth.uid(),'82828282-8282-4282-8282-828282828282');
select pg_temp.rules_denied(format('select public.tasteprint_read_checked_shortlist(%L)',:'fid'));
select pg_temp.rules_assert(public.tasteprint_export_checked_shortlist(:'fid')->'shared_shortlist'='null'::jsonb,'blocked export redacts other rules');
select set_config('request.jwt.claim.sub','82828282-8282-4282-8282-828282828282',true);
select pg_temp.rules_assert(public.tasteprint_export_checked_shortlist(:'fid')->'own_requirements'->>'maxMinutes'='70','blocked owner can export own rules');
select public.tasteprint_erase_my_shortlist_requirements(:'fid');
reset role;
select pg_temp.rules_assert(not exists(select 1 from public.tasteprint_shortlist_requirements where connection_id=:'fid'),'blocked own-only erasure works');
select pg_temp.rules_assert((select revision=5 from public.tasteprint_shortlist_decisions where connection_id=:'fid'),'tombstone retained after all rules erased');
delete from public.tasteprint_social_blocks where blocker_id='81818181-8181-4181-8181-818181818181';
set role authenticated;
select public.tasteprint_respond_shortlist(:'fid',:'custom','interest');
select pg_temp.rules_denied(format('select public.tasteprint_respond_shortlist(%L,%L,''choose'')',:'fid',:'custom'));
select public.tasteprint_respond_checked_shortlist(:'fid',:'custom','choose',5);
select public.tasteprint_respond_friend_connection(:'fid','remove');
reset role;
select pg_temp.rules_assert(not exists(select 1 from public.tasteprint_shortlist_decisions where connection_id=:'fid'),'connection erasure removes revision marker');
select pg_temp.rules_assert(exists(select 1 from public.tasteprint_social_plans where id=:'pid'),'new rules and connection erasure do not erase independent plans');
rollback;
\echo 'Shared requirements SQL PASS: pair/owner authorization, strict limits, CAS/reset, legacy bypass denial, reviewed identity/facts, both participants, atomic conversion, blocked privacy/erasure and cascades.'
