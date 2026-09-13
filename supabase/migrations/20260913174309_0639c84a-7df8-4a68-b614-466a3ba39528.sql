-- ParkKey Film Studio schema
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.film_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  campaign TEXT,
  goal TEXT,
  audience TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 30,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  resolution TEXT NOT NULL DEFAULT '1920x1080',
  fps INTEGER NOT NULL DEFAULT 30,
  channel TEXT,
  cta TEXT,
  visual_mood TEXT,
  location_time TEXT,
  parky_usage TEXT,
  device_interaction TEXT,
  music_direction TEXT,
  voice_enabled BOOLEAN NOT NULL DEFAULT false,
  subtitles_enabled BOOLEAN NOT NULL DEFAULT false,
  sfx_enabled BOOLEAN NOT NULL DEFAULT false,
  reference_media TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  truth_label TEXT NOT NULL DEFAULT 'DEMO',
  tags TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT film_projects_status_chk CHECK (status IN ('DRAFT','PROMPT READY','RENDERING','READY FOR QA','APPROVED','EXPORTED'))
);

CREATE TABLE public.film_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.film_projects(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL DEFAULT 'V1',
  changelog TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT film_versions_status_chk CHECK (status IN ('DRAFT','PROMPT READY','RENDERING','READY FOR QA','APPROVED','EXPORTED'))
);

CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.film_projects(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.film_versions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT prompts_kind_chk CHECK (kind IN ('master','storyboard','shotlist','continuity','music','negative','export_qa'))
);

CREATE TABLE public.prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  body TEXT NOT NULL,
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'brand',
  kind TEXT NOT NULL DEFAULT 'reference',
  url TEXT,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.renders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.film_projects(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.film_versions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual-upload',
  status TEXT NOT NULL DEFAULT 'NO FILE',
  file_url TEXT,
  mime_type TEXT,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  fps INTEGER,
  codec TEXT,
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT renders_status_chk CHECK (status IN ('NO FILE','QUEUED','RENDERING','READY','FAILED'))
);

