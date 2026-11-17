-- Run only on a disposable PostgreSQL instance for the Passport policy test.
-- This provides the Supabase roles and the auth.uid() behavior the policies rely on.
create role authenticated;
create role anon;
create schema auth;
create table auth.users (id uuid primary key);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema auth to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
