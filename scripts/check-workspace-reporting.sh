#!/usr/bin/env bash
# Disposable local PostgreSQL only. No network, ports, production credentials or real data.
set -euo pipefail
cd "$(dirname "$0")/.."
test_container="tasteprint-reporting-test-$$"
test_image='postgres:17@sha256:a63c1ea3f6a3a5a1621f97d2aba3b30faecfab4224c1b0000cc85ced57bb1939'
test_container_id=''
cleanup() {
  if [[ -n "$test_container_id" ]]; then docker rm --force "$test_container_id" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT
test_container_id=$(docker run --rm --detach --network none --name "$test_container" \
  --env POSTGRES_HOST_AUTH_METHOD=trust "$test_image")
for attempt in {1..150}; do
  if docker exec "$test_container" pg_isready --host=127.0.0.1 --username=postgres >/dev/null 2>&1; then break; fi
  sleep 0.2
done
docker exec "$test_container" pg_isready --host=127.0.0.1 --username=postgres >/dev/null || { docker logs "$test_container"; exit 1; }
sql() { docker exec -i --env PGOPTIONS=-csearch_path=public,extensions,pg_temp "$test_container" psql -X --quiet --set=ON_ERROR_STOP=1 --host=127.0.0.1 --username=postgres --dbname=postgres; }
sql <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema extensions;
create extension pgcrypto with schema extensions;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
SQL
for migration in schema.sql campaigns.sql campaign-registry.sql workspaces.sql workspace-member-refs.sql workspace-lifecycle.sql workspace-reporting.sql workspace-draft-revisions.sql campaign-publication.sql; do
  sql < "supabase/$migration"
done
# Reapply canonical dependencies in order: core alone would replace newer member-ref RPCs.
# The separate draft-revision trigger must survive the older core definition.
for migration in workspaces.sql workspace-member-refs.sql workspace-lifecycle.sql workspace-reporting.sql; do
  sql < "supabase/$migration"
done
sql < supabase/workspace-draft-revisions.sql
sql < supabase/campaign-publication.sql
# Verify rerunning the relevant migration preserves the restrictive grants and results.
sql < supabase/workspace-reporting.sql
# Reapplying the core aggregate must not re-enable anonymous reporting.
sql < supabase/campaigns.sql
cat scripts/sql/check-workspace-reporting.sql scripts/sql/check-workspace-authorization.sql scripts/sql/check-workspace-campaign-access.sql scripts/sql/check-managed-crypto.sql scripts/sql/check-campaign-publication.sql | sql

# First publisher retains the transaction lock; a different tenant cannot steal
# the same not-yet-existing registry ID after both requests passed preflight.
sql > /tmp/tasteprint-publication-winner-$$.log 2>&1 <<'SQL' &
begin;
set role service_role;
select public.tasteprint_commit_campaign_publication('publish','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000001','publication-race','{"id":"publication-race","name":"Team A"}');
select pg_sleep(2);
commit;
SQL
publication_pid=$!
publication_locked=false
for attempt in {1..100}; do
 if sql <<<"select count(*)>0 as held from pg_locks where locktype='advisory' and granted;" | rg -q '^ t$'; then publication_locked=true;break;fi
 sleep 0.02
done
[[ "$publication_locked" == true ]] || { wait "$publication_pid";echo 'Publication barrier was not reached';exit 1; }
if sql > /tmp/tasteprint-publication-loser-$$.log 2>&1 <<'SQL'
set role service_role;
select public.tasteprint_commit_campaign_publication('publish','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000007','publication-race','{"id":"publication-race","name":"Team B"}');
SQL
then echo 'ERROR: cross-tenant publication race unexpectedly succeeded';exit 1;fi
wait "$publication_pid"
rg -q 'campaign belongs to another workspace' /tmp/tasteprint-publication-loser-$$.log
sql <<'SQL'
do $$begin
 if not exists(select 1 from public.tasteprint_campaigns where campaign_id='publication-race' and workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and version=1 and manifest->>'name'='Team A') or
    not exists(select 1 from public.tasteprint_workspace_campaigns where campaign_id='publication-race' and workspace_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and status='draft' and version=1) then
  raise exception 'cross-tenant race changed winner or losing draft';
 end if;
end;$$;
SQL
rm /tmp/tasteprint-publication-winner-$$.log /tmp/tasteprint-publication-loser-$$.log
echo 'Atomic publication race PASS: one public owner; losing tenant draft unchanged.'
