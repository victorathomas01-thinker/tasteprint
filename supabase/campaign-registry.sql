-- Tasteprint published campaign registry
-- Install after the core data schema. Published manifests are publicly readable only
-- through narrow RPCs. Writes are reserved for the server-side publish function.

create table if not exists public.tasteprint_campaigns (
  campaign_id text primary key,
  manifest jsonb not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists tasteprint_campaigns_status_idx on public.tasteprint_campaigns(status, published_at desc);

alter table public.tasteprint_campaigns enable row level security;

-- No public table policies: browsers cannot enumerate or mutate raw registry rows.
-- The public read surface intentionally exposes only published manifests.
create or replace function public.tasteprint_public_campaign(p_campaign_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
select case
  when c.campaign_id is null then null
  else c.manifest || jsonb_build_object(
    'id', c.campaign_id,
    'published', true,
    'publishedVersion', c.version,
    'publishedAt', c.published_at
  )
end
from public.tasteprint_campaigns c
where c.campaign_id = lower(trim(p_campaign_id))
  and c.status = 'published'
limit 1;
$$;

revoke all on function public.tasteprint_public_campaign(text) from public;
grant execute on function public.tasteprint_public_campaign(text) to anon;

create or replace function public.tasteprint_public_campaign_index()
returns jsonb
language sql
security definer
set search_path = public
as $$
select coalesce(jsonb_agg(
  jsonb_build_object(
    'id', campaign_id,
    'name', manifest ->> 'name',
    'description', manifest ->> 'description',
    'version', version,
    'published_at', published_at
  ) order by published_at desc
), '[]'::jsonb)
from public.tasteprint_campaigns
where status = 'published';
$$;

revoke all on function public.tasteprint_public_campaign_index() from public;
grant execute on function public.tasteprint_public_campaign_index() to anon;

comment on table public.tasteprint_campaigns is 'Tasteprint campaign manifests. Public clients can resolve only rows explicitly marked published through narrow RPCs.';
comment on function public.tasteprint_public_campaign(text) is 'Returns one deliberately published campaign manifest without exposing registry internals.';
comment on function public.tasteprint_public_campaign_index() is 'Returns a minimal index of published Tasteprint campaigns.';
