#!/usr/bin/env bash
# Disposable local fixture only. No URL, project credential or hosted option accepted.
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
recovery_image='postgres:17@sha256:a63c1ea3f6a3a5a1621f97d2aba3b30faecfab4224c1b0000cc85ced57bb1939'
recovery_container=''
recovery_dir=$(mktemp -d /tmp/tasteprint-social-recovery.XXXXXX)
cleanup(){
 if [[ -n "$recovery_container" ]]; then docker rm --force "$recovery_container" >/dev/null 2>&1 || true; fi
 rm -rf -- "$recovery_dir"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
recovery_container=$(docker run --rm --detach --network none --env POSTGRES_HOST_AUTH_METHOD=trust "$recovery_image")
for attempt in {1..150}; do
 if docker exec "$recovery_container" pg_isready --host=127.0.0.1 --username=postgres >/dev/null 2>&1; then break; fi
 sleep 0.2
done
docker exec "$recovery_container" pg_isready --host=127.0.0.1 --username=postgres >/dev/null
admin_sql(){ docker exec -i "$recovery_container" psql -XqAt --set=ON_ERROR_STOP=1 --host=127.0.0.1 --username=postgres --dbname=postgres "$@"; }
fixture_sql(){ docker exec -i "$recovery_container" psql -XqAt --set=ON_ERROR_STOP=1 --host=127.0.0.1 --username=postgres --dbname=tasteprint_social_recovery_fixture "$@"; }
fingerprint(){ fixture_sql < scripts/sql/fingerprint-social-recovery.sql | sha256sum | cut -d ' ' -f 1; }
admin_sql <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create database tasteprint_social_recovery_fixture;
SQL
fixture_sql <<'SQL'
create schema auth;
create schema extensions;
create extension pgcrypto with schema extensions;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema public,auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
SQL
fixture_sql < supabase/social-plans.sql
fixture_sql < supabase/social-plan-privacy.sql
fixture_sql < scripts/sql/seed-social-recovery.sql
before=$(fingerprint)
# An explicit flag alone cannot target a different database. Missing opt-in also fails.
if admin_sql --command="set tasteprint.allow_fixture_teardown='yes'" --file=- < scripts/sql/teardown-social-recovery-fixture.sql > "$recovery_dir/wrong-database.log" 2>&1; then
 echo 'FAIL: fixture teardown accepted the wrong database' >&2; exit 1
fi
if fixture_sql < scripts/sql/teardown-social-recovery-fixture.sql > "$recovery_dir/missing-opt-in.log" 2>&1; then
 echo 'FAIL: fixture teardown accepted missing opt-in' >&2; exit 1
fi
for guard_log in "$recovery_dir/wrong-database.log" "$recovery_dir/missing-opt-in.log"; do
 rg -q 'Fixture teardown requires its disposable database and explicit opt-in' "$guard_log" || { echo 'FAIL: teardown refusal was not its safety guard' >&2; exit 1; }
done
[[ "$(fingerprint)" == "$before" ]] || { echo 'FAIL: refused teardown changed data' >&2; exit 1; }
# RESTRICT must reject unknown dependencies and roll back earlier RPC drops too.
fixture_sql --command='create view public.recovery_dependency_guard as select id from public.tasteprint_social_plans'
if fixture_sql --command="set tasteprint.allow_fixture_teardown='yes'" --file=- < scripts/sql/teardown-social-recovery-fixture.sql > "$recovery_dir/dependency.log" 2>&1; then
 echo 'FAIL: teardown ignored an unexpected dependency' >&2; exit 1
fi
rg -q 'because other objects depend on it' "$recovery_dir/dependency.log" || { echo 'FAIL: dependency refusal was not a restrictive DROP' >&2; exit 1; }
[[ "$(fingerprint)" == "$before" ]] || { echo 'FAIL: aborted teardown changed data' >&2; exit 1; }
[[ "$(fixture_sql --command="select to_regprocedure('public.tasteprint_export_my_plan_participation(uuid,integer)') is not null")" == 't' ]] || { echo 'FAIL: partial teardown removed an RPC' >&2; exit 1; }
fixture_sql --command='drop view public.recovery_dependency_guard'
# Archive only the four social tables. Auth/provider state and unrelated data are excluded.
docker exec "$recovery_container" pg_dump --host=127.0.0.1 --username=postgres --dbname=tasteprint_social_recovery_fixture \
 --format=custom --data-only --no-owner --no-privileges \
 --table=public.tasteprint_social_plans --table=public.tasteprint_social_plan_responses \
 --table=public.tasteprint_social_plan_invites --table=public.tasteprint_social_blocks > "$recovery_dir/social.dump"
test -s "$recovery_dir/social.dump"
fixture_sql --command="set tasteprint.allow_fixture_teardown='yes'" --file=- < scripts/sql/teardown-social-recovery-fixture.sql
[[ "$(fixture_sql --command="select to_regclass('public.tasteprint_social_plans') is null and to_regprocedure('public.tasteprint_social_can_read(uuid)') is null")" == 't' ]] || { echo 'FAIL: fixture teardown incomplete' >&2; exit 1; }
fixture_sql < supabase/social-plans.sql
fixture_sql < supabase/social-plan-privacy.sql
# A pre-existing conflicting row must fail restore without partial data or overwrites.
fixture_sql --command="insert into public.tasteprint_social_blocks values('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333')"
conflict_before=$(fingerprint)
if docker exec -i "$recovery_container" pg_restore --host=127.0.0.1 --username=postgres --dbname=tasteprint_social_recovery_fixture \
 --data-only --no-owner --no-privileges --exit-on-error --single-transaction < "$recovery_dir/social.dump" > "$recovery_dir/conflict.log" 2>&1; then
 echo 'FAIL: restore overwrote or accepted a conflicting record' >&2; exit 1
fi
rg -q 'duplicate key value' "$recovery_dir/conflict.log" || { echo 'FAIL: restore failure did not exercise a conflicting row' >&2; exit 1; }
[[ "$(fingerprint)" == "$conflict_before" ]] || { echo 'FAIL: failed restore left partial changes' >&2; exit 1; }
fixture_sql --command="delete from public.tasteprint_social_blocks where blocker_id='11111111-1111-1111-1111-111111111111' and blocked_id='33333333-3333-3333-3333-333333333333'"
docker exec -i "$recovery_container" pg_restore --host=127.0.0.1 --username=postgres --dbname=tasteprint_social_recovery_fixture \
 --data-only --no-owner --no-privileges --exit-on-error --single-transaction < "$recovery_dir/social.dump"
[[ "$(fingerprint)" == "$before" ]] || { echo 'FAIL: restored data differs from archive snapshot' >&2; exit 1; }
# Reapply migrations after restore; data, approvals and access boundaries must stay intact.
fixture_sql < supabase/social-plans.sql
fixture_sql < supabase/social-plan-privacy.sql
[[ "$(fingerprint)" == "$before" ]] || { echo 'FAIL: migration reapplication changed restored data' >&2; exit 1; }
fixture_sql < scripts/sql/check-restored-social.sql
echo 'Social recovery PASS: guarded atomic teardown, private data-only archive, exact row fingerprint restore, migration reapplication and unrelated-data preservation. Local fixture only.'
