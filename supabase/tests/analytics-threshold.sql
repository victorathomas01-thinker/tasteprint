-- Use a disposable database initialized with schema.sql.
-- This test requires empty analytics tables and rolls back its fixture writes.
begin;

do $$
begin
  if exists (select 1 from public.tasteprint_profiles)
     or exists (select 1 from public.tasteprint_events) then
    raise exception 'Analytics threshold test requires an empty disposable database';
  end if;
end;
$$;

insert into public.tasteprint_profiles (id, session_id, install_id, archetype, travel_mode, scores)
select gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'Example', 'Example',
  jsonb_build_object('romance', n)
from generate_series(1, 49) as series(n);

set local role anon;
do $$
declare
  stats jsonb := public.tasteprint_public_stats();
  result jsonb := public.tasteprint_percentiles('{"romance":25}');
begin
  if stats->>'total_profiles' is distinct from '49'
     or stats->>'percentiles_enabled' is distinct from 'false'
     or result->>'available' is distinct from 'false'
     or result->>'sample_size' is distinct from '49'
     or result ? 'values' then
    raise exception 'Unexpected analytics payload below the percentile threshold';
  end if;
  begin
    if exists (select 1 from public.tasteprint_profiles) then
      raise exception 'Anonymous reader could see raw profiles';
    end if;
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

insert into public.tasteprint_profiles (id, session_id, install_id, archetype, travel_mode, scores)
values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'Example', 'Example', '{"romance":50}');

set local role anon;
do $$
declare
  stats jsonb := public.tasteprint_public_stats();
  result jsonb := public.tasteprint_percentiles('{"romance":25}');
begin
  if stats->>'percentiles_enabled' is distinct from 'true'
     or result->>'available' is distinct from 'true'
     or result->>'sample_size' is distinct from '50'
     or result->'values'->>'romance' is distinct from '50' then
    raise exception 'Unexpected analytics payload at the percentile threshold';
  end if;
end;
$$;

-- Exercise the browser write and deletion paths under the anonymous role.
insert into public.tasteprint_events
  (id, analytics_version, event_name, session_id, install_id)
values (gen_random_uuid(), 1, 'page_view', gen_random_uuid(), gen_random_uuid());

select public.tasteprint_delete_my_data(gen_random_uuid(), 'synthetic-deletion-token');

rollback;
