-- ParkKey™ Film Studio — historical LinkedIn/post-image catalogue
-- 2026-09-15
-- Uses verified source-asset timestamps from the ParkKey ChatGPT/Drive library.
-- IMPORTANT: asset-created_at is NOT asserted as LinkedIn published_at.
-- LinkedIn engagement stays NULL until a real LinkedIn Organic/API observation exists.

alter table public.media_assets
  add column if not exists external_source_id text,
  add column if not exists external_source_url text,
  add column if not exists source_platform text,
  add column if not exists source_created_at timestamptz;

create unique index if not exists media_assets_external_source_id_uq
  on public.media_assets (external_source_id);

alter table public.social_posts
  add column if not exists history_key text,
  add column if not exists asset_date timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists source_post_url text,
  add column if not exists linkedin_response_summary text,
  add column if not exists linkedin_metrics jsonb not null default '{}'::jsonb,
  add column if not exists metrics_status text not null default 'UNVERIFIED',
  add column if not exists metrics_observed_at timestamptz;

create unique index if not exists social_posts_history_key_uq
  on public.social_posts (history_key);

-- Final/named social visuals only. Generic image-gen variants, presentation charts and
-- technical screenshots are intentionally excluded from this LinkedIn history catalogue.
with source_assets(name, external_source_id, source_created_at, campaign, tags) as (
  values
  ('Ett smartare, hållbarare Sverige','file_00000000c754820d8fc00ed7bb3aae61','2026-09-15T09:01:09.100482Z'::timestamptz,'Government / Sweden',array['linkedin','government','sweden','parkkey']),
  ('ParkKey Rewards för ett levande Göteborg','file_0000000048ac81f4b5ff1debbd695e75','2026-09-15T08:07:18.143704Z'::timestamptz,'Göteborg',array['linkedin','gothenburg','rewards','parkkey']),
  ('ParkKey och Drivhuset: Smartare Göteborg','file_0000000089b08246908679e23c0217f2','2026-09-15T08:00:23.650619Z'::timestamptz,'Göteborg',array['linkedin','drivhuset','gothenburg','parkkey']),
  ('Tillsammans för smartare städer','file_00000000f06881f498d27c3c20717c28','2026-09-15T07:57:26.097227Z'::timestamptz,'Smart cities',array['linkedin','smart-city','parkkey']),
  ('ParkKey Rewards: Ett levande Stockholm','file_00000000095881f49611ec03310907e9','2026-09-14T09:31:03.923434Z'::timestamptz,'Stockholm',array['linkedin','stockholm','rewards','parkkey']),
  ('Stockholm Parkering och Parky i samspel','file_000000000fec81f5ac5454aefdbc140f','2026-09-14T07:32:26.745330Z'::timestamptz,'Stockholm Parkering',array['linkedin','stockholm-parking','parky','parkkey']),
  ('Samma parkering, fler möjligheter','file_0000000089bc824690413a3608c12906','2026-09-14T07:28:33.881289Z'::timestamptz,'Parking rewards',array['linkedin','parking','rewards','parkkey']),
  ('Från parkering till hållbar stad','file_000000002e4c81f68c563e4f34b4e3f0','2026-09-14T07:24:59.420329Z'::timestamptz,'Sustainable city',array['linkedin','parking','sustainability','parkkey']),
  ('Parky-testet: Små val, stora resultat','file_000000007a9c82469a107d3db65c34f4','2026-09-13T17:12:40.860744Z'::timestamptz,'Parky Test',array['linkedin','parky-test','parky','parkkey']),
  ('Parky testar smartare stadsparkering','file_00000000234c81f4a4bac1be40591f00','2026-09-13T16:49:32.129918Z'::timestamptz,'Parky Test',array['linkedin','parky-test','parking','parkkey']),
  ('Parky och den levande staden','file_00000000f424820abcdb66c242aa350c','2026-09-13T16:08:41.003038Z'::timestamptz,'Parky Test',array['linkedin','parky','city','parkkey']),
  ('Parky-testet: Små val, stora skillnader','file_000000003874821087412f90a72885a8','2026-09-13T16:03:55.107212Z'::timestamptz,'Parky Test',array['linkedin','parky-test','parkkey']),
  ('Parkkey: Tillsammans för bättre städer','file_00000000f788820ab3ea03d231af9540','2026-09-12T15:56:33.980116Z'::timestamptz,'Brand / Cities',array['linkedin','city','parkkey']),
  ('Parkkey: Tillsammans för grönare städer','file_00000000460c81f49c5fac44206bf9d5','2026-09-12T15:56:31.948017Z'::timestamptz,'Brand / Sustainability',array['linkedin','sustainability','parkkey']),
  ('ParkKey – Tillsammans för gladare städer','file_00000000fc608210bc3406d0fb8e8a12','2026-09-12T15:56:29.856518Z'::timestamptz,'Brand / Cities',array['linkedin','city','parkkey']),
  ('ParkKey för hållbara stadsliv','file_000000009c3c81f5937de35879286c5c','2026-09-12T15:56:27.950669Z'::timestamptz,'Brand / Sustainability',array['linkedin','sustainability','parkkey']),
  ('ParkKey: Framtidens smartare parkering','file_000000005cd0821089db481531d90967','2026-09-11T22:42:33.937674Z'::timestamptz,'Smart parking',array['linkedin','parking','parkkey']),
  ('Hållbar framtid med ParkKey','file_0000000068f8821093d09141c89606f7','2026-09-11T21:36:57.256692Z'::timestamptz,'Sustainability',array['linkedin','sustainability','parkkey']),
  ('Hållbar vardag med Parky','file_00000000ed4c82109c4fb12cc34a5254','2026-09-11T21:30:59.989522Z'::timestamptz,'Sustainability',array['linkedin','parky','sustainability','parkkey']),
  ('Hållbar mobilitet med ParkKey','file_0000000066d48210a6d52ca775b8e10c','2026-09-11T21:28:34.420070Z'::timestamptz,'Mobility',array['linkedin','mobility','sustainability','parkkey']),
  ('ParkKey: Smartare mobilitet tillsammans','file_00000000e3f881f5b725e084568f73a2','2026-09-11T17:38:14.130599Z'::timestamptz,'Mobility',array['linkedin','mobility','parkkey']),
  ('Från dialog till verklig förändring','file_00000000e09c820e814d1c21bc5d13ed','2026-09-11T16:41:39.493406Z'::timestamptz,'Decision / Pilot',array['linkedin','pilot','decision','parkkey']),
  ('Osäker på ParkKey? Börja litet','file_000000009e248210aeec5ec9e59c8bf4','2026-09-11T13:14:07.151684Z'::timestamptz,'Decision / Pilot',array['linkedin','pilot','cta','parkkey']),
  ('ParkKey: Små steg, stor förändring','file_00000000581881f5a6daa710fbc0714d','2026-09-11T13:00:16.827346Z'::timestamptz,'Decision / Pilot',array['linkedin','pilot','parkkey']),
  ('Läckö-Kinnekulle × ParkKey: Hållbara resor','file_000000000b6c822f80b013b03b14b833','2026-09-11T07:47:29.805697Z'::timestamptz,'Läckö-Kinnekulle',array['linkedin','lacko-kinnekulle','mobility','parkkey']),
  ('Läckö-Kinnekulle × ParkKey: Hållbara upplevelser','file_00000000108081f49c1530253cd85d91','2026-09-11T07:05:22.594943Z'::timestamptz,'Läckö-Kinnekulle',array['linkedin','lacko-kinnekulle','tourism','parkkey']),
  ('Samma parkering, mer värde i Linköping','file_000000000b2081f4b42ea73c7c68ffb9','2026-09-10T10:52:51.912503Z'::timestamptz,'Linköping',array['linkedin','linkoping','parking','parkkey']),
  ('LinPark × ParkKey: Smartare parkering','file_0000000023e08243928be3dee3b8a92c','2026-09-10T10:47:09.453046Z'::timestamptz,'Linköping',array['linkedin','linpark','linkoping','parkkey']),
  ('LinPark möter ParkKey i Linköping','file_000000007b388210847fd2d38a0783f2','2026-09-10T10:37:55.615934Z'::timestamptz,'Linköping',array['linkedin','linpark','linkoping','parkkey']),
  ('ParkKey och Danderyd – smartare tillsammans','file_00000000673482439a5417470d6a504a','2026-09-10T10:35:50.964132Z'::timestamptz,'Danderyd',array['linkedin','danderyd','parkkey']),
  ('ParkKey: Ett smartare Danderyd','file_00000000669881f4800f05651c6fe8ff','2026-09-10T09:08:40.907380Z'::timestamptz,'Danderyd',array['linkedin','danderyd','parkkey']),
  ('ParkKey: Smartare rörelse i Göteborg','file_000000008564823099ba39b316406214','2026-09-09T13:34:43.046831Z'::timestamptz,'Göteborg',array['linkedin','gothenburg','mobility','parkkey']),
  ('ParkKey: Smartare städer, större belöningar','file_000000006adc81f49eef7cc4b3b82501','2026-09-09T09:33:44.152158Z'::timestamptz,'Rewards / Cities',array['linkedin','rewards','smart-city','parkkey'])
)
insert into public.media_assets
  (name, kind, category, mime_type, tags, usage_rights, source_notes,
   approval_status, campaign, notes, external_source_id, source_platform,
   source_created_at, created_at, updated_at)
