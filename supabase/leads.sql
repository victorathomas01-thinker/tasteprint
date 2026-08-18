-- Tasteprint optional campaign lead-capture storage.
-- Run after supabase/schema.sql and supabase/campaign-registry.sql.
-- This table contains contact information and is intentionally never readable by anon/authenticated roles.
-- Raw contact rows have a 90-day default retention target so a demo/commercial experiment
-- does not quietly become an indefinite contact database.

create table if not exists public.tasteprint_campaign_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null check (char_length(campaign_id) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  email_hash text not null check (char_length(email_hash) = 64),
  name text null check (name is null or char_length(name) <= 100),
  consent_version text not null default 'v1' check (char_length(consent_version) between 1 and 40),
  source text not null default 'post_result' check (char_length(source) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (campaign_id, email_hash)
);

create index if not exists tasteprint_campaign_leads_campaign_created_idx
  on public.tasteprint_campaign_leads (campaign_id, created_at desc);

alter table public.tasteprint_campaign_leads enable row level security;

-- No public RLS policy is created. Only trusted service-role/Edge Function code should access this table.
revoke all on table public.tasteprint_campaign_leads from anon, authenticated;

create or replace function public.tasteprint_prune_old_leads()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  delete from public.tasteprint_campaign_leads
  where created_at < now() - interval '90 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Contact-data pruning is maintenance, never a browser action.
revoke all on function public.tasteprint_prune_old_leads() from public, anon, authenticated;

comment on table public.tasteprint_campaign_leads is
  'Explicit-consent campaign contacts. Not exposed through public RPCs or analytics event properties. Raw-contact retention target: 90 days.';
comment on function public.tasteprint_prune_old_leads() is
  'Trusted maintenance function that deletes raw campaign contact rows older than 90 days.';
