/**
 * Social Creative-motor. Genererar ParkKey-styrda kreativa paket enligt
 * parkkey-master, parkkey-brand-theme, parkkey-visual-content,
 * parkkey-commercial-comms och parkkey-truth-proof. Ingen bild genereras här —
 * bara det kreativa paketet, som fungerar helt utan bildgenerator.
 */

export const SOCIAL_NETWORKS = ["LinkedIn", "Instagram", "Facebook", "YouTube", "X"] as const;
export const SOCIAL_ASPECTS = ["1:1", "4:5", "1.91:1", "9:16", "16:9"] as const;
export const SOCIAL_STATUSES = [
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "SCHEDULED — CONNECTION REQUIRED",
  "PUBLISHED",
  "FAILED",
] as const;

export type SocialBrief = {
  title: string;
  objective?: string | null;
  audience?: string | null;
  campaign?: string | null;
  network?: string | null;
  aspect_ratio?: string | null;
  cta?: string | null;
  copy_direction?: string | null;
  parky_usage?: string | null;
  cinematic_mood?: string | null;
  image_references?: string | null;
  customer?: string | null;
  truth_label?: string | null;
};

export type SocialCreative = {
  copy_sv: string;
  copy_en: string;
  headline: string;
  overlay_copy: string;
  image_prompt: string;
  negative_prompt: string;
  alt_text: string;
  claim_check: string;
  crop_presets: string[];
};

const BRAND_PALETTE =
  "ParkKey-paletten: Forest Green #0F3D2E, Park Green #8CC63E, Pale Cream #F5F5EB, Graphite #1E1E1E, tillåten premium midnight/navy-förlängning och återhållsam gyllene värme";

const MOOD_DEFAULT =
  "nordisk, filmisk, premium, mänsklig, mjukt naturligt sidoljus, grunt skärpedjup, verklig stadsmiljö";

export function cropPresetsFor(network: string): string[] {
  if (network === "LinkedIn") return ["1:1 1200x1200", "4:5 1080x1350", "1.91:1 1200x627"];
  if (network === "Instagram") return ["1:1 1080x1080", "4:5 1080x1350", "9:16 1080x1920"];
  if (network === "YouTube") return ["16:9 1920x1080", "9:16 1080x1920"];
  return ["1:1 1080x1080", "4:5 1080x1350", "1.91:1 1200x627"];
}

export function buildSocialCreative(brief: SocialBrief): SocialCreative {
  const network = brief.network ?? "LinkedIn";
  const objective =
    brief.objective?.trim() || "Visa att belöningen kan läggas i appen människor redan använder";
  const audience = brief.audience?.trim() || "kommuner och mobilitetsoperatörer i Norden";
  const cta = brief.cta?.trim() || "ParkKey.org/test";
  const mood = brief.cinematic_mood?.trim() || MOOD_DEFAULT;
  const parky =
    brief.parky_usage?.trim() ||
    "Parky™ finns med som kanonisk belöningsguide i ett tydligt belöningsögonblick — aldrig som dekorativ klistermärke";
  const truth = brief.truth_label ?? "DEMO";
  const customer = brief.customer?.trim();

  const copy_sv = [
    `${objective}.`,
    "",
    "Ingen ny app. Bara belöningen. ParkKey™ läggs som ett modulärt belöningslager i systemet människor redan använder — samma app, mer värde.",
    "",
    `Bevis börjar med en definierad, verifierbar händelse. ${customer ? `Kontext: ${customer}. ` : ""}Vi föreslår att starta smalt: SCOPE → CONNECT → RUN → PROVE → DECIDE → SCALE.`,
    "",
    `Vill du se hur det ser ut i praktiken? ${cta}`,
    "",
    `[${truth}] Innehållet visar ParkKey-upplägget, inte verifierade kundresultat.`,
  ].join("\n");

  const copy_en = [
    `${objective}.`,
    "",
    "No new app. Just the reward. ParkKey™ adds a modular reward layer to the system people already use — same app, more value.",
    "",
    `Proof starts with a defined, verifiable event. ${customer ? `Context: ${customer}. ` : ""}We suggest starting narrow: SCOPE → CONNECT → RUN → PROVE → DECIDE → SCALE.`,
    "",
    `Want to see it in practice? ${cta}`,
    "",
    `[${truth}] This shows the ParkKey approach, not verified customer results.`,
  ].join("\n");

  const headline = brief.copy_direction?.trim()
    ? brief.copy_direction.trim().split("\n")[0]!.slice(0, 70)
    : "Ingen ny app. Bara belöningen.";

  const image_prompt = [
    `Fotorealistisk premium reklambild för ${network}, format ${brief.aspect_ratio ?? "1:1"}.`,
    `Motiv: ${objective}. Målgrupp som känner igen sig: ${audience}.`,
    `Miljö: verklig nordisk stad, ${mood}. Naturlig mänsklig handling, trovärdig mobilinteraktion i handen, riktig blickriktning.`,
    `${parky}.`,
    `Färg och ljus: ${BRAND_PALETTE}. Transparent glas endast där texten förblir läsbar.`,
    "Komposition: en dominerande budskapsyta, generöst tomrum, tydlig hierarki, plats för kort overlay-text i nedre tredjedel och för korrekt ParkKey-logotyp.",
    "Kvalitet: agency-grade, 50–85 mm-känsla, grunt skärpedjup, filmisk färggradering, inga collage.",
    brief.image_references?.trim()
      ? `Bildreferenser att följa: ${brief.image_references.trim()}.`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const negative_prompt = [
    "ingen påhittad text eller pseudotext i bilden",
    "inga påhittade eller felaktiga logotyper, ingen förvrängd ParkKey-logotyp",
    "inga påhittade partnerlogotyper eller kommunvapen",
    "ingen generativ drift i Parkys proportioner, ansikte, päls, silhuett eller nyckelsymbol",
    "ingen generisk krypto/neon-SaaS-estetik, inga lila/indigo-gradienter",
    "inga stockfoto-leenden mot kameran, ingen fejkad skärminteraktion",
    "inga siffror, procenttal, CO₂-tal eller ROI-påståenden i bilden",
    "ingen collage-/slideshowkänsla, inga dekorativa tech-effekter, inga HUD-element",
    "inga extra fingrar eller deformerade händer, ingen oläslig text",
  ].join("; ");

  const alt_text = `ParkKey™-bild: ${objective}. Person i nordisk stadsmiljö med mobil i handen, Parky™ som belöningsguide, ParkKey-logotyp och CTA ${cta}.`;

  const claim_check = [
    `Sanningsetikett: ${truth}.`,
    "Inga siffror för CO₂, ROI, intäkter, användarräckvidd, kunder, partners eller piloter används utan verifierat underlag.",
    "Föreslaget upplägg är märkt som förslag, inte som bekräftad kundleverans.",
    "Grön status används bara för verifierat positivt läge.",
  ].join(" ");

  return {
    copy_sv,
    copy_en,
    headline,
    overlay_copy: `${headline}\n${cta}`,
    image_prompt,
    negative_prompt,
    alt_text,
    claim_check,
    crop_presets: cropPresetsFor(network),
  };
}
