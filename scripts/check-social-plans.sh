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
sql < supabase/social-friends.sql
sql < supabase/social-friends.sql
sql < supabase/social-shortlists.sql
sql < supabase/social-shortlists.sql
sql < supabase/social-reflection.sql
sql < supabase/social-reflection.sql
sql < supabase/social-updates.sql
sql < supabase/social-updates.sql
sql < scripts/sql/check-social-updates.sql
sql < scripts/sql/check-social-reflection.sql
sql < scripts/sql/check-social-plans.sql
sql < scripts/sql/check-social-plan-privacy.sql
sql < scripts/sql/check-social-friends.sql
sql < scripts/sql/check-social-shortlists.sql
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
# Friend links also bind exactly one claimant; acceptance still needs inviter approval.
friend_race_payload=$(sql <<'SQL'
insert into auth.users(id) values('55555555-5555-5555-5555-555555555555') on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',false) as actor \gset
select public.tasteprint_create_friend_invite('Synthetic racing friend');
SQL
)
friend_race_id=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).connection_id)' <<< "$friend_race_payload")
friend_race_token=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).invite_token)' <<< "$friend_race_payload")
for friend_race_actor in '11111111-1111-1111-1111-111111111111' '55555555-5555-5555-5555-555555555555'; do
 sql --set token="$friend_race_token" --set actor="$friend_race_actor" > "$social_race_dir/friend-$friend_race_actor.log" 2>&1 <<'SQL' &
set role authenticated;
select set_config('request.jwt.claim.sub',:'actor',false) as actor \gset
select public.tasteprint_claim_friend_invite(:'token','Synthetic claimant');
SQL
 if [[ "$friend_race_actor" == '11111111-1111-1111-1111-111111111111' ]]; then friend_race_first=$!; else friend_race_second=$!; fi
done
friend_race_a=0; friend_race_b=0
wait "$friend_race_first" || friend_race_a=$?
wait "$friend_race_second" || friend_race_b=$?
if ! { [[ "$friend_race_a" == 0 && "$friend_race_b" != 0 ]] || [[ "$friend_race_a" != 0 && "$friend_race_b" == 0 ]]; }; then
 sed -E 's/[0-9a-f]{64}/[redacted]/g' "$social_race_dir"/friend-*.log
 echo 'FAIL: friend invitation requires exactly one claimant' >&2; exit 1
fi
friend_race_result=$(sql --set connection="$friend_race_id" <<'SQL'
select count(*)=1 from public.tasteprint_friend_connections where id=:'connection' and state='pending' and recipient_id in ('11111111-1111-1111-1111-111111111111','55555555-5555-5555-5555-555555555555');
SQL
)
[[ "$friend_race_result" == 't' ]] || { echo 'FAIL: friend invitation race corrupted confirmation state' >&2; exit 1; }
echo 'Friend invitation race PASS: one authenticated claimant; inviter confirmation still required.'
# Scoped friend-table recovery, still inside this owned network-disabled fixture.
# Auth, blocks and plan tables stay in place. This is not provider-level recovery.
friend_recovery_selection=$(sql <<'SQL'
insert into auth.users(id) values('66666666-6666-6666-6666-666666666666'),('77777777-7777-7777-7777-777777777777') on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',false) as actor \gset
select public.tasteprint_create_friend_invite('Synthetic recovery sender',array['art']) as proposal \gset
select (:'proposal'::jsonb->>'connection_id') as fid,(:'proposal'::jsonb->>'invite_token') as token \gset
select set_config('request.jwt.claim.sub','77777777-7777-7777-7777-777777777777',false) as actor \gset
select public.tasteprint_claim_friend_invite(:'token','Synthetic recovery recipient',array['coffee']) as claimed \gset
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',false) as actor \gset
select public.tasteprint_respond_friend_connection(:'fid','approve') as approved \gset
select public.tasteprint_add_shortlist_option(:'fid','Synthetic recovery idea','https://example.invalid/recovery') as oid \gset
select public.tasteprint_add_shortlist_option(:'fid','Synthetic recovery alternative','https://example.invalid/alternative') as alternative \gset
select public.tasteprint_respond_shortlist(:'fid',:'oid','interest') as ignored \gset
select public.tasteprint_respond_shortlist(:'fid',:'oid','choose') as ignored \gset
select set_config('request.jwt.claim.sub','77777777-7777-7777-7777-777777777777',false) as actor \gset
select public.tasteprint_respond_shortlist(:'fid',:'oid','interest') as ignored \gset
select public.tasteprint_respond_shortlist(:'fid',:'oid','choose') as ignored \gset
select public.tasteprint_respond_shortlist(:'fid',:'alternative','pass') as ignored \gset
select jsonb_build_object('connection_id',:'fid','option_id',:'oid');
SQL
)
shortlist_race_connection=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).connection_id)' <<< "$friend_recovery_selection")
shortlist_race_option=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).option_id)' <<< "$friend_recovery_selection")
for shortlist_race_actor in '66666666-6666-6666-6666-666666666666' '77777777-7777-7777-7777-777777777777'; do
 sql --set connection="$shortlist_race_connection" --set option="$shortlist_race_option" --set actor="$shortlist_race_actor" > "$social_race_dir/shortlist-$shortlist_race_actor.log" 2>&1 <<'SQL' &
