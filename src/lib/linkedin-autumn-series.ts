const CAMPAIGN = "LinkedIn Höstserie 2026";
const SCHEDULE_STATUS = "SCHEDULED — CONNECTION REQUIRED";

const entries = [
  {
    n: "001",
    date: "2026-09-16T17:30:00+02:00",
    title: "16/9 — Ingen ny app. Bara belöningen.",
    asset: "Höstserie 01 — Ingen ny app",
    copy: "Det behövs inte alltid ännu en app.\n\nParkKey™ är byggt för motsatsen: ett belönings- och beteendelager bakom de system människor redan använder.\n\nEn verifierad händelse kan bli nästa positiva beteende — parkering, kollektivtrafik, gång, cykel eller lokal aktivitet — utan att ta över kundresan.\n\nIngen ny app. Bara belöningen.\n\nVi söker nu fler aktörer som vill testa en smal, mätbar pilot.\n\n#ParkKey #Mobility #SmartCity #BehaviorChange",
    headline: "Ingen ny app. Bara belöningen.",
    alt: "Person i nordisk höststad använder en befintlig mobilitetsapp medan ParkKey-belöningen visas som nästa lager.",
    prompt: "Vertical 4:5 LinkedIn key art, cinematic Nordic autumn city, existing mobility app remains primary, subtle ParkKey reward layer after verified event, canonical Parky exactly as approved, premium realistic photography.",
    tags: ["linkedin", "autumn-2026", "existing-app"],
  },
  {
    n: "002",
    date: "2026-09-18T08:15:00+02:00",
    title: "18/9 — Belöningen gör dagen",
    asset: "Höstserie 02 — Belöningen gör dagen",
    copy: "Beteendeförändring börjar sällan med en dashboard. Den börjar med en människa.\n\nEtt litet positivt ögonblick kan göra stor skillnad: du gör något bra — och får något tillbaka direkt.\n\nDet är där Parky™ kommer in. ParkKey kopplar verifierade händelser till belöningar som känns relevanta i vardagen och kan skapa värde både för individen och lokalt.\n\nBelöningen gör dagen. Data visar om beteendet faktiskt förändras.\n\n#ParkKey #Parky #Rewards #Mobility",
    headline: "Belöningen gör dagen.",
    alt: "Varm vardagsscen där Parky markerar ett positivt belöningsögonblick efter en verifierad aktivitet.",
    prompt: "Vertical 4:5 cinematic Nordic autumn street, authentic reward moment, canonical Parky exactly as approved, premium realistic photography.",
    tags: ["linkedin", "autumn-2026", "parky", "reward"],
  },
  {
    n: "003",
    date: "2026-09-21T08:15:00+02:00",
    title: "21/9 — Från parkeringshändelse till beteendeförändring",
    asset: "Höstserie 03 — Från parkering till beteende",
    copy: "Parkeringen är inte slutet på resan. Den kan vara startpunkten för nästa beteende.\n\nParkKey™ kan använda en verifierad parkeringshändelse som signal och lägga ett belöningslager efteråt: gå vidare till centrum, välja kollektivtrafik nästa gång, upptäcka lokal handel eller delta i en definierad aktivitet.\n\nParkeringsappen fortsätter vara parkeringsupplevelsen. ParkKey skapar nästa värde.\n\nOch piloten kan mätas med ett fåtal tydliga KPI:er.\n\n#Parking #ParkKey #Mobility #BehaviorChange",
    headline: "Från parkering till nästa beteende.",
    alt: "Verifierad parkeringshändelse följs av en ParkKey-belöning och nästa aktivitet i staden.",
    prompt: "Vertical 4:5 realistic Nordic parking-to-city flow, generic parking app, verified event to reward to next behaviour, canonical Parky exact reference.",
    tags: ["linkedin", "autumn-2026", "parking", "behaviour"],
  },
  {
    n: "004",
    date: "2026-09-23T08:15:00+02:00",
    title: "23/9 — Belöningen kan stanna lokalt",
    asset: "Höstserie 04 — Lokalt värde",
    copy: "En belöning behöver inte lämna platsen där beteendet sker.\n\nTänk en verifierad aktivitet som leder till ett lokalt värde: kaffe, kultur, handel, föreningsstöd eller en annan relevant förmån.\n\nFör kommunen eller destinationen betyder det att beteendeförändring och lokal nytta kan byggas ihop i samma pilot.\n\nParkKey™ kan vara lagret som binder samman händelsen, belöningen och uppföljningen.\n\n#LocalCommerce #PlaceMaking #ParkKey #Rewards",
    headline: "Belöningen kan stanna lokalt.",
    alt: "Person använder en ParkKey-belöning i lokal handel efter en verifierad aktivitet.",
    prompt: "Vertical 4:5 cinematic Nordic town centre, local independent commerce, subtle ParkKey reward, no invented merchant logo, canonical Parky.",
    tags: ["linkedin", "autumn-2026", "local-commerce"],
  },
  {
    n: "005",
    date: "2026-09-25T08:15:00+02:00",
    title: "25/9 — Börja med en smal pilot",
    asset: "Höstserie 05 — Låg-risk pilot",
    copy: "Ni behöver inte börja stort.\n\nEn bra ParkKey™-pilot kan börja med:\n• ett tydligt beteende\n• en befintlig digital ingång\n• en enkel belöning\n• 2–4 KPI:er\n• en avgränsad period\n\nDet gör det möjligt att testa värdet innan man skalar.\n\nMålet är inte fler funktioner. Målet är ett mätbart svar på frågan: förändrar belöningen beteendet?\n\n#Pilot #Municipality #Mobility #ParkKey",
    headline: "Börja med en smal pilot.",
    alt: "Nordisk stadsmiljö med en enkel visualisering av en avgränsad ParkKey-pilot.",
    prompt: "Vertical 4:5 premium Nordic civic scene with a restrained five-step pilot path, no unverified ROI or CO2 claims.",
    tags: ["linkedin", "autumn-2026", "municipality", "pilot"],
  },
  {
    n: "006",
    date: "2026-09-28T08:15:00+02:00",
    title: "28/9 — Samma app. Mer värde.",
    asset: "Höstserie 06 — Samma app mer värde",
    copy: "För en mobilitetsoperatör ska ParkKey™ inte bli ännu ett system som konkurrerar om kunden.\n\nVår utgångspunkt är enklare:\n\nOperatörens app fortsätter äga kundresan.\nDen verifierade händelsen finns redan.\nParkKey lägger till belöningen och beteendelogiken efteråt.\n\nSamma app. Mer värde.\n\nDet är den integrationsprincip vi vill testa tillsammans med fler operatörer.\n\n#MobilityOperator #Parking #PublicTransport #ParkKey",
    headline: "Samma app. Mer värde.",
    alt: "Befintlig mobilitetsapp är huvudupplevelsen medan ParkKey lägger till ett belöningslager.",
    prompt: "Vertical 4:5 premium mobility ad, clean generic operator app remains primary, subtle ParkKey reward layer after verified event, no fake operator logo.",
    tags: ["linkedin", "autumn-2026", "mobility-operator"],
  },
  {
    n: "007",
    date: "2026-09-30T08:15:00+02:00",
    title: "30/9 — Det som belönas ska kunna följas upp",
    asset: "Höstserie 07 — CoreOS mätbarhet",
    copy: "Belöningar är enkla att prata om. Effekten är svårare.\n\nDärför bygger vi ParkKey™ runt verifierade händelser och tydlig uppföljning.\n\nI en pilot vill vi kunna se vad som faktiskt hänt: vilka definierade events som verifierats, hur belöningen används och vilka KPI:er som rör sig.\n\nCoreOS är vårt operativa lager för att hålla ihop pilot, uppföljning och bevis — utan att kalla mål för resultat.\n\nMät först. Skala sedan.\n\n#Data #CoreOS #Mobility #ParkKey",
    headline: "Mät först. Skala sedan.",
    alt: "Cinematisk stadsmiljö med ett återhållsamt CoreOS-lager för verifierade händelser och KPI-uppföljning.",
    prompt: "Vertical 4:5 Nordic mobility scene with restrained CoreOS proof layer; event verification and KPI framework without fabricated values.",
    tags: ["linkedin", "autumn-2026", "coreos", "measurement"],
  },
  {
    n: "008",
    date: "2026-10-02T08:15:00+02:00",
    title: "2/10 — Vilket beteende vill ni förändra?",
    asset: "Höstserie 08 — Pilotinbjudan",
    copy: "Om ni fick välja ett beteende att påverka de kommande 8–12 veckorna — vilket skulle det vara?\n\nFärre korta bilresor?\nFler som går sista biten?\nMer kollektivtrafik?\nBättre användning av parkering?\nMer lokal aktivitet?\n\nDet är där vi vill börja. Inte med en stor plattformspresentation, utan med ett konkret problem, en befintlig digital ingång och en pilot som går att mäta.\n\nSkriv gärna till mig eller besök parkkey.org.\n\n#ParkKey #Pilot #Mobility #SmartCity",
    headline: "Vilket beteende vill ni förändra?",
    alt: "Nordisk stad med flera mobilitetsval och en tydlig ParkKey-inbjudan till pilotdialog.",
    prompt: "Vertical 4:5 cinematic Nordic autumn city with several natural mobility choices, canonical Parky and ParkKey, one clear pilot CTA.",
    tags: ["linkedin", "autumn-2026", "pilot", "cta"],
  },
] as const;

