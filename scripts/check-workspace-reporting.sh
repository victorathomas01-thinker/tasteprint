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
for migration in schema.sql campaigns.sql campaign-registry.sql workspaces.sql workspace-member-refs.sql workspace-lifecycle.sql workspace-reporting.sql; do
  sql < "supabase/$migration"
done
# Verify rerunning the relevant migration preserves the restrictive grants and results.
sql < supabase/workspace-reporting.sql
# Reapplying the core aggregate must not re-enable anonymous reporting.
sql < supabase/campaigns.sql
cat scripts/sql/check-workspace-reporting.sql scripts/sql/check-workspace-authorization.sql scripts/sql/check-workspace-campaign-access.sql scripts/sql/check-managed-crypto.sql | sql
