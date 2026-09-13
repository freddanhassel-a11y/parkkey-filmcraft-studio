-- 1. Lock existing tables to server-side access only (identity now comes from CoreOS)
DO $$
DECLARE t text;
DECLARE p record;
BEGIN
  FOR t IN SELECT unnest(ARRAY['film_projects','film_versions','prompts','prompt_templates','assets','renders','tags','qa_checklists','integrations'])
  LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- 2. Media assets
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'image',
  category text NOT NULL DEFAULT 'brand',
  mime_type text,
  storage_path text,
  file_size bigint,
  width integer,
  height integer,
  duration_seconds numeric,
  tags text[] NOT NULL DEFAULT '{}',
  usage_rights text,
  source_notes text,
  approval_status text NOT NULL DEFAULT 'DEMO',
  film_project_id uuid REFERENCES public.film_projects(id) ON DELETE SET NULL,
  campaign text,
  notes text,
  archived_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER media_assets_updated BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.media_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  version_label text NOT NULL DEFAULT 'V1',
  storage_path text,
  file_size bigint,
  mime_type text,
  width integer,
  height integer,
  duration_seconds numeric,
  changelog text,
  approval_status text NOT NULL DEFAULT 'DEMO',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.media_versions TO service_role;
ALTER TABLE public.media_versions ENABLE ROW LEVEL SECURITY;

-- 3. CoreOS bridge
CREATE TABLE public.customer_material_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_project_id uuid REFERENCES public.film_projects(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES public.media_assets(id) ON DELETE CASCADE,
  coreos_entity_type text NOT NULL,
  coreos_entity_id uuid NOT NULL,
  display_name text NOT NULL,
  display_meta jsonb NOT NULL DEFAULT '{}',
  requested_asset text,
  approved_cta text,
  notes text,
  due_date date,
  truth_label text NOT NULL DEFAULT 'PROPOSED',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.customer_material_links TO service_role;
ALTER TABLE public.customer_material_links ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER customer_material_links_updated BEFORE UPDATE ON public.customer_material_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.coreos_material_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL DEFAULT 'export',
  coreos_entity_type text NOT NULL,
  coreos_entity_id uuid NOT NULL,
  display_name text NOT NULL,
  film_project_id uuid REFERENCES public.film_projects(id) ON DELETE SET NULL,
  film_version_id uuid REFERENCES public.film_versions(id) ON DELETE SET NULL,
  media_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'LINKED',
  truth_label text NOT NULL DEFAULT 'DEMO',
  coreos_activity_id uuid,
  coreos_material_id uuid,
  preview_reference text,
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.coreos_material_links TO service_role;
ALTER TABLE public.coreos_material_links ENABLE ROW LEVEL SECURITY;

-- 4. Social / LinkedIn
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  network text NOT NULL DEFAULT 'linkedin',
  objective text,
  audience text,
  campaign text,
  channel text,
  aspect_ratio text NOT NULL DEFAULT '1:1',
  cta text,
  utm text,
  copy_sv text,
  copy_en text,
  headline text,
  overlay_copy text,
  copy_direction text,
  parky_usage text,
  cinematic_mood text,
  image_references text,
  image_prompt text,
  negative_prompt text,
  alt_text text,
  claim_check text,
  crop_presets text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'DRAFT',
  truth_label text NOT NULL DEFAULT 'DEMO',
  film_project_id uuid REFERENCES public.film_projects(id) ON DELETE SET NULL,
  film_version_id uuid REFERENCES public.film_versions(id) ON DELETE SET NULL,
  coreos_entity_type text,
  coreos_entity_id uuid,
  coreos_display_name text,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.social_posts TO service_role;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER social_posts_updated BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.social_post_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, media_asset_id)
);
GRANT ALL ON public.social_post_assets TO service_role;
ALTER TABLE public.social_post_assets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.social_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Stockholm',
  status text NOT NULL DEFAULT 'SCHEDULED — CONNECTION REQUIRED',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.social_schedules TO service_role;
ALTER TABLE public.social_schedules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER social_schedules_updated BEFORE UPDATE ON public.social_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.publish_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES public.social_schedules(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'linkedin',
  status text NOT NULL DEFAULT 'BLOCKED — CONNECTION REQUIRED',
  error_message text,
  provider_post_url text,
  attempted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.publish_attempts TO service_role;
ALTER TABLE public.publish_attempts ENABLE ROW LEVEL SECURITY;

-- 5. Customer delivery
CREATE TABLE public.delivery_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  message text,
  status text NOT NULL DEFAULT 'DRAFT',
  truth_label text NOT NULL DEFAULT 'DEMO',
  film_project_id uuid REFERENCES public.film_projects(id) ON DELETE SET NULL,
  film_version_id uuid REFERENCES public.film_versions(id) ON DELETE SET NULL,
  media_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  social_post_id uuid REFERENCES public.social_posts(id) ON DELETE SET NULL,
  coreos_entity_type text,
  coreos_entity_id uuid,
  coreos_display_name text,
  secure_reference text,
  expires_at timestamptz,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.delivery_packages TO service_role;
ALTER TABLE public.delivery_packages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER delivery_packages_updated BEFORE UPDATE ON public.delivery_packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.delivery_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.delivery_packages(id) ON DELETE CASCADE,
  coreos_contact_id uuid,
  full_name text NOT NULL,
  email text,
  role_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.delivery_recipients TO service_role;
ALTER TABLE public.delivery_recipients ENABLE ROW LEVEL SECURITY;

-- 6. Integrations + audit
CREATE TABLE public.integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  display_name text NOT NULL,
  capability text,
  status text NOT NULL DEFAULT 'NOT CONNECTED',
  notes text,
  config jsonb NOT NULL DEFAULT '{}',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.integration_connections TO service_role;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER integration_connections_updated BEFORE UPDATE ON public.integration_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX audit_events_created_idx ON public.audit_events (created_at DESC);

INSERT INTO public.integration_connections (provider, display_name, capability, status, notes) VALUES
  ('linkedin', 'LinkedIn Publishing', 'Publicering av inlägg och bilder/video via LinkedIn API', 'NOT CONNECTED', 'Kräver auktoriserad LinkedIn-app med w_member_social. Schemalagda inlägg står som SCHEDULED — CONNECTION REQUIRED tills anslutningen är verifierad.'),
  ('image-generation', 'Bildgenerering', 'Generering av ParkKey-bildkoncept för sociala inlägg', 'NOT CONNECTED', 'Utan ansluten generator visas Generator not connected. Promptpaketet fungerar ändå fullt ut.'),
  ('coreos-bridge', 'CoreOS Material Hub', 'Kundkontext in, material och aktivitet tillbaka', 'CONNECTED', 'Delad ParkKey-inloggning: serverkontroll mot CoreOS-identitet och godkänd teammedlem, smala serveranrop mot CoreOS.'),
  ('coreos-delivery', 'CoreOS kundutskick', 'Faktiskt kundutskick via CoreOS kommunikationsflöde', 'NOT CONNECTED', 'Film Studio bygger leveranspaket med status READY TO SEND IN COREOS och djuplänk. Inget utskick sker härifrån.')
ON CONFLICT (provider) DO NOTHING;