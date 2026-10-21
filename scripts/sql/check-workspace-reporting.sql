-- Synthetic identities only. auth.uid() is a local fixture, not a real Supabase Auth server.
create function pg_temp.assert_true(actual boolean, description text)
returns void language plpgsql as $$
begin
  if actual is distinct from true then raise exception 'FAIL: %', description; end if;
end;
$$;
create function pg_temp.must_fail(statement text, expected text)
returns void language plpgsql as $$
declare failed boolean := false;
begin
  begin
    execute statement;
  exception when others then
    failed := true;
    if strpos(sqlerrm, expected) = 0 then
      raise exception 'Unexpected error: % (expected %)', sqlerrm, expected;
    end if;
  end;
  if not failed then raise exception 'FAIL: expected rejection: %', statement; end if;
end;
$$;

insert into auth.users(id)
select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid from generate_series(1,7) n;
insert into public.tasteprint_workspaces(id, slug, name, created_by) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test-a', 'Synthetic A', '00000000-0000-0000-0000-000000000001'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'test-b', 'Synthetic B', '00000000-0000-0000-0000-000000000007');
insert into public.tasteprint_workspace_members(workspace_id, user_id, role)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
       (array['owner','admin','editor','analyst','viewer'])[n]
from generate_series(1,5) n;
insert into public.tasteprint_workspace_members values
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000007','owner',now());
insert into public.tasteprint_workspace_campaigns(workspace_id,campaign_id,manifest,created_by,updated_by) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','campaign-a','{}','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','campaign-b','{}','00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000007'),
-- A colliding private draft must not grant access to the real owner's public campaign metrics.
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','campaign-a','{}','00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000007');
insert into public.tasteprint_campaigns(campaign_id,manifest,status,workspace_id) values
('campaign-a','{}','published','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('campaign-b','{}','published','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
insert into public.tasteprint_events(id,analytics_version,event_name,session_id,install_id,properties)
select gen_random_uuid(),1,event_name,gen_random_uuid(),gen_random_uuid(),properties
from (values
('campaign_view','{"campaign_id":"campaign-a"}'::jsonb),
('campaign_view','{"campaign_id":"campaign-a"}'::jsonb),
('campaign_cta','{"campaign_id":"campaign-a","item_id":"lunch"}'::jsonb),
('campaign_view','{"campaign_id":"campaign-b"}'::jsonb)
) records(event_name,properties);

select pg_temp.assert_true(not has_function_privilege('anon', 'public.tasteprint_workspace_campaign_stats(uuid,text)', 'execute'), 'anonymous scoped report denied');
select pg_temp.assert_true(not has_function_privilege('anon', 'public.tasteprint_campaign_stats(text)', 'execute'), 'anonymous raw report denied');
select pg_temp.assert_true(not has_function_privilege('authenticated', 'public.tasteprint_campaign_stats(text)', 'execute'), 'authenticated raw report denied');

set role anon;
select pg_temp.must_fail($q$select public.tasteprint_workspace_campaign_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','campaign-a')$q$, 'permission denied');
select pg_temp.must_fail($q$select public.tasteprint_campaign_stats('campaign-a')$q$, 'permission denied');
reset role;
set role authenticated;
select pg_temp.must_fail($q$select public.tasteprint_workspace_campaign_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','campaign-a')$q$, 'authentication required');
select pg_temp.must_fail($q$select public.tasteprint_campaign_stats('campaign-a')$q$, 'permission denied');

-- This direct Editor call detects the baseline UI/server permission mismatch.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select pg_temp.must_fail($q$select public.tasteprint_workspace_campaign_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','campaign-a')$q$,'report permission required');

-- Owner, admin and analyst can read only their team's owned campaign.
do $$
declare actor integer; result jsonb;
begin
  foreach actor in array array[1,2,4] loop
    perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-' || lpad(actor::text,12,'0'),false);
    result := public.tasteprint_workspace_campaign_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','campaign-a');
    perform pg_temp.assert_true((result->>'views')::integer = 2, 'scoped views for allowed role');
    perform pg_temp.assert_true((result->>'cta_clicks')::integer = 1, 'scoped CTA count');
    perform pg_temp.assert_true((result->>'cta_rate')::numeric = 50, 'documented event denominator');
    perform pg_temp.assert_true(result->'item_clicks'->>'lunch' = '1', 'catalog item aggregate');
    perform pg_temp.assert_true(not (result ?| array['session_id','install_id','user_id','email','owner_hash']), 'no raw identities');
    perform pg_temp.must_fail($q$select public.tasteprint_workspace_campaign_stats('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','campaign-b')$q$, 'report permission required');
    perform pg_temp.must_fail($q$select public.tasteprint_workspace_campaign_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','campaign-b')$q$, 'campaign does not belong');
  end loop;
  -- Editor/viewer/nonmember must fail even when calling the RPC directly.
  foreach actor in array array[3,5,6] loop
    perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-' || lpad(actor::text,12,'0'),false);
    perform pg_temp.must_fail($q$select public.tasteprint_workspace_campaign_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','campaign-a')$q$, 'report permission required');
  end loop;
end;
$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000007',false);
select pg_temp.assert_true((public.tasteprint_workspace_campaign_stats('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','campaign-b')->>'views')::integer=1,'second tenant sees only its metrics');
select pg_temp.must_fail($q$select public.tasteprint_workspace_campaign_stats('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','campaign-a')$q$,'campaign does not belong');
select pg_temp.must_fail($q$select public.tasteprint_workspace_campaign_stats('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','bad/id')$q$,'invalid campaign id');
reset role;
\echo 'Workspace reporting SQL PASS: grants, role matrix, tenant ownership/collision, aggregates and repeatable migration.'
