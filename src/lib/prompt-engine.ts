import { GLOBAL_NEGATIVE_LIST, MESSAGE_BANK, QA_GATE_ITEMS } from "./parkkey-rules";
import {
  STORYBOARD_ASSET_URL,
  storyboardContinuityBlock,
  storyboardMasterBlock,
  storyboardMusicBlock,
  storyboardNegativeBlock,
  storyboardQaBlock,
  storyboardSceneBlock,
  storyboardShotListRows,
} from "./storyboard-reference";

export type FilmBrief = {
  title: string;
  campaign: string | null;
  goal: string | null;
  audience: string | null;
  duration_seconds: number;
  aspect_ratio: string;
  resolution: string;
  fps: number;
  channel: string | null;
  cta: string | null;
  visual_mood: string | null;
  location_time: string | null;
  parky_usage: string | null;
  device_interaction: string | null;
  music_direction: string | null;
  voice_enabled: boolean;
  subtitles_enabled: boolean;
  sfx_enabled: boolean;
  reference_media: string | null;
  notes: string | null;
  truth_label: string | null;
  /** True when the uploaded canonical storyboard governs this film. */
  storyboard_locked?: boolean;
};

export type GeneratedDoc = {
  kind: "master" | "storyboard" | "shotlist" | "continuity" | "music" | "negative" | "export_qa";
  title: string;
  content: string;
};

const val = (v?: string | null, fallback = "Ej angivet") =>
  v && v.trim().length > 0 ? v.trim() : fallback;

function sceneCount(duration: number) {
  if (duration <= 6) return 3;
  if (duration <= 15) return 5;
  if (duration <= 30) return 7;
  if (duration <= 35) return 8;
  return 9;
}

function sceneSkeleton(duration: number) {
  const beats = [
    {
      purpose: "Familiar mobility moment — establish the real place and the person",
      camera: "slow gimbal push-in, shallow depth",
    },
    {
      purpose: "The existing app/system already in the person's hand",
      camera: "over-shoulder tracking, natural hand movement",
    },
    {
      purpose: "The defined activity begins — real interaction, no explanatory card",
      camera: "handheld-stabilised close on device + face",
    },
    {
      purpose: "Progress through the activity — foreground life passes through frame",
      camera: "lateral dolly, foreground wipe",
    },
    {
      purpose: "Verified state — the event is confirmed on screen",
      camera: "locked close-up with micro-movement",
    },
    {
      purpose: "Parky reward reveal — guidance and positive reinforcement",
      camera: "arc move around subject, light bloom motivated by sun",
    },
    {
      purpose: "Local/community value — the reward lands in real life",
      camera: "wider tracking shot, natural street depth",
    },
    { purpose: "Human beat — reaction, warmth, no dialogue needed", camera: "slow rise, backlit" },
    {
      purpose: "Clean branded end frame — correct ParkKey logo + single CTA",
      camera: "settle to static with subtle parallax",
    },
  ];
  const n = sceneCount(duration);
  const picked = n >= beats.length ? beats : [...beats.slice(0, n - 1), beats[beats.length - 1]!];
  const per = duration / picked.length;
  let t = 0;
  return picked.map((b, i) => {
    const start = t;
    const end = i === picked.length - 1 ? duration : Math.round((t + per) * 10) / 10;
    t = end;
    return { index: i + 1, start, end, ...b };
  });
}

function audioLine(brief: FilmBrief) {
  const parts = [
    brief.voice_enabled
      ? "Voiceover: ON — write only lines that are true and approved."
      : "Voiceover: OFF — no narration, no dialogue.",
    brief.subtitles_enabled
      ? "Subtitles: ON — exactly one caption layer, synchronised, high contrast, short lines."
      : "Subtitles: OFF — no caption layer at all; carry meaning through action and UI.",
    brief.sfx_enabled
      ? "SFX: ON — natural, diegetic sound only (steps, city, paper, fabric)."
      : "SFX: OFF — no sound effects, no UI blips, no chimes.",
  ];
  return parts.join("\n");
}

