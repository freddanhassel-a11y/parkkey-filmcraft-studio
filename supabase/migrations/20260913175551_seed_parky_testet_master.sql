
DO $seed$
DECLARE v_project UUID; v_version UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.film_projects WHERE title = $md$Parky-testet — AAA/Guldägget master$md$) THEN RETURN; END IF;

  INSERT INTO public.film_projects (
    title, campaign, goal, audience, channel, cta, visual_mood, location_time, parky_usage, device_interaction, music_direction, reference_media, notes,
    duration_seconds, aspect_ratio, resolution, fps,
    voice_enabled, subtitles_enabled, sfx_enabled,
    status, truth_label, tags, is_favorite
  ) VALUES (
    $md$Parky-testet — AAA/Guldägget master$md$,
    $md$Parky-testet 2026$md$,
    $md$Visa hela ParkKey-mekaniken i en verklig mobilinteraktion: en person genomför Parky-testet i mobilen, får belöningsmomentet av Parky och landar i lokalt värde — utan voiceover eller undertexter.$md$,
    $md$Reklamjury (Guldägget), invånare i nordiska städer, mobilitetsoperatörer och kommuner som bedömer ParkKey som belöningslager.$md$,
    $md$Tävlingsbidrag, ParkKey.org, YouTube, investerar- och kundmöten$md$,
    $md$STARTA PARKY-TESTET — ParkKey.org/test$md$,
    $md$Solig nordisk höst, premium cinematiskt, varmt motljus, guldigt lövverk, ParkKey forest green och park green i miljö och gränssnitt, mjuk glas-UI endast där texten är läsbar. Nordiskt, mänskligt, agency-grade — aldrig generisk neon-SaaS.$md$,
    $md$Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.$md$,
    $md$Kanonisk Parky som animerad AI-assistent i mobilen: guidar genom testet, blinkar, håller ögonkontakt med användaren via skärmen, reagerar med kroppsrörelse och gester, levererar belöningsmomentet. Identiska proportioner och design i varje scen. Ingen dekorativ sticker-användning.$md$,
    $md$MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.$md$,
    $md$Varm, verklig premiumreklamsmusik: akustiskt piano, dämpad nylonsträngad gitarr, mjuka live-trummor och percussion, varm bas, mycket sparsam stråkpad. Minnesvärd melodisk hook/jingle som återkommer. Klipp på musikaliska slag. Absolut inga drones, synth-plink, tech-chimes eller digitala pip.$md$,
    $md$Godkänd storyboard (9 rutor, solig nordisk höststad, slutbild STARTA PARKY-TESTET / ParkKey.org/test), Parky canonical reference, ParkKey primärlogotyp, musikreferens: varm akustisk premiumreklam.$md$,
    $md$Storyboardens stämning och scenlogik bevaras, men slutfilmen är mobil-först och mer dynamisk än den laptopbaserade storyboarden. Verklig rörelse och live-action-känsla: tracking, dolly, gimbal, gående, tryckande och scrollande händer. Övergångar motiveras av rörelse, ljus eller förgrundssvep — aldrig bildspel eller Ken Burns. Visa den verkliga interaktionsresan i stället för förklarande textkort.$md$,
    35, '16:9', '1920x1080', 30,
    false, false, false,
    'PROMPT READY', 'DEMO',
    '{"parky-test","guldägget","mobile-first","nordic-autumn"}', true
  ) RETURNING id INTO v_project;

  INSERT INTO public.film_versions (project_id, version_label, changelog, status)
  VALUES (v_project, 'V1', $md$V1 master: mobil-först tolkning av godkänd storyboard. Dynamisk live-action-känsla, kanonisk Parky som guide, ingen voiceover/undertext/SFX, varm akustisk premiummusik med melodisk hook.$md$, 'PROMPT READY')
  RETURNING id INTO v_version;

  INSERT INTO public.prompts (project_id, version_id, kind, title, content) VALUES
  (v_project, v_version, 'master', $md$Masterprompt$md$, $md$# MASTER PRODUCTION PROMPT — Parky-testet — AAA/Guldägget master
CAMPAIGN: Parky-testet 2026
TRUTH LABEL: DEMO
DELIVERY SPEC: 16:9 · 1920x1080 · 30 fps · H.264 MP4 master · 35s
CHANNEL: Tävlingsbidrag, ParkKey.org, YouTube, investerar- och kundmöten

## OBJECTIVE
Visa hela ParkKey-mekaniken i en verklig mobilinteraktion: en person genomför Parky-testet i mobilen, får belöningsmomentet av Parky och landar i lokalt värde — utan voiceover eller undertexter.

## AUDIENCE
Reklamjury (Guldägget), invånare i nordiska städer, mobilitetsoperatörer och kommuner som bedömer ParkKey som belöningslager.

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
Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.

## VISUAL MOOD
Solig nordisk höst, premium cinematiskt, varmt motljus, guldigt lövverk, ParkKey forest green och park green i miljö och gränssnitt, mjuk glas-UI endast där texten är läsbar. Nordiskt, mänskligt, agency-grade — aldrig generisk neon-SaaS.
Brand frame: Forest Green #0F3D2E, Park Green #8CC63E, Pale Cream #F5F5EB, Graphite #1E1E1E,
Montserrat for any on-screen brand typography. Premium midnight and restrained gold warmth allowed.

## DEVICE / PRODUCT INTERACTION
MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Interaction must be plausible: one tap changes state, scan gives an immediate response,
no fake typing, no repeated poking at the screen.

## PARKY USAGE
Kanonisk Parky som animerad AI-assistent i mobilen: guidar genom testet, blinkar, håller ögonkontakt med användaren via skärmen, reagerar med kroppsrörelse och gester, levererar belöningsmomentet. Identiska proportioner och design i varje scen. Ingen dekorativ sticker-användning.
Parky must stay canonical and identical in every shot.

## MOTION DIRECTION
Real motion, live-action feel: longer tracking, dolly and gimbal moves, walking, looking,
natural hand movement. Transitions motivated by movement, light or foreground wipes.

## MUSIC DIRECTION
Varm, verklig premiumreklamsmusik: akustiskt piano, dämpad nylonsträngad gitarr, mjuka live-trummor och percussion, varm bas, mycket sparsam stråkpad. Minnesvärd melodisk hook/jingle som återkommer. Klipp på musikaliska slag. Absolut inga drones, synth-plink, tech-chimes eller digitala pip.

## AUDIO / ACCESSIBILITY TOGGLES
Voiceover: OFF — no narration, no dialogue.
Subtitles: OFF — no caption layer at all; carry meaning through action and UI.
SFX: OFF — no sound effects, no UI blips, no chimes.

## ON-SCREEN TEXT RULES
- Only exact, readable text. No pseudo-text.
- One dominant message per frame. No duplicated headlines, logos or CTAs.
- Safe margins hold for every target crop (16:9, 1:1, 4:5, 9:16).

## CTA
STARTA PARKY-TESTET — ParkKey.org/test
Approved message bank (use selectively): No new app. Just the reward. | Same app. More value. | ParkKey™ is the system. Parky™ gives you the reward. CoreOS™ proves the impact. | Pilot → Proof → Scale. | Start narrow. Prove value. Scale what works.

## REFERENCES
Godkänd storyboard (9 rutor, solig nordisk höststad, slutbild STARTA PARKY-TESTET / ParkKey.org/test), Parky canonical reference, ParkKey primärlogotyp, musikreferens: varm akustisk premiumreklam.

## NOTES
Storyboardens stämning och scenlogik bevaras, men slutfilmen är mobil-först och mer dynamisk än den laptopbaserade storyboarden. Verklig rörelse och live-action-känsla: tracking, dolly, gimbal, gående, tryckande och scrollande händer. Övergångar motiveras av rörelse, ljus eller förgrundssvep — aldrig bildspel eller Ken Burns. Visa den verkliga interaktionsresan i stället för förklarande textkort.
$md$),
  (v_project, v_version, 'storyboard', $md$Storyboard$md$, $md$# STORYBOARD — Parky-testet — AAA/Guldägget master
8 scenes · total 35s · 16:9 · 1920x1080 · 30 fps · H.264 MP4 master · 35s

## Scene 1 — 0s–4.4s
Purpose: Familiar mobility moment — establish the real place and the person
Camera: slow gimbal push-in, shallow depth
Frame: Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.
Device/UI: MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Parky: Present as guide where it advances the story
Text on screen: Only exact UI text visible in the scene
Transition out: motivated by movement, light or foreground wipe — cut on a musical beat

## Scene 2 — 4.4s–8.8s
Purpose: The existing app/system already in the person's hand
Camera: over-shoulder tracking, natural hand movement
Frame: Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.
Device/UI: MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Parky: Present as guide where it advances the story
Text on screen: Only exact UI text visible in the scene
Transition out: motivated by movement, light or foreground wipe — cut on a musical beat

## Scene 3 — 8.8s–13.2s
Purpose: The defined activity begins — real interaction, no explanatory card
Camera: handheld-stabilised close on device + face
Frame: Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.
Device/UI: MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Parky: Present as guide where it advances the story
Text on screen: Only exact UI text visible in the scene
Transition out: motivated by movement, light or foreground wipe — cut on a musical beat

## Scene 4 — 13.2s–17.6s
Purpose: Progress through the activity — foreground life passes through frame
Camera: lateral dolly, foreground wipe
Frame: Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.
Device/UI: MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Parky: Present as guide where it advances the story
Text on screen: Only exact UI text visible in the scene
Transition out: motivated by movement, light or foreground wipe — cut on a musical beat

## Scene 5 — 17.6s–22s
Purpose: Verified state — the event is confirmed on screen
Camera: locked close-up with micro-movement
Frame: Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.
Device/UI: MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Parky: Present and reacting — blink, eye-line, gesture
Text on screen: Only exact UI text visible in the scene
Transition out: motivated by movement, light or foreground wipe — cut on a musical beat

## Scene 6 — 22s–26.4s
Purpose: Parky reward reveal — guidance and positive reinforcement
Camera: arc move around subject, light bloom motivated by sun
Frame: Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.
Device/UI: MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Parky: Present and reacting — blink, eye-line, gesture
Text on screen: Only exact UI text visible in the scene
Transition out: motivated by movement, light or foreground wipe — cut on a musical beat

## Scene 7 — 26.4s–30.8s
Purpose: Local/community value — the reward lands in real life
Camera: wider tracking shot, natural street depth
Frame: Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.
Device/UI: MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Parky: Present and reacting — blink, eye-line, gesture
Text on screen: Only exact UI text visible in the scene
Transition out: motivated by movement, light or foreground wipe — cut on a musical beat

## Scene 8 — 30.8s–35s
Purpose: Clean branded end frame — correct ParkKey logo + single CTA
Camera: settle to static with subtle parallax
Frame: Nordisk innerstad, höst, sen förmiddag till tidig eftermiddag. Gata med kollektivtrafik, cyklister, gående, kaféentré och parkeringsyta. Löven rör sig naturligt i vinden.
Device/UI: MOBILTELEFON genom hela filmen. Verklig interaktion: huvudpersonen håller telefonen i handen, går, öppnar den app hon redan använder, skannar/startar testet, scrollar och trycker en gång per steg. Läsbart, verkligt UI — ingen pseudotext, inga påhittade partnerlogotyper.
Parky: Present and reacting — blink, eye-line, gesture
Text on screen: Brand end frame — correct ParkKey™ logo + single CTA: STARTA PARKY-TESTET — ParkKey.org/test
Transition out: hold
$md$),
  (v_project, v_version, 'shotlist', $md$Shot list$md$, $md$# SHOT LIST — Parky-testet — AAA/Guldägget master
| # | Dur | Camera | Action | Parky | UI / Text | Music cue | Transition |
|---|-----|--------|--------|-------|-----------|-----------|------------|
| 1 | 4.4s | slow gimbal push-in, shallow depth | Familiar mobility moment — establish the real place and the person | Guiding | Real UI state | intro motif | motion/light wipe |
| 2 | 4.4s | over-shoulder tracking, natural hand movement | The existing app/system already in the person's hand | Guiding | Real UI state | on-beat cut | motion/light wipe |
| 3 | 4.4s | handheld-stabilised close on device + face | The defined activity begins — real interaction, no explanatory card | Guiding | Real UI state | on-beat cut | motion/light wipe |
| 4 | 4.4s | lateral dolly, foreground wipe | Progress through the activity — foreground life passes through frame | Guiding | Real UI state | on-beat cut | motion/light wipe |
| 5 | 4.4s | locked close-up with micro-movement | Verified state — the event is confirmed on screen | Reacting, gesturing | Real UI state | on-beat cut | motion/light wipe |
| 6 | 4.4s | arc move around subject, light bloom motivated by sun | Parky reward reveal — guidance and positive reinforcement | Reacting, gesturing | Real UI state | on-beat cut | motion/light wipe |
| 7 | 4.4s | wider tracking shot, natural street depth | Local/community value — the reward lands in real life | Reacting, gesturing | Real UI state | on-beat cut | motion/light wipe |
| 8 | 4.2s | settle to static with subtle parallax | Clean branded end frame — correct ParkKey logo + single CTA | Reacting, gesturing | Logo + CTA | final hook resolve | hold |

Frame rate 30 fps. Master 1920x1080 (16:9).
Every cut lands on a musical beat. No cut is a substitute for missing motion.
$md$),
  (v_project, v_version, 'continuity', $md$Kontinuitetsbibel$md$, $md$# CONTINUITY BIBLE — Parky-testet — AAA/Guldägget master
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
$md$),
  (v_project, v_version, 'music', $md$Musikbrief$md$, $md$# MUSIC BRIEF — Parky-testet — AAA/Guldägget master
DIRECTION: Varm, verklig premiumreklamsmusik: akustiskt piano, dämpad nylonsträngad gitarr, mjuka live-trummor och percussion, varm bas, mycket sparsam stråkpad. Minnesvärd melodisk hook/jingle som återkommer. Klipp på musikaliska slag. Absolut inga drones, synth-plink, tech-chimes eller digitala pip.

STRUCTURE (total 35s)
- Intro (0–5s): single warm instrument states the motif.
- Build (5–18s): add rhythm and warm bass under the interaction.
- Hook / reward (18–28s): the memorable melodic hook lands on the reward moment.
- Resolve (28–35s): hook resolves under the branded end frame.

BEAT MAP: every scene change cuts on a beat. The reward reveal sits on the strongest downbeat.

FORBIDDEN: drone pads, synth plinks, tech chimes, digital beeps, synthetic corporate music.

AUDIO TOGGLES
Voiceover: OFF — no narration, no dialogue.
Subtitles: OFF — no caption layer at all; carry meaning through action and UI.
SFX: OFF — no sound effects, no UI blips, no chimes.
$md$),
  (v_project, v_version, 'negative', $md$Negativ prompt / undvik-lista$md$, $md$# NEGATIVE PROMPT / AVOID LIST — Parky-testet — AAA/Guldägget master
- no drone pads, synth plinks, tech chimes, digital beeps or synthetic corporate music
- no slideshow feel, no Ken Burns, no simple pan/zoom as a substitute for real motion
- no pseudo-text, no fake or unreadable UI, no lorem ipsum
- no invented partner logos or implied integrations without verified proof
- no generative character drift — Parky and the main character stay identical across every shot
- no duplicated caption layers, no duplicated logos, no duplicated CTAs
- no unverified CO2, ROI, revenue, user-reach or pilot claims
- no standalone ParkKey consumer app, no separate ParkKey end-user login, no ParkKey payment flow replacing the operator
- no neon crypto/SaaS aesthetics, no purple gradients, no generic stock-tech imagery
- no explanatory text cards replacing the real interaction journey
- no voiceover, no narration, no dialogue
- no subtitles, no caption layer
- no sound effects of any kind
$md$),
  (v_project, v_version, 'export_qa', $md$Export + QA-checklista$md$, $md$# EXPORT SPECIFICATION + QA CHECKLIST — Parky-testet — AAA/Guldägget master

## EXPORT
- Master: 1920x1080, 16:9, 30 fps, H.264 MP4.
- Duration: 35s.
- Multi-format survival: keep critical UI and text inside safe zones for 16:9, 1:1, 4:5 and 9:16.
- No black bars added to reach a crop.

## QA GATE (all items must pass before export)
- [ ] Korrekt ParkKey™-logotyp i slutbild (parkkey-brand-theme)
- [ ] Kanonisk Parky — proportioner, ögon och gestik konsekventa (parkkey-video)
- [ ] Läsbar, verklig UI-text (ingen pseudotext) (parkkey-video)
- [ ] Inga påhittade partnerlogotyper eller antydda integrationer (parkkey-truth-proof)
- [ ] Ingen generativ karaktärsdrift mellan tagningar (parkkey-video)
- [ ] Verklig rörelse — ingen slideshow-, Ken Burns- eller pan/zoom-känsla (parkkey-video)
- [ ] Inga synt-pling/tech-chimes när SFX är avstängt (parkkey-video)
- [ ] CTA korrekt och verifierad (parkkey-commercial-comms)
- [ ] Röst-, undertext- och SFX-inställningar respekterade (parkkey-accessibility-release-qa)
- [ ] Säkra marginaler håller i alla målformat (parkkey-video)
- [ ] Rätt bildförhållande och upplösning (parkkey-video)
- [ ] 30 fps och H.264 MP4-master (parkkey-video)
- [ ] DEMO/EXAMPLE-märkning där något är simulerat (parkkey-truth-proof)

## TRUTH GATE
Truth label for this film: DEMO.
Label anything simulated. Green/approved status requires positive verification, not assumption.
$md$);

  INSERT INTO public.qa_checklists (project_id, version_id, items, passed)
  VALUES (v_project, v_version, $md$[{"id":"logo","label":"Korrekt ParkKey™-logotyp i slutbild","source":"parkkey-brand-theme","checked":false},{"id":"parky","label":"Kanonisk Parky — proportioner, ögon och gestik konsekventa","source":"parkkey-video","checked":false},{"id":"ui","label":"Läsbar, verklig UI-text (ingen pseudotext)","source":"parkkey-video","checked":false},{"id":"partners","label":"Inga påhittade partnerlogotyper eller antydda integrationer","source":"parkkey-truth-proof","checked":false},{"id":"drift","label":"Ingen generativ karaktärsdrift mellan tagningar","source":"parkkey-video","checked":false},{"id":"motion","label":"Verklig rörelse — ingen slideshow-, Ken Burns- eller pan/zoom-känsla","source":"parkkey-video","checked":false},{"id":"audio","label":"Inga synt-pling/tech-chimes när SFX är avstängt","source":"parkkey-video","checked":false},{"id":"cta","label":"CTA korrekt och verifierad","source":"parkkey-commercial-comms","checked":false},{"id":"toggles","label":"Röst-, undertext- och SFX-inställningar respekterade","source":"parkkey-accessibility-release-qa","checked":false},{"id":"safe-areas","label":"Säkra marginaler håller i alla målformat","source":"parkkey-video","checked":false},{"id":"aspect","label":"Rätt bildförhållande och upplösning","source":"parkkey-video","checked":false},{"id":"codec","label":"30 fps och H.264 MP4-master","source":"parkkey-video","checked":false},{"id":"labels","label":"DEMO/EXAMPLE-märkning där något är simulerat","source":"parkkey-truth-proof","checked":false}]$md$::jsonb, false);

  INSERT INTO public.renders (project_id, version_id, provider, status, mime_type, fps, codec, width, height, duration_seconds)
  VALUES (v_project, v_version, 'manual-upload', 'NO FILE', 'video/mp4', 30, 'H.264', 1920, 1080, 35);
END
$seed$;

