import storyboardAsset from "@/assets/parky-testet-storyboard.png.asset.json";

/**
 * Canonical visual reference for "Parky-testet — AAA/Guldägget master".
 * Derived from the uploaded 9-frame storyboard (0:00–0:35).
 * The reference locks look, light, palette, Parky design and scene logic.
 * The film itself is MOBILE-FIRST even though the reference frames show a laptop.
 */
export const STORYBOARD_ASSET_URL = storyboardAsset.url;
export const STORYBOARD_ASSET_NAME = "Parky-testet — storyboard (canonical visual reference)";
export const STORYBOARD_TAG = "storyboard-locked";
export const STORYBOARD_PROJECT_TITLE = "Parky-testet — AAA/Guldägget master";

export const STORYBOARD_LOOK = {
  light:
    "Låg gyllene höstsol bakifrån/sidan (backlight + rim light), varm lensflare i kanten, mjuka löv-bokeh i förgrunden, aldrig platt overhead-ljus.",
  palette:
    "Park Green #8CC63E (Parky, CTA, UI-accenter), Forest Green #0F3D2E (logotyp, djup, kontrast), Pale Cream #F5F5EB (UI-ytor), Graphite #1E1E1E (text), bärnsten/guld i löv, sol och belöningsmyntet. Ingen neon, ingen kall blå tech-gradient.",
  environment:
    "Solig nordisk höststad: gula/orange lönnlöv, alléträd, kullersten, kaféuteserveringar, grön stadsbuss, cyklister, gående, kyrktorn och vatten i horisonten i slutbilden.",
  camera:
    "Grunt skärpedjup, 35–50 mm-känsla, ögonhöjd eller lätt underifrån på Parky, over-shoulder på device, förgrundslager (löv, axel, hand) i nästan varje bild.",
  tonality:
    "Varm, mänsklig, lågmält premium. Vuxen huvudperson i naturlig vardag, ingen överspelad reklamglädje, ingen corporate stock-känsla.",
  typography:
    "Montserrat. Ett dominant budskap per bild: 'Fråga Parky först.', 'Små val. Stora resultat.', slutlockup + 'STARTA PARKY-TESTET' + ParkKey.org/test.",
  parky:
    "Kanonisk Parky: rund/oval luddig kropp i Park Green, ljus gräddvit ansiktszon, två stora runda ögon med tydlig highlight, litet leende, korta armar/ben, ljusgrön nyckel-symbol på magen och nyckelögla/antenn ovanför huvudet. Kroppshöjd ca 1,5 gånger huvudzonens bredd. Samma proportioner, samma ögonstorlek, samma nyckelform i varje bild. Ingen mun-läppsynk, inga extra lemmar, ingen storleksdrift, ingen färgdrift.",
} as const;

export type StoryboardFrame = {
  index: number;
  start: number;
  end: number;
  reference: string;
  mobileFirst: string;
  camera: string;
  parky: string;
  ui: string;
  music: string;
  transition: string;
};

