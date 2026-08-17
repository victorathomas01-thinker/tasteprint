-- Tasteprint optional campaign lead-capture storage.
-- Run after supabase/schema.sql and supabase/campaign-registry.sql.
-- This table contains contact information and is intentionally never readable by anon/authenticated roles.

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

comment on table public.tasteprint_campaign_leads is
  'Explicit-consent campaign contacts. Not exposed through public RPCs or analytics event properties.';
