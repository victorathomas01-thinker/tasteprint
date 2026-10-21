#!/usr/bin/env bash
# Disposable local PostgreSQL only. No network, ports, production credentials or real data.
set -euo pipefail
cd "$(dirname "$0")/.."
test_container="tasteprint-social-test-$$"
test_image='postgres:17@sha256:a63c1ea3f6a3a5a1621f97d2aba3b30faecfab4224c1b0000cc85ced57bb1939'
test_container_id=''
social_race_dir=''
cleanup() {
  if [[ -n "$social_race_dir" ]]; then rm -rf -- "$social_race_dir"; fi
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
sql() { docker exec -i "$test_container" psql -X --quiet --tuples-only --no-align --set=ON_ERROR_STOP=1 --host=127.0.0.1 --username=postgres --dbname=postgres "$@"; }
sql <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
-- Supabase commonly installs pgcrypto in this managed namespace.
create schema extensions;
create extension pgcrypto with schema extensions;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
SQL
sql < supabase/social-plans.sql
# Reapplication must preserve policies and least-privilege grants.
sql < supabase/social-plans.sql
sql < supabase/social-plan-privacy.sql
sql < supabase/social-plan-privacy.sql
sql < scripts/sql/check-social-plans.sql
sql < scripts/sql/check-social-plan-privacy.sql
# Two independent PostgreSQL sessions race the same capability; exactly one
# authenticated recipient may claim it. Tokens stay in local temporary input/logs.
social_race_dir=$(mktemp -d /tmp/tasteprint-social-race.XXXXXX)
social_race_payload=$(sql <<'SQL'
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false) as actor \gset
select public.tasteprint_create_private_plan('Synthetic concurrent invitation');
SQL
)
social_race_id=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).plan_id)' <<< "$social_race_payload")
social_race_token=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).invite_token)' <<< "$social_race_payload")
sql --set token="$social_race_token" --set actor='22222222-2222-2222-2222-222222222222' > "$social_race_dir/a.log" 2>&1 <<'SQL' &
set role authenticated;
select set_config('request.jwt.claim.sub',:'actor',false) as actor \gset
select public.tasteprint_accept_plan_invite(:'token');
SQL
social_race_a=$!
sql --set token="$social_race_token" --set actor='33333333-3333-3333-3333-333333333333' > "$social_race_dir/b.log" 2>&1 <<'SQL' &
set role authenticated;
select set_config('request.jwt.claim.sub',:'actor',false) as actor \gset
select public.tasteprint_accept_plan_invite(:'token');
SQL
social_race_b=$!
if wait "$social_race_a"; then social_status_a=0; else social_status_a=$?; fi
if wait "$social_race_b"; then social_status_b=0; else social_status_b=$?; fi
if ! { [[ "$social_status_a" == 0 && "$social_status_b" != 0 ]] || [[ "$social_status_a" != 0 && "$social_status_b" == 0 ]]; }; then
  sed -E 's/[0-9a-f]{64}/[redacted]/g' "$social_race_dir/a.log" "$social_race_dir/b.log"
  echo 'FAIL: invitation race must produce exactly one successful claimant' >&2
  exit 1
fi
social_race_result=$(sql --set plan="$social_race_id" <<'SQL'
select exists(select 1 from public.tasteprint_social_plans where id=:'plan' and recipient_id in ('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333'))
 and (select count(*)=2 from public.tasteprint_social_plan_responses where plan_id=:'plan')
 and exists(select 1 from public.tasteprint_social_plan_invites where plan_id=:'plan' and claimed_at is not null);
SQL
)
[[ "$social_race_result" == 't' ]] || { echo 'FAIL: invitation race left inconsistent participants' >&2; exit 1; }
echo 'Social invitation race PASS: one claimant, two participant rows, no overwritten recipient.'