const postId = (n: string) => `b1600000-0000-4000-8000-000000000${n}`;
const assetId = (n: string) => `a1600000-0000-4000-8000-000000000${n}`;
const scheduleId = (n: string) => `c1600000-0000-4000-8000-000000000${n}`;

/**
 * Materializes the editorial series only when rows are absent.
 * Existing rows are never updated, so real provider evidence / publication state cannot be overwritten.
 */
export async function ensureLinkedInAutumnSeries2026(db: any, userId: string) {
  const ids = entries.map((entry) => postId(entry.n));
  const existing = await db.from("social_posts").select("id").in("id", ids);
  if (existing.error) throw new Error(existing.error.message);
  const existingIds = new Set((existing.data ?? []).map((row: { id: string }) => row.id));
  const missing = entries.filter((entry) => !existingIds.has(postId(entry.n)));
  if (missing.length === 0) return { created: 0 };

  const assetRows = missing.map((entry) => ({
    id: assetId(entry.n),
    name: entry.asset,
    kind: "image-brief",
    category: "social",
    storage_path: null,
    tags: entry.tags,
    usage_rights: "ParkKey-owned creative brief",
    source_notes: "Approved ParkKey logo and canonical Parky only; no unverified partner logos or claims.",
    approval_status: "PLANNED — ASSET REQUIRED",
    campaign: CAMPAIGN,
    notes: "Target format 4:5. Replace/complete with a real approved asset before publish attempt.",
    created_by: userId,
  }));
  const assets = await db.from("media_assets").insert(assetRows);
  if (assets.error && assets.error.code !== "23505") throw new Error(assets.error.message);

  const postRows = missing.map((entry) => ({
    id: postId(entry.n),
    title: entry.title,
    network: "LinkedIn",
    objective: "ParkKey LinkedIn autumn editorial series",
    audience: "Municipalities, mobility operators and ParkKey pilot partners",
    campaign: CAMPAIGN,
    channel: "linkedin",
    aspect_ratio: "4:5",
    cta: "Läs mer och prata pilot via parkkey.org",
    utm: `utm_source=linkedin&utm_medium=organic&utm_campaign=autumn_2026&utm_content=${entry.n}`,
    copy_sv: entry.copy,
    headline: entry.headline,
    overlay_copy: entry.headline.toUpperCase(),
    image_prompt: entry.prompt,
    negative_prompt: "No fake partner logos, no redesigned Parky, no fabricated statistics, no fake provider evidence.",
    alt_text: entry.alt,
    claim_check: "Editorial/proposed content only; no achieved-result claim.",
    crop_presets: ["1:1", "4:5", "16:9", "9:16"],
    status: SCHEDULE_STATUS,
    truth_label: "PROPOSED",
    tags: entry.tags,
    created_by: userId,
  }));
  const posts = await db.from("social_posts").insert(postRows);
  if (posts.error && posts.error.code !== "23505") throw new Error(posts.error.message);

  const links = await db.from("social_post_assets").insert(
    missing.map((entry) => ({
      post_id: postId(entry.n),
      media_asset_id: assetId(entry.n),
      sort_order: 0,
      alt_text: entry.alt,
    })),
  );
  if (links.error && links.error.code !== "23505") throw new Error(links.error.message);

  const schedules = await db.from("social_schedules").insert(
    missing.map((entry) => ({
      id: scheduleId(entry.n),
      post_id: postId(entry.n),
      scheduled_at: entry.date,
      timezone: "Europe/Stockholm",
      status: SCHEDULE_STATUS,
      notes: "Editorial schedule only. Never mark PUBLISHED without verified LinkedIn provider post ID/URL.",
      created_by: userId,
    })),
  );
  if (schedules.error && schedules.error.code !== "23505") throw new Error(schedules.error.message);

  return { created: missing.length };
}