select
  s.name,
  'image',
  'social-history',
  'image/png',
  s.tags,
  'ParkKey-owned/generated working asset; verify any third-party marks before external reuse.',
  'Imported from ParkKey ChatGPT Library history on 2026-09-15. Source timestamp is verified asset creation time; it is not automatically a LinkedIn publication timestamp.',
  'APPROVED',
  s.campaign,
  'LinkedIn response: UNVERIFIED — no connected LinkedIn Organic metrics source was available during the 2026-09-15 sync. Likes/comments/reposts/impressions are intentionally NULL, never assumed to be zero.',
  s.external_source_id,
  'chatgpt-library',
  s.source_created_at,
  s.source_created_at,
  now()
from source_assets s
on conflict (external_source_id) do update set
  name = excluded.name,
  category = excluded.category,
  tags = excluded.tags,
  campaign = excluded.campaign,
  source_notes = excluded.source_notes,
  notes = excluded.notes,
  source_platform = excluded.source_platform,
  source_created_at = excluded.source_created_at,
  updated_at = now();

-- One Drive asset whose title explicitly identifies it as a LinkedIn image.
insert into public.media_assets
  (name, kind, category, mime_type, tags, usage_rights, source_notes,
   approval_status, campaign, notes, external_source_id, external_source_url,
   source_platform, source_created_at, created_at, updated_at)
