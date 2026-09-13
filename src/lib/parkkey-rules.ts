/**
 * ParkKey™ governing rules for this studio.
 * Source of truth: the active ParkKey workspace skills. Every new film project
 * inherits these rules automatically through the prompt engine.
 */

export type SkillGovernance = {
  slug: string;
  name: string;
  governs: string;
  appliesTo: string;
};

export const ACTIVE_PARKKEY_SKILLS: SkillGovernance[] = [
  {
    slug: "parkkey-master",
    name: "ParkKey™ Master",
    governs:
      "Sanningsordning, aktuell produktsanning, avvecklade narrativ och slutgiltig kvalitetsgrind.",
    appliesTo: "Alla filmprojekt, alla prompts, alla statusar.",
  },
  {
    slug: "parkkey-video",
    name: "ParkKey™ Video / Firefly",
    governs:
      "Berättelsebåge, shot-spec, kontinuitetsbibel, interaktionsrealism, undertext- och ljudregler, multiformat-master, QA-granskning.",
    appliesTo: "Storyboard, shot list, kontinuitet, musik, QA före export.",
  },
  {
    slug: "parkkey-brand-theme",
    name: "ParkKey™ Brand & Theme",
    governs:
      "Forest Green, Park Green, Pale Cream, Graphite, Montserrat, premium midnight/guld, Parky som guide och budskapsbank.",
    appliesTo: "Studions gränssnitt och all synlig film-output.",
  },
  {
    slug: "parkkey-visual-content",
    name: "ParkKey™ Visual Content",
    governs: "Ett dominerande budskap per yta, komposition, bevisvisualisering, läsbarhet.",
    appliesTo: "Slutbild, key art, textregler i film.",
  },
  {
    slug: "parkkey-design-system",
    name: "ParkKey™ Design System",
    governs: "Semantiska tokens, statussemantik, 8px-rytm, komponenttillstånd.",
    appliesTo: "Hela studions UI.",
  },
  {
    slug: "parkkey-truth-proof",
    name: "ParkKey™ Truth & Proof",
    governs:
      "Bevisstatus (DEMO, EXAMPLE, TARGET, PROPOSED, CONFIRMED, VERIFIED, LIVE), inga påhittade siffror, grönt kräver verifiering.",
    appliesTo: "Projektstatus, renderingsstatus, exportpåståenden.",
  },
  {
    slug: "parkkey-accessibility-release-qa",
    name: "ParkKey™ Accessibility & Release QA",
    governs:
      "WCAG 2.2 AA som baslinje, tangentbord, synlig fokus, reducerad rörelse, sanna tomma/fel-tillstånd, releasegrind.",
    appliesTo: "Studion och filmens undertext/ljud-tillgänglighet.",
  },
  {
    slug: "parkkey-ai-governance",
    name: "ParkKey™ AI Governance",
    governs: "Parkys beteende, AI får föreslå men aldrig uppgradera bevisstatus.",
    appliesTo: "Promptgenerering och Parky-instruktioner.",
  },
  {
    slug: "parkkey-security-privacy",
    name: "ParkKey™ Security & Privacy",
    governs: "Inloggning krävs, least privilege, inga hemligheter i frontend.",
    appliesTo: "Studions data och integrationer.",
  },
  {
    slug: "parkkey-commercial-comms",
    name: "ParkKey™ Commercial Comms",
    governs: "Ton, kundnytta först, tydlig separation mellan överenskommet och föreslaget.",
    appliesTo: "CTA-texter och kampanjbudskap.",
  },
];

export const PROJECT_STATUSES = [
  "DRAFT",
  "PROMPT READY",
  "RENDERING",
  "READY FOR QA",
  "APPROVED",
  "EXPORTED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TRUTH_LABELS = [
  "DEMO",
  "EXAMPLE",
  "HYPOTHESIS",
  "TARGET",
  "PROPOSED",
  "IN DISCUSSION",
  "CONFIRMED",
  "VERIFIED",
  "LIVE",
] as const;

export const EXPORT_PRESETS = [
  { id: "16x9", label: "16:9 landskap", aspect: "16:9", resolution: "1920x1080" },
  { id: "9x16", label: "9:16 vertikal", aspect: "9:16", resolution: "1080x1920" },
  { id: "1x1", label: "1:1 kvadrat", aspect: "1:1", resolution: "1080x1080" },
  { id: "4x5", label: "4:5 social", aspect: "4:5", resolution: "1080x1350" },
] as const;

export const DURATION_PRESETS = [6, 15, 30, 35, 60] as const;

export const MESSAGE_BANK = [
  "No new app. Just the reward.",
  "Same app. More value.",
  "ParkKey™ is the system. Parky™ gives you the reward. CoreOS™ proves the impact.",
  "Pilot → Proof → Scale.",
  "Start narrow. Prove value. Scale what works.",
];

export const GLOBAL_NEGATIVE_LIST = [
  "no drone pads, synth plinks, tech chimes, digital beeps or synthetic corporate music",
  "no slideshow feel, no Ken Burns, no simple pan/zoom as a substitute for real motion",
  "no pseudo-text, no fake or unreadable UI, no lorem ipsum",
  "no invented partner logos or implied integrations without verified proof",
  "no generative character drift — Parky and the main character stay identical across every shot",
  "no duplicated caption layers, no duplicated logos, no duplicated CTAs",
  "no unverified CO2, ROI, revenue, user-reach or pilot claims",
  "no standalone ParkKey consumer app, no separate ParkKey end-user login, no ParkKey payment flow replacing the operator",
  "no neon crypto/SaaS aesthetics, no purple gradients, no generic stock-tech imagery",
  "no explanatory text cards replacing the real interaction journey",
];

export const QA_GATE_ITEMS: { id: string; label: string; source: string }[] = [
  { id: "logo", label: "Korrekt ParkKey™-logotyp i slutbild", source: "parkkey-brand-theme" },
  {
    id: "parky",
    label: "Kanonisk Parky — proportioner, ögon och gestik konsekventa",
    source: "parkkey-video",
  },
  { id: "ui", label: "Läsbar, verklig UI-text (ingen pseudotext)", source: "parkkey-video" },
  {
    id: "partners",
    label: "Inga påhittade partnerlogotyper eller antydda integrationer",
    source: "parkkey-truth-proof",
  },
  {
    id: "drift",
    label: "Ingen generativ karaktärsdrift mellan tagningar",
    source: "parkkey-video",
  },
  {
    id: "motion",
    label: "Verklig rörelse — ingen slideshow-, Ken Burns- eller pan/zoom-känsla",
    source: "parkkey-video",
  },
  {
    id: "audio",
    label: "Inga synt-pling/tech-chimes när SFX är avstängt",
    source: "parkkey-video",
  },
  { id: "cta", label: "CTA korrekt och verifierad", source: "parkkey-commercial-comms" },
  {
    id: "toggles",
    label: "Röst-, undertext- och SFX-inställningar respekterade",
    source: "parkkey-accessibility-release-qa",
  },
  { id: "safe-areas", label: "Säkra marginaler håller i alla målformat", source: "parkkey-video" },
  { id: "aspect", label: "Rätt bildförhållande och upplösning", source: "parkkey-video" },
  { id: "codec", label: "30 fps och H.264 MP4-master", source: "parkkey-video" },
  {
    id: "labels",
    label: "DEMO/EXAMPLE-märkning där något är simulerat",
    source: "parkkey-truth-proof",
  },
];