CREATE TABLE public.qa_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.film_projects(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.film_versions(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  passed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT CONNECTED',
  capability TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT integrations_status_chk CHECK (status IN ('NOT CONNECTED','CONFIGURED','LIVE','ERROR'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.film_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.film_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.renders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_checklists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.film_projects, public.film_versions, public.prompts, public.prompt_templates, public.assets, public.renders, public.qa_checklists, public.tags, public.integrations TO service_role;

ALTER TABLE public.film_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.film_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio members manage film_projects" ON public.film_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "studio members manage film_versions" ON public.film_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "studio members manage prompts" ON public.prompts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "studio members manage prompt_templates" ON public.prompt_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "studio members manage assets" ON public.assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "studio members manage renders" ON public.renders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "studio members manage qa_checklists" ON public.qa_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "studio members manage tags" ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "studio members manage integrations" ON public.integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER film_projects_updated BEFORE UPDATE ON public.film_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER film_versions_updated BEFORE UPDATE ON public.film_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER qa_checklists_updated BEFORE UPDATE ON public.qa_checklists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER integrations_updated BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX film_versions_project_idx ON public.film_versions(project_id);
CREATE INDEX prompts_project_idx ON public.prompts(project_id);
CREATE INDEX renders_version_idx ON public.renders(version_id);
CREATE INDEX qa_version_idx ON public.qa_checklists(version_id);

-- Seed: tags
INSERT INTO public.tags (label) VALUES
 ('parky-test'),('guldägget'),('mobile-first'),('nordic-autumn'),('municipality'),('mobility-operator'),('local-commerce'),('investor'),('event-launch'),('existing-app');

-- Seed: integrations (provider-agnostic adapter registry)
INSERT INTO public.integrations (provider, display_name, status, capability, notes) VALUES
 ('manual-upload','Manuell uppladdning / extern render','CONFIGURED','Register a rendered MP4 by URL','Fungerar utan externt API. Länka en färdig MP4 till en version för nedladdning.'),
 ('adobe-firefly','Adobe Firefly Video','NOT CONNECTED','text-to-video (planned adapter)','Adapter-gräns finns. Ingen nyckel konfigurerad — ingen rendering sker.'),
 ('generic-video-api','Generisk video-API (provider-agnostisk)','NOT CONNECTED','text-to-video / image-to-video','Lägg till valfri leverantör bakom samma adapter-kontrakt.');

-- Seed: prompt templates
INSERT INTO public.prompt_templates (name, category, description, body, is_builtin) VALUES
('Parky Test','parky-test','Cinematisk demonstration av Parky-testet i mobil, verklig interaktion, ingen voiceover.',
$md$GOAL: Show a real person completing the Parky test on their own phone in a real city, and receiving the reward moment from Parky.
AUDIENCE: Residents + campaign jury.
STRUCTURE: familiar mobility moment -> existing app/system -> defined activity -> verified state -> Parky reward reveal -> local value -> clean branded end frame.
MANDATORY TRUTH: No new app. Just the reward. ParkKey is the reward layer inside systems people already use.
MOTION: long tracking/gimbal moves, natural walking, real hand interaction with the phone.
TEXT RULES: only exact readable UI text, one caption layer max, no pseudo-text, no invented partner logos.$md$, true),
('Municipality','municipality','Kommun/offentlig sektor: verifierad effekt, pilotlogik, ingen ROI-claim utan bevis.',
$md$GOAL: Show a municipality how ParkKey adds a verified reward layer to mobility behaviour without a new app or new payment flow.
STRUCTURE: city problem -> existing operator system -> defined verifiable event -> verified state -> resident reward -> CoreOS proof view -> pilot next step.
TRUTH LABELS: mark any figures EXAMPLE / TARGET / PROPOSED. Never present unverified CO2, ROI or resident numbers as fact.
TONE: calm, credible, Nordic, public-sector appropriate.$md$, true),
('Mobility Operator','mobility-operator','Operatörens varumärke primärt, ParkKey som adderat lager.',
$md$GOAL: Show an operator that ParkKey adds reward value inside their existing app without taking the customer relationship or payment flow.
HOST BRAND: fictional host brand unless an approved partner is verified. Host UI stays visually primary.
STRUCTURE: operator app in normal use -> ParkKey reward layer appears -> verified event -> Parky reward -> operator retention benefit.
MESSAGE: Same app. More value.$md$, true),
('Local Commerce','local-commerce','Lokal handel: belöning som blir lokalt värde.',
$md$GOAL: Show how a verified mobility event turns into local value at a nearby café/shop.
STRUCTURE: arrival -> verified event -> Parky reward -> redemption in local commerce -> community effect.
TONE: warm, human, everyday, no discount-spam aesthetics.$md$, true),
('Investor / Brand','investor','Investerarläge: sparsam Parky, evidensfokus.',
$md$GOAL: Explain ParkKey as reward infrastructure with distribution leverage and provable events.
STRUCTURE: market moment -> distribution insight (existing apps) -> event verification -> reward layer -> CoreOS proof -> scale logic.
PARKY: use sparingly. Proof and clarity dominate.
TRUTH: every number carries VERIFIED / TARGET / EXAMPLE state.$md$, true),
('Event / Launch','event-launch','Kort, energisk lansering, samma sanning.',
$md$GOAL: Announce a ParkKey activation/launch with cinematic energy and one dominant message.
LENGTH: 6-15s. One message, one CTA, one branded end frame.
AVOID: feature lists, multiple CTAs, unverified claims.$md$, true),
('Existing App demo','existing-app','Före/efter i en app användaren redan har.',
$md$GOAL: Demonstrate State A (host app unchanged) vs State B (same app + ParkKey reward layer).
RULES: label DEMO/CONCEPT clearly. Host brand primary. Show the small delta obviously. Never imply a live integration that is not verified.$md$, true);

-- Seed: brand/reference asset records (no fabricated file URLs)
INSERT INTO public.assets (name, category, kind, url, notes, tags) VALUES
('ParkKey™ primärlogotyp','brand','logo',NULL,'Ladda upp original-SVG/PNG. Endast korrekt ParkKey-logotyp får användas i slutbild.','{"brand","logo"}'),
('Parky™ canonical reference','parky','reference',NULL,'Kanonisk Parky: proportioner, ögon, blinkning, gestik. Måste vara identisk genom hela sekvensen.','{"parky","continuity"}'),
('Kampanj-key art: Parky-testet','key-art','image',NULL,'Nordisk höststad, soligt, premium cinematiskt. Ladda upp godkänd key art.','{"parky-test","key-art"}'),
('Musikreferens: varm akustisk premiumreklam','music','music-brief',NULL,'Akustiskt piano, dämpad nylonsträngad gitarr, mjuka live-trummor, varm bas, mycket sparsam stråkpad. Ingen synth-plink, inga digitala pling.','{"music"}'),
('CTA-variant: ParkKey.org/test','cta','text','https://parkkey.org/test','Primär CTA för Parky-testet. Verifiera URL innan publicering.','{"cta"}'),
('CTA-variant: No new app. Just the reward.','cta','text',NULL,'Godkänd budskapsrad ur ParkKey message bank.','{"cta","message"}');