values
  ('Parky och ParkKey - Smartare städer LinkedIn', 'image', 'social-history', 'image/png',
   array['linkedin','parky','smart-city','parkkey'],
   'ParkKey-owned/generated working asset; verify any third-party marks before external reuse.',
   'Verified Google Drive asset titled Parky och ParkKey - Smartare städer LinkedIn.png.',
   'APPROVED', 'Smart cities',
   'LinkedIn response: UNVERIFIED — organic engagement was not available from a connected source during this sync.',
   'gdrive:1J0k4wCqxHfChdlcQEEU77NMIZPRDky5v',
   'https://drive.google.com/file/d/1J0k4wCqxHfChdlcQEEU77NMIZPRDky5v/view',
   'google-drive', '2026-09-03T14:02:41.976Z'::timestamptz,
   '2026-09-03T14:02:41.976Z'::timestamptz, now())
on conflict (external_source_id) do update set
  name = excluded.name,
  external_source_url = excluded.external_source_url,
  source_notes = excluded.source_notes,
  notes = excluded.notes,
  updated_at = now();

-- Create a truthful LinkedIn-history record for every imported asset. These are NOT
-- marked PUBLISHED because an actual LinkedIn post URL/date/API response has not been verified.
insert into public.social_posts
  (title, network, objective, audience, campaign, channel, aspect_ratio,
   copy_sv, alt_text, status, truth_label, tags, history_key, asset_date,
   published_at, linkedin_response_summary, linkedin_metrics, metrics_status,
   created_at, updated_at)
select
  m.name,
  'LinkedIn',
  'Historik / innehållsarkiv',
  'ParkKey partners, kommuner, mobilitetsaktörer och beslutsfattare',
  coalesce(m.campaign, 'LinkedIn history'),
  'LinkedIn',
  '1:1',
  'Historikpost importerad från ParkKeys verifierade bildbibliotek. Materialdatumet visas separat. Exakt LinkedIn-publiceringsdatum och engagemang läggs först in när de kan verifieras från LinkedIn.',
  m.name,
  'REVIEW',
  'VERIFIED ASSET',
  m.tags,
  'asset:' || m.external_source_id,
  m.source_created_at,
  null,
  'Ej verifierad. LinkedIn Organic/API var inte anslutet vid synk 2026-09-15; inga likes, kommentarer, reposts eller impressions har hittats pålitligt i anslutna källor.',
  '{}'::jsonb,
  'UNVERIFIED — LINKEDIN ORGANIC NOT CONNECTED',
  m.source_created_at,
  now()
from public.media_assets m
where m.category = 'social-history'
  and m.external_source_id is not null
on conflict (history_key) do update set
  title = excluded.title,
  campaign = excluded.campaign,
  tags = excluded.tags,
  asset_date = excluded.asset_date,
  linkedin_response_summary = excluded.linkedin_response_summary,
  metrics_status = excluded.metrics_status,
  updated_at = now();

insert into public.social_post_assets (post_id, media_asset_id, sort_order, alt_text)
select p.id, m.id, 0, m.name
from public.social_posts p
join public.media_assets m on p.history_key = 'asset:' || m.external_source_id
where p.history_key is not null
on conflict (post_id, media_asset_id) do update set
  sort_order = excluded.sort_order,
  alt_text = excluded.alt_text;

-- Audit event so the provenance of this backfill is visible inside Film Studio.
insert into public.audit_events (action, entity_type, detail)
values (
  'linkedin.history.sync',
  'social_post',
  jsonb_build_object(
    'synced_at', now(),
    'asset_source', 'ParkKey ChatGPT Library + Google Drive',
    'date_semantics', 'asset creation date, not asserted publish date',
    'linkedin_metrics', 'unverified because LinkedIn Organic/API was not connected',
    'policy', 'never substitute missing engagement with zero'
  )
);
