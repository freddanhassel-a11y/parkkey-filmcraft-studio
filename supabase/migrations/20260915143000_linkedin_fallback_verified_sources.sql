-- ParkKey™ Film Studio — verified LinkedIn fallback sources
-- 2026-09-15
-- Purpose: keep Film Studio useful while Windsor linkedin_organic account selection is blocked.
-- Sources are first-party LinkedIn notification email + publicly indexed LinkedIn post URLs.

create table if not exists public.linkedin_weekly_analytics (
  id uuid primary key default gen_random_uuid(),
  profile_slug text not null,
  period_start date not null,
  period_end date not null,
  impressions bigint,
  source text not null default 'linkedin_email',
  source_message_id text,
  verification_status text not null default 'VERIFIED',
  observed_at timestamptz not null default now(),
  raw_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_slug, period_start, period_end, source)
);

create index if not exists linkedin_weekly_analytics_profile_period_idx
  on public.linkedin_weekly_analytics(profile_slug, period_end desc);

-- Exact LinkedIn profile slug verified from first-party LinkedIn weekly analytics email.
insert into public.linkedin_weekly_analytics
  (profile_slug, period_start, period_end, impressions, source, source_message_id,
   verification_status, observed_at, raw_summary)
values
  ('fredrik-h-584a99ba','2026-08-10','2026-08-16',3093,'linkedin_email',
   '1a0144e7a0efdc1f','VERIFIED — LINKEDIN EMAIL','2026-08-18T09:58:02Z',
   jsonb_build_object('subject','Fredrik, dina inlägg fick 3,093 visningar förra veckan')),
  ('fredrik-h-584a99ba','2026-08-24','2026-08-30',6621,'linkedin_email',
   '1a05c677e32d6684','VERIFIED — LINKEDIN EMAIL','2026-09-01T09:58:01Z',
   jsonb_build_object('subject','Fredrik, dina inlägg fick 6,621 visningar förra veckan'))
on conflict (profile_slug, period_start, period_end, source) do update set
  impressions = excluded.impressions,
  source_message_id = excluded.source_message_id,
  verification_status = excluded.verification_status,
  observed_at = excluded.observed_at,
  raw_summary = excluded.raw_summary,
  updated_at = now();

-- Publicly indexed ParkKey post from the exact verified profile slug.
-- We intentionally do NOT invent an exact published_at timestamp: the public result only
-- exposed a relative age. The LinkedIn activity/post ID and permalink are verified.
insert into public.social_posts
  (title, network, objective, audience, campaign, channel, aspect_ratio,
   copy_sv, copy_en, status, truth_label, tags, history_key,
   linkedin_post_id, linkedin_author_name, linkedin_permalink, source_post_url,
   sync_source, sync_confidence, last_synced_at,
   linkedin_response_summary, linkedin_metrics, metrics_status,
   created_at, updated_at)
values
  ('ParkKey: Smart City Operating System for Mobility, Commerce & Sustainability',
   'LinkedIn',
   'Investor / pilot city outreach',
   'Strategic investors, municipalities, mobility and local commerce partners',
   'ParkKey / Smart City OS',
   'LinkedIn',
   '1:1',
   null,
   'Every Parking Session Creates Value Beyond Parking. What if every parking session could do more than generate parking revenue? Imagine a city where every visit strengthens the local economy, rewards citizens, supports community organizations, and provides municipalities with real-time insights for smarter decisions. That is ParkKey. ParkKey transforms parking into a connected ecosystem where everyone benefits. Citizens earn ParkCoins and local rewards; local businesses gain visits and repeat purchases; municipalities gain actionable insights; and community organizations can receive support through everyday parking. Parky is the AI-powered city companion. ParkKey is positioned as a Smart City Operating System connecting mobility, commerce, sustainability and community. The post invites strategic investors and pilot cities to engage.',
   'PUBLISHED',
   'VERIFIED LINKEDIN',
   array['linkedin','parkkey','smart-city','investor','pilot-city','verified'],
   'linkedin:7488163648658497537',
   '7488163648658497537',
   'Fredrik H.',
   'https://www.linkedin.com/posts/fredrik-h-584a99ba_every-parking-session-creates-value-beyond-activity-7488163648658497537-g8S9',
   'https://www.linkedin.com/posts/fredrik-h-584a99ba_every-parking-session-creates-value-beyond-activity-7488163648658497537-g8S9',
   'linkedin_public_index',
   'VERIFIED',
   now(),
   'Verified against LinkedIn public index for the exact first-party profile slug fredrik-h-584a99ba. Exact publication timestamp and per-post engagement were not exposed by the public result, so they remain unset rather than guessed.',
   '{}'::jsonb,
   'UNAVAILABLE FROM PUBLIC SOURCE',
   now(),
   now())
on conflict (history_key) do update set
  title = excluded.title,
  status = excluded.status,
  truth_label = excluded.truth_label,
  linkedin_post_id = excluded.linkedin_post_id,
  linkedin_author_name = excluded.linkedin_author_name,
  linkedin_permalink = excluded.linkedin_permalink,
  source_post_url = excluded.source_post_url,
  sync_source = excluded.sync_source,
  sync_confidence = excluded.sync_confidence,
  last_synced_at = excluded.last_synced_at,
  linkedin_response_summary = excluded.linkedin_response_summary,
  metrics_status = excluded.metrics_status,
  updated_at = now();

-- Upgrade any prior row for this post id to verified if it already exists under a different history key.
update public.social_posts
set
  status = 'PUBLISHED',
  truth_label = 'VERIFIED LINKEDIN',
  linkedin_permalink = coalesce(linkedin_permalink,
    'https://www.linkedin.com/posts/fredrik-h-584a99ba_every-parking-session-creates-value-beyond-activity-7488163648658497537-g8S9'),
  source_post_url = coalesce(source_post_url,
    'https://www.linkedin.com/posts/fredrik-h-584a99ba_every-parking-session-creates-value-beyond-activity-7488163648658497537-g8S9'),
  sync_source = 'linkedin_public_index',
  sync_confidence = 'VERIFIED',
  last_synced_at = now(),
  metrics_status = case
    when metrics_status like 'VERIFIED%' then metrics_status
    else 'UNAVAILABLE FROM PUBLIC SOURCE'
  end,
  updated_at = now()
where linkedin_post_id = '7488163648658497537';