/** The 9 reference frames, each re-directed to a mobile-first, live-action shot. */
export const STORYBOARD_FRAMES: StoryboardFrame[] = [
  {
    index: 1,
    start: 0,
    end: 3,
    reference:
      "Kvinna vid kafébord i motljus, höstallé, ParkKey-logga uppe till vänster, textblock 'Fråga Parky först.'",
    mobileFirst:
      "Samma person, samma motljus — men hon lyfter mobilen ur jackfickan medan hon går/sätter sig. Ingen laptop i bild.",
    camera: "Gimbal push-in i ögonhöjd, 50 mm-känsla, löv-bokeh i förgrunden, sol i vänsterkant.",
    parky: "Inte i bild ännu — endast nyckelöglans gröna reflex antyds i mobilskärmen.",
    ui: "Mobilskärm mörk/vilande. På-bild-text: 'Fråga Parky först.' + korrekt ParkKey-lockup.",
    music: "Akustiskt piano, ett enkelt motiv, ingen rytm ännu.",
    transition: "Hennes tumme sveper upp → cut på första betoningen.",
  },
  {
    index: 2,
    start: 3,
    end: 6,
    reference:
      "Laptopskärm med 'Parky-testet', 'Starta testet'-knapp, tre faktachips, Parky pekar mot rubriken.",
    mobileFirst:
      "Startvyn ligger i mobilen, hållen i handen. Parky står på skärmkanten och pekar in mot 'Starta testet'.",
    camera: "Over-shoulder tracking, skärpa vandrar från hennes ansikte till skärmen.",
    parky: "Parky kliver in i bild, blinkar en gång, pekar med hela armen mot knappen.",
    ui: "'Parky-testet · Upptäck er potential på 2–3 minuter' + knapp 'Starta testet' + chips: 6 korta frågor / 2–3 minuter / inget mejl krävs.",
    music: "Nylonsträngad gitarr lägger sig under pianot.",
    transition: "Tummen trycker knappen → ljusblänk från solen motiverar cut.",
  },
  {
    index: 3,
    start: 6,
    end: 10,
    reference:
      "Parky nära kameran med pratbubbla 'Vi börjar med några enkla frågor.', frågekort med sex ikonval.",
    mobileFirst:
      "Frågan 'Vad vill ni förbättra mest?' fyller mobilskärmen; Parky står bredvid telefonen i förgrunden.",
    camera: "Nära handhållen-stabiliserad på mobil + Parky, kaféliv suddigt bakom.",
    parky:
      "Vänder blicken från kameran till skärmen (eye-line leder tittaren), lyfter handen mot valen.",
    ui: "Val: Parkering · Kollektivtrafik · Gång & cykel · Lokal handel · Samhällsnytta. Ingen pratbubbla — rörelsen bär betydelsen.",
    music: "Mjuk live-percussion startar, låg puls.",
    transition: "Ett förbipasserande löv sveper förgrunden → cut.",
  },
  {
    index: 4,
    start: 10,
    end: 14,
    reference:
      "'Hur ser det ut idag?' med fem radval, Parky till vänster i bild, gyllene gata bakom.",
    mobileFirst: "Samma lista i mobilformat, hon scrollar med tummen medan hon står i solen.",
    camera: "Lateral dolly längs bordet/gatan, förgrundswipe av en stolsrygg.",
    parky: "Följer scrollen med kroppen, små nickar, blink vid varje markerat val.",
    ui: "Radval: stor andel bilresor · utmaningar med parkering · stärka kollektivtrafik · öka gång och cykel · stärka lokalt näringsliv.",
    music: "Varm bas kommer in, taktfast men mjuk.",
    transition: "Rörelseblur från dollyn → cut på beat.",
  },
  {
    index: 5,
    start: 14,
    end: 18,
    reference:
      "'Vad vill ni kunna mäta?' med fyra ikryssade rader, progressbar överst, Parky tummen upp.",
    mobileFirst:
      "Progressbaren fylls i mobilen medan hon går längs allén; fyra val bockas av i realtid.",
    camera: "Låst närbild med mikrorörelse på skärmen, sedan lyft till hennes ansikte.",
    parky: "Tummen upp, ett tydligt blink, kroppen gungar lätt med musiken.",
    ui: "Minskade utsläpp · bättre nyttjandegrad · ökad lokal handel · friskare invånare. Progress ~70 %.",
    music: "Uppbyggnad mot hooken, percussion tätare.",
    transition: "Solblänk över skärmen motiverar cut.",
  },
  {
    index: 6,
    start: 18,
    end: 23,
    reference:
      "'Ert resultat' med grön potential-rad, fyra insiktsrader och stapeldiagram, Parky höjer armarna.",
    mobileFirst:
      "Resultatvyn i mobilen; hon stannar, ler, håller telefonen så solen träffar skärmen.",
    camera: "Arc-rörelse runt henne, ljusbloom motiverad av solen.",
    parky: "Höjer båda armarna, glädjegest, blick mot henne — inte mot kameran.",
    ui: "'Stor potential för positiv förändring' + verifierad aktivitet · bättre nyttjandegrad · lägre utsläpp · starkare lokalsamhälle + enkel stapelgrafik.",
    music: "Hooken landar på starkaste nedslaget.",
    transition: "Hon börjar gå → kameran släpper med i rörelsen.",
  },
  {
    index: 7,
    start: 23,
    end: 28,
    reference:
      "Delad bild: buss 'Stadsliv', cyklist, gående, kaféliv + fem lägesikoner och 'MÄTA. BELÖNA. BEVISA.'",
    mobileFirst:
      "En enda kontinuerlig tracking-shot genom staden istället för delad ruta: buss, cyklist, gående, kaféer passerar naturligt.",
    camera: "Bredare tracking i gånghastighet, verkligt stadsdjup, inga fyrkantiga split-paneler.",
    parky: "Springer med i förgrunden i ett par steg, tittar upp mot henne.",
    ui: "Endast tre ord i rytm med klippen: MÄTA. BELÖNA. BEVISA. Inga påhittade partnerlogotyper på bussen.",
    music: "Hookens andra vända, rytmen driver klippen.",
    transition: "Förgrundswipe av en förbipasserande cyklist.",
  },
  {
    index: 8,
    start: 28,
    end: 32,
    reference:
      "Parky räcker fram ett gyllene ParkCoin-mynt mot en människohand, text 'Små val. Stora resultat.'",
    mobileFirst:
      "Samma belöningsmoment; myntet reflekteras i mobilskärmen som hon håller i andra handen.",
    camera: "Långsam höjning i motljus, grunt djup, guldreflex i luften.",
    parky: "Räcker fram myntet, blinkar, kroppen lutar lätt framåt — tydlig belöningsgest.",
    ui: "På-bild-text: 'Små val. Stora resultat.' Ingen extra logotyp i denna bild.",
    music: "Hooken toppar och börjar lösas upp.",
    transition: "Guldreflexen växer och lämnar över till slutbilden.",
  },
  {
    index: 9,
    start: 32,
    end: 35,
    reference:
      "Slutbild: stad och vatten i solnedgång, korrekt ParkKey-lockup, grön CTA-knapp 'STARTA PARKY-TESTET', ParkKey.org/test.",
    mobileFirst:
      "Samma slutbild. Parky står stilla till vänster, mobilen är ur bild — endast varumärke och CTA.",
    camera: "Sätter sig till nästan statisk bild med subtil parallax i löven.",
    parky: "Står stilla, en sista lugn blink mot kameran.",
    ui: "Korrekt ParkKey™-lockup + 'SMART PARKING. BETTER CITIES.' · knapp 'STARTA PARKY-TESTET' · ParkKey.org/test. Endast en CTA.",
    music: "Hooken resolvar på sista ackordet, tystnar rent.",
    transition: "Hold till svart.",
  },
];