export function generateDocuments(brief: FilmBrief): GeneratedDoc[] {
  const scenes = sceneSkeleton(brief.duration_seconds);
  const sb = brief.storyboard_locked === true;
  const spec = `${brief.aspect_ratio} · ${brief.resolution} · ${brief.fps} fps · H.264 MP4 master · ${brief.duration_seconds}s`;

  const master = `# MASTER PRODUCTION PROMPT — ${brief.title}
CAMPAIGN: ${val(brief.campaign)}
TRUTH LABEL: ${val(brief.truth_label, "DEMO")}
DELIVERY SPEC: ${spec}
CHANNEL: ${val(brief.channel)}
${sb ? `\n${storyboardMasterBlock()}\n` : ""}


## OBJECTIVE
${val(brief.goal, "Show ParkKey as the reward layer inside a system people already use.")}

## AUDIENCE
${val(brief.audience)}

## PARKKEY PRODUCT TRUTH (non-negotiable)
- ParkKey™ is a modular intelligent reward layer for verified mobility and related activities.
- Distribution is through apps and systems people already use. "Same app. More value."
- Promise: "No new app. Just the reward."
- Parky™ is the reward-facing guide and reward moment — never a decorative sticker.
- CoreOS™ is the operating and proof layer. Proof starts from a defined verifiable event.
- Never depict a required standalone ParkKey consumer app, a separate ParkKey end-user login,
  or ParkKey replacing the operator's payment or customer relationship.

## STORY ARC
familiar mobility moment → existing app/system → defined activity → verified state →
Parky reward reveal → local/community value → proof or next action → closing proposition.

## LOCATION / TIME
${val(brief.location_time)}

## VISUAL MOOD
${val(brief.visual_mood, "Nordic, cinematic, premium, human. Directional natural light, real depth, human scale.")}
Brand frame: Forest Green #0F3D2E, Park Green #8CC63E, Pale Cream #F5F5EB, Graphite #1E1E1E,
Montserrat for any on-screen brand typography. Premium midnight and restrained gold warmth allowed.

## DEVICE / PRODUCT INTERACTION
${val(brief.device_interaction)}
Interaction must be plausible: one tap changes state, scan gives an immediate response,
no fake typing, no repeated poking at the screen.

## PARKY USAGE
${val(brief.parky_usage, "Parky guides the moment: blinking, eye-line toward the interaction, body motion and hand gestures.")}
Parky must stay canonical and identical in every shot.

## MOTION DIRECTION
Real motion, live-action feel: longer tracking, dolly and gimbal moves, walking, looking,
natural hand movement. Transitions motivated by movement, light or foreground wipes.

## MUSIC DIRECTION
${val(brief.music_direction)}

## AUDIO / ACCESSIBILITY TOGGLES
${audioLine(brief)}

## ON-SCREEN TEXT RULES
- Only exact, readable text. No pseudo-text.
- One dominant message per frame. No duplicated headlines, logos or CTAs.
- Safe margins hold for every target crop (16:9, 1:1, 4:5, 9:16).

## CTA
${val(brief.cta)}
Approved message bank (use selectively): ${MESSAGE_BANK.join(" | ")}

## REFERENCES
${val(brief.reference_media, "Inga referenser bifogade.")}

## NOTES
${val(brief.notes, "—")}
`;

  const storyboard = sb
    ? `# STORYBOARD — ${brief.title}
Genererad från den uppladdade canonical storyboarden: ${STORYBOARD_ASSET_URL}
9 scener · totalt ${brief.duration_seconds}s · ${spec} · mobil-först regi

${storyboardSceneBlock()}
`
    : `# STORYBOARD — ${brief.title}
${scenes.length} scenes · total ${brief.duration_seconds}s · ${spec}

${scenes
  .map(
    (s) => `## Scene ${s.index} — ${s.start}s–${s.end}s
Purpose: ${s.purpose}
Camera: ${s.camera}
Frame: ${val(brief.location_time, "Real environment, natural depth")}
Device/UI: ${val(brief.device_interaction, "Real, readable interface state")}
Parky: ${s.index >= scenes.length - 3 ? "Present and reacting — blink, eye-line, gesture" : "Present as guide where it advances the story"}
Text on screen: ${s.index === scenes.length ? `Brand end frame — correct ParkKey™ logo + single CTA: ${val(brief.cta)}` : "Only exact UI text visible in the scene"}
Transition out: ${s.index === scenes.length ? "hold" : "motivated by movement, light or foreground wipe — cut on a musical beat"}`,
  )
  .join("\n\n")}
`;

  const shotlist = sb
    ? `# SHOT LIST — ${brief.title}
Byggd rad för rad på den uppladdade storyboarden (${STORYBOARD_ASSET_URL}), omregisserad mobil-först.

| # | Dur | Kamera | Handling (mobil-först) | Parky | UI / text | Musikcue | Övergång |
|---|-----|--------|------------------------|-------|-----------|----------|----------|
${storyboardShotListRows()}

Frame rate ${brief.fps} fps. Master ${brief.resolution} (${brief.aspect_ratio}).
Klippen ligger på 3/6/10/14/18/23/28/32s och varje klipp landar på ett musikaliskt nedslag.
`
    : `# SHOT LIST — ${brief.title}
| # | Dur | Camera | Action | Parky | UI / Text | Music cue | Transition |
|---|-----|--------|--------|-------|-----------|-----------|------------|
${scenes
  .map(
    (s) =>
      `| ${s.index} | ${Math.round((s.end - s.start) * 10) / 10}s | ${s.camera} | ${s.purpose} | ${
        s.index >= scenes.length - 3 ? "Reacting, gesturing" : "Guiding"
      } | ${s.index === scenes.length ? "Logo + CTA" : "Real UI state"} | ${
        s.index === 1
          ? "intro motif"
          : s.index === scenes.length
            ? "final hook resolve"
            : "on-beat cut"
      } | ${s.index === scenes.length ? "hold" : "motion/light wipe"} |`,
  )
  .join("\n")}

Frame rate ${brief.fps} fps. Master ${brief.resolution} (${brief.aspect_ratio}).
Every cut lands on a musical beat. No cut is a substitute for missing motion.
`;

  const continuity = `# CONTINUITY BIBLE — ${brief.title}
Lock the following across every shot. Generative drift is a QA failure.

1. MAIN CHARACTER: same face, hair, wardrobe, bag and shoes in every shot.
2. PARKY™: canonical design — identical proportions, key silhouette, eye size, blink behaviour,
   fur/surface treatment and colour (Park Green #8CC63E body, Forest Green #0F3D2E depth).
3. DEVICE: same device model, same case, same orientation, same UI theme and same battery/time state.
4. UI: identical typography (Montserrat), identical component styling, identical wording between shots.
5. LOCATION/TIME: consistent sun direction, weather, season and time progression.
6. TYPOGRAPHY / CAPTIONS: one treatment, one layer, consistent safe margins.
7. REWARD VALUE: the same reward amount/rule in every shot of this scenario.
8. BRAND: only the correct ParkKey™ logo lockup. No alternative or reconstructed logo.
${sb ? `\n${storyboardContinuityBlock()}\n` : ""}`;

  const music = `# MUSIC BRIEF — ${brief.title}
DIRECTION: ${val(brief.music_direction, "Warm, real, premium advertising music.")}

STRUCTURE (total ${brief.duration_seconds}s)
- Intro (0–${Math.round(brief.duration_seconds * 0.15)}s): single warm instrument states the motif.
- Build (${Math.round(brief.duration_seconds * 0.15)}–${Math.round(brief.duration_seconds * 0.5)}s): add rhythm and warm bass under the interaction.
- Hook / reward (${Math.round(brief.duration_seconds * 0.5)}–${Math.round(brief.duration_seconds * 0.8)}s): the memorable melodic hook lands on the reward moment.
- Resolve (${Math.round(brief.duration_seconds * 0.8)}–${brief.duration_seconds}s): hook resolves under the branded end frame.

BEAT MAP: every scene change cuts on a beat. The reward reveal sits on the strongest downbeat.

FORBIDDEN: drone pads, synth plinks, tech chimes, digital beeps, synthetic corporate music.

AUDIO TOGGLES
${audioLine(brief)}
${sb ? `\n${storyboardMusicBlock()}\n` : ""}`;

  const negative = `# NEGATIVE PROMPT / AVOID LIST — ${brief.title}
${GLOBAL_NEGATIVE_LIST.map((n) => `- ${n}`).join("\n")}
${brief.voice_enabled ? "" : "- no voiceover, no narration, no dialogue\n"}${
    brief.subtitles_enabled ? "" : "- no subtitles, no caption layer\n"
  }${brief.sfx_enabled ? "" : "- no sound effects of any kind\n"}${
    sb ? `\n## STORYBOARD-SPECIFIKT (låst referens)\n${storyboardNegativeBlock()}\n` : ""
  }`;

  const exportQa = `# EXPORT SPECIFICATION + QA CHECKLIST — ${brief.title}

## EXPORT
- Master: ${brief.resolution}, ${brief.aspect_ratio}, ${brief.fps} fps, H.264 MP4.
- Duration: ${brief.duration_seconds}s.
- Multi-format survival: keep critical UI and text inside safe zones for 16:9, 1:1, 4:5 and 9:16.
- No black bars added to reach a crop.

## QA GATE (all items must pass before export)
${QA_GATE_ITEMS.map((i) => `- [ ] ${i.label} (${i.source})`).join("\n")}
${sb ? `\n${storyboardQaBlock()}\n` : ""}


## TRUTH GATE
Truth label for this film: ${val(brief.truth_label, "DEMO")}.
Label anything simulated. Green/approved status requires positive verification, not assumption.
`;

  return [
    { kind: "master", title: "Masterprompt", content: master },
    { kind: "storyboard", title: "Storyboard", content: storyboard },
    { kind: "shotlist", title: "Shot list", content: shotlist },
    { kind: "continuity", title: "Kontinuitetsbibel", content: continuity },
    { kind: "music", title: "Musikbrief", content: music },
    { kind: "negative", title: "Negativ prompt / undvik-lista", content: negative },
    { kind: "export_qa", title: "Export + QA-checklista", content: exportQa },
  ];
}
