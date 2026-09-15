-- ParkKey™ Film Studio — LinkedIn Organic sync infrastructure
-- 2026-09-15
-- Purpose: make LinkedIn history imports repeatable, auditable and truthful.
-- This migration does not fabricate LinkedIn data. Missing API observations stay NULL/UNVERIFIED.

alter table public.social_posts
  add column if not exists linkedin_post_id text,
  add column if not exists linkedin_author_id text,
  add column if not exists linkedin_author_name text,
  add column if not exists linkedin_post_type text,
  add column if not exists linkedin_permalink text,
  add column if not exists linkedin_created_at timestamptz,
  add column if not exists linkedin_last_modified_at timestamptz,
  add column if not exists sync_source text,
  add column if not exists sync_confidence text not null default 'UNVERIFIED',
  add column if not exists last_synced_at timestamptz;

create unique index if not exists social_posts_linkedin_post_id_uq
  on public.social_posts (linkedin_post_id)
  where linkedin_post_id is not null;

create index if not exists social_posts_linkedin_created_at_idx
  on public.social_posts (linkedin_created_at desc)
  where linkedin_created_at is not null;

create index if not exists social_posts_last_synced_at_idx
  on public.social_posts (last_synced_at desc)
  where last_synced_at is not null;

create table if not exists public.linkedin_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'linkedin_organic',
  account_id text,
  account_name text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'RUNNING',
  posts_seen integer not null default 0,
  posts_inserted integer not null default 0,
  posts_updated integer not null default 0,
  assets_linked integer not null default 0,
  metrics_updated integer not null default 0,
  warnings integer not null default 0,
  error_message text,
  cursor_after text,
  observed_from timestamptz,
  observed_to timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists linkedin_sync_runs_started_at_idx
  on public.linkedin_sync_runs (started_at desc);

create index if not exists linkedin_sync_runs_status_idx
  on public.linkedin_sync_runs (status, started_at desc);

create table if not exists public.linkedin_post_observations (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid references public.linkedin_sync_runs(id) on delete cascade,
  social_post_id uuid references public.social_posts(id) on delete cascade,
  linkedin_post_id text not null,
  observed_at timestamptz not null default now(),
  published_at timestamptz,
  reactions integer,
  comments integer,
  reposts integer,
  impressions bigint,
  clicks bigint,
  engagement_rate numeric,
  metrics jsonb not null default '{}'::jsonb,
  raw_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists linkedin_post_observations_run_post_uq
  on public.linkedin_post_observations (sync_run_id, linkedin_post_id);

create index if not exists linkedin_post_observations_post_time_idx
  on public.linkedin_post_observations (linkedin_post_id, observed_at desc);

-- Latest verified LinkedIn state per post. Metrics remain NULL when LinkedIn did not return them.
create or replace view public.linkedin_latest_post_state as
select distinct on (o.linkedin_post_id)
  o.linkedin_post_id,
  o.social_post_id,
  o.observed_at,
  o.published_at,
  o.reactions,
  o.comments,
  o.reposts,
  o.impressions,
  o.clicks,
  o.engagement_rate,
  o.metrics,
  o.raw_summary
from public.linkedin_post_observations o
order by o.linkedin_post_id, o.observed_at desc;

-- Canonical Film Studio history feed: verified LinkedIn dates win over asset dates.
create or replace view public.linkedin_history_feed as
select
  p.id,
  p.title,
  p.status,
  p.truth_label,
  p.campaign,
  p.copy_sv,
  p.copy_en,
  p.tags,
  p.history_key,
  p.linkedin_post_id,
  coalesce(p.linkedin_permalink, p.source_post_url) as post_url,
  p.linkedin_author_name,
  p.linkedin_post_type,
  p.asset_date,
  coalesce(p.linkedin_created_at, p.published_at) as verified_published_at,
  p.published_at,
  p.linkedin_created_at,
  p.last_synced_at,
  p.sync_source,
  p.sync_confidence,
  p.metrics_status,
  p.metrics_observed_at,
  p.linkedin_response_summary,
  p.linkedin_metrics,
  s.reactions,
  s.comments,
  s.reposts,
  s.impressions,
  s.clicks,
  s.engagement_rate,
  s.observed_at as latest_metrics_observed_at
from public.social_posts p
left join public.linkedin_latest_post_state s
  on s.linkedin_post_id = p.linkedin_post_id
where p.network = 'LinkedIn';

-- Bring existing historical rows onto the new sync vocabulary without claiming publication.
update public.social_posts
set
  sync_source = coalesce(sync_source, 'parkkey-library-history'),
  sync_confidence = case
    when linkedin_post_id is not null then 'VERIFIED'
    when history_key is not null then 'ASSET_ONLY'
    else sync_confidence
  end,
  last_synced_at = coalesce(last_synced_at, updated_at)
where network = 'LinkedIn';

comment on table public.linkedin_sync_runs is
  'Audit journal for LinkedIn Organic history/metrics syncs. A completed run records what was observed, inserted, updated and warned.';
comment on table public.linkedin_post_observations is
  'Time-series observations of LinkedIn engagement. NULL means the API did not return the metric; never coerce missing metrics to zero.';
comment on view public.linkedin_history_feed is
  'Canonical LinkedIn history feed for Film Studio. Verified LinkedIn timestamps and metrics are separated from source asset dates.';