const frameLine = (f: StoryboardFrame) =>
  `## Scene ${f.index} — ${f.start}s–${f.end}s (storyboardruta ${f.index})
Referensruta: ${f.reference}
Mobil-först regi: ${f.mobileFirst}
Kamera: ${f.camera}
Parky: ${f.parky}
UI / text: ${f.ui}
Musik: ${f.music}
Övergång: ${f.transition}`;

export function storyboardMasterBlock() {
  return `## CANONICAL VISUELL REFERENS (LÅST)
Detta promptpaket är genererat från den uppladdade storyboarden (9 rutor, 0:00–0:35) för "${STORYBOARD_PROJECT_TITLE}".
Referensbild: ${STORYBOARD_ASSET_URL}
Referensen är primär för look, ljus, färg, miljö, Parky-design och scenlogik.

- Ljus: ${STORYBOARD_LOOK.light}
- Palett: ${STORYBOARD_LOOK.palette}
- Miljö: ${STORYBOARD_LOOK.environment}
- Kamera/optik: ${STORYBOARD_LOOK.camera}
- Tonalitet: ${STORYBOARD_LOOK.tonality}
- Typografi/budskap: ${STORYBOARD_LOOK.typography}
- Parky kanonisk design: ${STORYBOARD_LOOK.parky}

### DEVICE-AVVIKELSE FRÅN REFERENSEN (avsiktlig)
Storyboarden visar laptop. Filmen är MOBIL-FÖRST: hela Parky-testet genomförs på en handhållen mobil
(tumme sveper och trycker, skärm i motljus, telefonen bärs genom staden). Ingen laptop får förekomma i filmen.
Allt annat i referensen — ljus, färg, miljö, Parky, budskap, slut-CTA — behålls.`;
}

export function storyboardSceneBlock() {
  return `${STORYBOARD_FRAMES.map(frameLine).join("\n\n")}`;
}