set role authenticated;
select set_config('request.jwt.claim.sub',:'actor',false) as actor \gset
select public.tasteprint_plan_from_shortlist(:'connection',:'option');
SQL
 if [[ "$shortlist_race_actor" == '66666666-6666-6666-6666-666666666666' ]]; then shortlist_race_first=$!; else shortlist_race_second=$!; fi
done
wait "$shortlist_race_first"
wait "$shortlist_race_second"
[[ "$(cat "$social_race_dir/shortlist-66666666-6666-6666-6666-666666666666.log")" == "$(cat "$social_race_dir/shortlist-77777777-7777-7777-7777-777777777777.log")" ]] || { echo 'FAIL: simultaneous shortlist conversion created different plans' >&2; exit 1; }
echo 'Shared shortlist conversion race PASS: both authenticated callers receive the same single plan.'
sql --set connection="$shortlist_race_connection" --set option="$shortlist_race_option" <<'SQL'
set role authenticated;
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',false) as actor \gset
select public.tasteprint_repeat_shortlist_option(:'connection',:'option') as repeated \gset
SQL
friend_fingerprint() { sql <<'SQL'
select encode(extensions.digest(jsonb_build_object(
 'friends',(select coalesce(jsonb_agg(to_jsonb(f) order by id),'[]'::jsonb) from public.tasteprint_friend_connections f),
 'options',(select coalesce(jsonb_agg(to_jsonb(o) order by id),'[]'::jsonb) from public.tasteprint_shortlist_options o),
 'responses',(select coalesce(jsonb_agg(to_jsonb(r) order by option_id,actor_id),'[]'::jsonb) from public.tasteprint_shortlist_responses r),
 'choices',(select coalesce(jsonb_agg(to_jsonb(c) order by connection_id,actor_id),'[]'::jsonb) from public.tasteprint_shortlist_choices c)
 )::text,'sha256'),'hex');
SQL
}
friend_unrelated_fingerprint() { sql <<'SQL'
select encode(extensions.digest(jsonb_build_object(
 'auth',(select jsonb_agg(to_jsonb(u) order by id) from auth.users u),
 'blocks',(select coalesce(jsonb_agg(to_jsonb(b) order by blocker_id,blocked_id),'[]'::jsonb) from public.tasteprint_social_blocks b),
 'plans',(select jsonb_agg(to_jsonb(p) order by id) from public.tasteprint_social_plans p),
 'responses',(select jsonb_agg(to_jsonb(r) order by plan_id,actor_id) from public.tasteprint_social_plan_responses r),
 'invites',(select jsonb_agg(to_jsonb(i) order by plan_id) from public.tasteprint_social_plan_invites i)
 )::text,'sha256'),'hex');
SQL
}
friend_unrelated_before=$(friend_unrelated_fingerprint)
friend_before=$(friend_fingerprint)
(umask 077; docker exec "$test_container" pg_dump --host=127.0.0.1 --username=postgres --dbname=postgres --format=custom --data-only --table=public.tasteprint_friend_connections --table=public.tasteprint_shortlist_options --table=public.tasteprint_shortlist_responses --table=public.tasteprint_shortlist_choices > "$social_race_dir/friends.dump")
docker cp "$social_race_dir/friends.dump" "$test_container:/tmp/friends.dump" >/dev/null
# A duplicate restore must fail atomically and preserve existing rows.
if docker exec "$test_container" pg_restore --host=127.0.0.1 --username=postgres --dbname=postgres --single-transaction --no-owner --no-privileges /tmp/friends.dump > "$social_race_dir/friend-restore.log" 2>&1; then
 echo 'FAIL: duplicate friend restore unexpectedly succeeded' >&2; exit 1
fi
[[ "$(friend_fingerprint)" == "$friend_before" ]] || { echo 'FAIL: failed friend restore changed rows' >&2; exit 1; }
sql <<'SQL'
delete from public.tasteprint_friend_connections;
SQL
docker exec "$test_container" pg_restore --host=127.0.0.1 --username=postgres --dbname=postgres --single-transaction --no-owner --no-privileges /tmp/friends.dump
[[ "$(friend_fingerprint)" == "$friend_before" ]] || { echo 'FAIL: friend recovery row fingerprint differs' >&2; exit 1; }
sql < supabase/social-friends.sql
sql < supabase/social-shortlists.sql
friend_recovered=$(sql <<'SQL'
set role authenticated;
select set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',false) as actor \gset
select jsonb_array_length(public.tasteprint_my_friend_connections())=1 and public.tasteprint_my_friend_connections()->0->>'state'='accepted' and jsonb_array_length(public.tasteprint_read_shared_shortlist((public.tasteprint_my_friend_connections()->0->>'id')::uuid)->'options')=3;
SQL
)
[[ "$friend_recovered" == 't' ]] || { echo 'FAIL: restored friend data or RPC permissions broken' >&2; exit 1; }
[[ "$(friend_unrelated_fingerprint)" == "$friend_unrelated_before" ]] || { echo 'FAIL: scoped friend/shortlist restore changed unrelated data' >&2; exit 1; }
echo 'Friend/shortlist recovery PASS: private data archive, atomic duplicate failure, exact restored rows and migration/RPC reapplication. Auth, blocks and plans preserved in place; local fixture only.'
