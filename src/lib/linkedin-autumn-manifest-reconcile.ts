import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const CAMPAIGN = "Höstserien — Samma app. Mer värde.";
const ASSET_BASE = "https://parkkey-filmcraft-studio.parkkey-coreos-nordic-2026.workers.dev/linkedin/autumn-2026";
const ACTIVE = new Set(["001", "002", "003", "004", "006"]);

const cards = [
  ["001", "2026-09-16T17:30:00+02:00", "Samma app. Mer värde.", "01_samma_app_mer_varde.png", "01_samma_app_mer_varde.jpg", "Du behöver inte be människor ändra hela sin vardag för att skapa förändring. ParkKey™ lägger belöningen ovanpå rese- och parkeringsflöden som redan används. Samma app. Mer värde. Ingen ny app. Bara belöningen."],
  ["002", "2026-09-18T08:15:00+02:00", "En verifierad händelse.", "02_verifierad_handelse.png", "02_verifierad_handelse.jpg", "När en resa, parkering, promenad eller annan vald aktivitet verifieras kan ParkKey™ använda just den information som behövs för pilotens regel — inte mer. Händelsen blir startpunkten för belöning och mätbar effekt."],
  ["003", "2026-09-21T08:15:00+02:00", "Parky™ visar belöningen.", "03_parky_visar_beloningen.png", "03_parky_visar_beloningen.jpg", "Efter den verifierade händelsen kommer belöningen. Parky™ gör nästa steg enkelt och synligt i den befintliga kundresan. Små val kan få ett tydligt värde — utan ännu en app att ladda ner."],
  ["004", "2026-09-23T08:15:00+02:00", "Belöningen blir lokal.", "04_beloningen_blir_lokal.png", "04_beloningen_blir_lokal.jpg", "Belöningen kan styras till sådant som gör skillnad lokalt: caféer, butiker, restauranger, upplevelser eller föreningar. Invånaren får ett konkret värde samtidigt som mer av aktiviteten stannar i det lokala ekosystemet."],
  ["005", "2026-09-25T08:15:00+02:00", "Näringslivet får mer värde.", "05_naringslivet_far_mer_varde.png", null, "När invånarnas belöningar möter det lokala näringslivet skapas en ny koppling mellan mobilitet och lokal handel. ParkKey™ kan göra deltagandet mätbart utan att näringsidkaren behöver bygga ett nytt tekniskt system."],
  ["006", "2026-09-28T08:15:00+02:00", "CoreOS™ bevisar effekten.", "06_coreos_bevisar_effekten.png", "06_coreos_bevisar_effekten.jpg", "CoreOS™ samlar pilotens verifierbara signaler: deltagande, belöningshändelser, redemption och andra överenskomna KPI:er. Resultat ska alltid skiljas från mål, exempel och hypoteser. Först pilot. Sedan proof. Därefter beslut om skala."],
  ["007", "2026-10-02T08:15:00+02:00", "Invånare + Näringsliv + Kommun.", "07_invanare_naringsliv_kommun.png", null, "Det är samspelet som är poängen. Invånaren får ett värde. Näringslivet får relevant lokal aktivitet. Kommunen och mobilitetspartnern får ett sätt att mäta vad som faktiskt händer. ParkKey™ är systemet. Parky™ ger belöningen. CoreOS™ bevisar effekten."],
] as const;

const postId = (n: string) => `b1600000-0000-4000-8000-000000000${n}`;
const assetId = (n: string) => `a1600000-0000-4000-8000-000000000${n}`;
const scheduleId = (n: string) => `c1600000-0000-4000-8000-000000000${n}`;

export async function reconcileSuppliedAutumnManifest(db: SupabaseClient<Database>) {
  let reconciled = 0;
  for (const [n, date, title, sourceAsset, deployedAsset, copy] of cards) {
    const current = await db.from("social_posts").select("status,linkedin_post_id").eq("id", postId(n)).maybeSingle();
    if (current.error) throw new Error(current.error.message);
    if (!current.data || current.data.status === "PUBLISHED" || current.data.linkedin_post_id) continue;

    const enabled = ACTIVE.has(n);
    const status = enabled ? "SCHEDULED" : "HOLD — IMAGE REWORK";
    const post = await db.from("social_posts").update({
      title,
      campaign: CAMPAIGN,
      aspect_ratio: "4:3",
      copy_sv: copy,
      headline: title,
      overlay_copy: title,
      status,
      truth_label: "PROPOSED",
    }).eq("id", postId(n));
    if (post.error) throw new Error(post.error.message);

    const asset = await db.from("media_assets").update({
      name: sourceAsset,
      kind: enabled ? "image" : "image-brief",
      storage_path: enabled && deployedAsset ? `${ASSET_BASE}/${deployedAsset}` : null,
      mime_type: enabled ? "image/jpeg" : null,
      approval_status: enabled ? "APPROVED" : "HOLD — IMAGE REWORK",
      campaign: CAMPAIGN,
      source_notes: `Supplied manifest asset: ${sourceAsset}`,
    }).eq("id", assetId(n));
    if (asset.error) throw new Error(asset.error.message);

    const schedule = await db.from("social_schedules").update({
      scheduled_at: date,
      timezone: "Europe/Stockholm",
      status,
      notes: enabled
        ? "Approved supplied card. Never mark PUBLISHED without verified LinkedIn provider ID/URL."
        : "Explicit hold by project owner: card excluded until replacement image is approved.",
    }).eq("id", scheduleId(n));
    if (schedule.error) throw new Error(schedule.error.message);
    reconciled += 1;
  }

  const oldEight = await db.from("social_posts").select("status,linkedin_post_id").eq("id", postId("008")).maybeSingle();
  if (!oldEight.error && oldEight.data && oldEight.data.status !== "PUBLISHED" && !oldEight.data.linkedin_post_id) {
    await db.from("social_posts").update({ status: "RETIRED — REPLACED BY 7-CARD MANIFEST" }).eq("id", postId("008"));
    await db.from("social_schedules").update({ status: "HOLD — RETIRED", notes: "Replaced by supplied 7-card autumn manifest." }).eq("id", scheduleId("008"));
  }
  return { reconciled };
}