export function storyboardShotListRows() {
  return STORYBOARD_FRAMES.map(
    (f) =>
      `| ${f.index} | ${f.end - f.start}s | ${f.camera} | ${f.mobileFirst} | ${f.parky} | ${f.ui} | ${f.music} | ${f.transition} |`,
  ).join("\n");
}

export function storyboardContinuityBlock() {
  return `## LÅST FRÅN STORYBOARDEN (${STORYBOARD_ASSET_URL})
- PARKY: ${STORYBOARD_LOOK.parky}
- LJUS: ${STORYBOARD_LOOK.light}
- PALETT: ${STORYBOARD_LOOK.palette}
- MILJÖ: ${STORYBOARD_LOOK.environment}
- OPTIK/KAMERA: ${STORYBOARD_LOOK.camera}
- TON: ${STORYBOARD_LOOK.tonality}
- TYPOGRAFI: ${STORYBOARD_LOOK.typography}
- HUVUDPERSON: samma vuxna kvinna, samma hårlängd, samma beige/grå stickade lager och samma smycken i alla bilder.
- DEVICE: samma mobil, samma orientering, samma ljusa UI-tema, samma progress-logik genom hela filmen.
- UI-SPRÅK: svenska, Montserrat, samma komponentstil och exakt samma formuleringar som i referensrutorna.
- SLUTBILD: exakt lockup + en enda CTA 'STARTA PARKY-TESTET' + ParkKey.org/test.
- Avvikelse endast där den är uttryckligen beslutad: laptop → mobil, split-ruta (ruta 7) → en kontinuerlig tracking-shot.`;
}

export function storyboardMusicBlock() {
  return `## MUSIKENS FÖRHÅLLANDE TILL STORYBOARDEN
Klippen ligger på rutgränserna 3 / 6 / 10 / 14 / 18 / 23 / 28 / 32 sekunder — varje sådan gräns är ett musikaliskt nedslag.
Hooken landar i ruta 6 (resultatvyn, 18–23s) och toppar i ruta 8 (belöningen, 28–32s), och resolvar under slutbilden 32–35s.
Instrumentering enligt referensens värme: akustiskt piano, dämpad nylonsträngad gitarr, mjuk live-percussion, varm bas, mycket sparsam stråk-/padtextur.
Inga droner, inga synth-plink, inga tech-chimes, inga digitala pip. Ingen VO, inga subtitles, inga SFX.`;
}

export function storyboardNegativeBlock() {
  return `- ingen laptop eller desktopskärm (filmen är mobil-först trots referensrutorna)
- ingen delad skärm/collage-ruta som i referensruta 7 — endast kontinuerlig kamerarörelse
- ingen drift i Parkys proportioner, ögonstorlek, nyckelform, nyckelögla eller grönton
- inga pratbubblor (referensruta 3 hade en — den ersätts av rörelse och blick)
- ingen munrörelse/läppsynk på Parky, inget tal
- ingen påhittad partnerlogotyp på buss, kafé eller skyltar
- ingen kall blå tech-gradient, ingen neon, ingen vinterkyla — solig nordisk höst gäller
- ingen dubblerad logotyp eller andra CTA än ParkKey.org/test i slutbilden`;
}

export function storyboardQaBlock() {
  return `## STORYBOARD-GRIND (utöver ordinarie QA)
- [ ] Varje klipp motsvarar rätt storyboardruta i ordning och tid (0/3/6/10/14/18/23/28/32/35s).
- [ ] Parky identisk med referensens kanoniska design i samtliga bilder.
- [ ] Ljus, färg och höstmiljö matchar referensen.
- [ ] Ingen laptop i någon bild — mobil används genomgående.
- [ ] Ruta 7 är en kontinuerlig tracking-shot, inte en split-ruta.
- [ ] Slutbilden har korrekt lockup, en CTA och ParkKey.org/test.
- [ ] Ingen VO, inga subtitles, inga SFX i mastern.`;
}

/** Storyboard-specific QA rows, appended to the ParkKey QA gate for storyboard-locked films. */
export function storyboardQaItems() {
  return storyboardQaBlock()
    .split("\n")
    .filter((l) => l.startsWith("- [ ] "))
    .map((l, i) => ({
      id: `sb-${i + 1}`,
      label: l.replace("- [ ] ", ""),
      source: "storyboard-reference",
      checked: false,
    }));
}
