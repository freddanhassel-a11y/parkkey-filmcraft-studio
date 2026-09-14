alter table public.media_assets
  add column if not exists alt_text text,
  add column if not exists brand_review jsonb not null default '{}'::jsonb,
  add column if not exists brand_reviewed_at timestamptz,
  add column if not exists brand_reviewed_by uuid;

comment on column public.media_assets.alt_text is 'Accessible alt text reviewed before customer approval for image assets.';
comment on column public.media_assets.brand_review is 'Auditable ParkKey brand checks, including logo fidelity, canonical Parky and alt-text quality.';
comment on column public.media_assets.brand_reviewed_at is 'Timestamp of the latest completed brand review.';
comment on column public.media_assets.brand_reviewed_by is 'ParkKey team member who completed the latest brand review.';
