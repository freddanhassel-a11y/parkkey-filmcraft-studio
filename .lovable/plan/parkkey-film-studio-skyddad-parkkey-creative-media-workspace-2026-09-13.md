# ParkKey™ Film Studio → skyddad ParkKey creative/media workspace

Stort uppdrag. Jag föreslår att bygga det i fem etapper, i den här ordningen, med samma inloggning som CoreOS först eftersom allt annat hänger på den.

## Viktigast först: en gemensam inloggning (och vad det kostar)

CoreOS använder ParkKeys kanoniska konto-tjänst (projekt `xoabfpxdqqlutxwjgqii`) med e-post/lösenord, `team_members`-godkännande och lösenordssättning vid första inloggning. Film Studio har idag sin **egen** konto-tjänst och sin egen databas — därför fungerar inte CoreOS-kontot här.

Två vägar. Jag rekommenderar A.

**A. Film Studio använder CoreOS-identiteten, men behåller sin egen databas (rekommenderas)**
- Inloggningen i Film Studio pekas om till ParkKeys kanoniska konto-tjänst. Samma konto och lösenord som i CoreOS. Ingen ny lösenordsdatabas.
- Vid varje anrop kontrolleras användarens token på serversidan mot CoreOS-tjänsten, och behörigheten slås upp mot CoreOS `team_members` (godkänd medlem krävs).
- Film Studios egna tabeller stängs helt för webbläsaren; all läsning/skrivning går genom serverfunktioner efter kontrollen ovan. Det är strängare än idag, inte svagare.
- Lösenordssättning vid första inloggning återanvänds från CoreOS-mönstret.
- Kan byggas direkt av mig, utan att du gör något.
- Konsekvens: nuvarande Film Studio-inloggningar slutar gälla — du loggar in med ditt CoreOS-konto. Filmen, storyboarden och promptpaketet påverkas inte.

**B. Flytta Film Studios tabeller in i CoreOS-databasen**
- Ger en enda databas med gemensam RLS, men jag kan inte ändra CoreOS-databasen härifrån; det måste göras i CoreOS-projektet. Längre väg, större risk för CoreOS.

Antagande om jag inte hör annat: **A**.

## Etapp 1 — Inloggning och skydd
- Gemensam ParkKey-inloggning enligt A, inklusive lösenordssättning vid första inloggning och utloggning.
- Alla sidor, media och data privata som standard. Serverkontroll + databasregler, inte bara gömd meny.
- Loggning av inloggningsrelaterade och materialrelaterade händelser (audit).

## Etapp 2 — Media Library (bild + video på riktigt)
- Ny privat lagringsyta för media, signerade länkar för visning/nedladdning, inga publika filer.
- Uppladdning med dra-och-släpp och filväljare, sanna förlopps- och felstatusar, typ- och storlekskontroll.
- Förhandsvisning av bild och video, taggar/klassificering, versioner, koppling till film/kampanj/kund, metadata (typ, mått, längd, storlek, vem, när, rättigheter/källa, godkännandestatus).

## Etapp 3 — CoreOS ↔ Film Studio Material Hub
- Sök och välj CoreOS-kund/kontakt/affär/pilot som sammanhang för ett kreativt projekt, genom en smal serverkanal med behörighetskontroll — aldrig fri läsning av CoreOS från webbläsaren.
- Hämta endast de fält materialet behöver (organisation, kontakt, affär/pilot, önskat material, noteringar, deadline, godkänd CTA/claim-kontext). Inga dubblerade kundregister — bara CoreOS-referenser plus visningsfält.
- Skicka tillbaka färdigt material som referens till rätt CoreOS-post, med Film Studios projekt-/versions-/asset-ID, status och intern säker förhandsvisningslänk.
- Sanningsstatus bevaras (DEMO / PROPOSED / APPROVED / EXPORTED). Utkast kan aldrig bli godkänt kundpåstående.
- Full spårlogg för import, export, länkning och sändning.

## Etapp 4 — Social Creative Studio och LinkedIn Studio
- Social Creative: mål, publik, kampanj, kund, kanal, format, CTA, copyriktning, Parky-användning, mood, referenser in — postcopy, rubrik/overlay, bildprompt, negativlista, alt-text, claim/evidenskontroll och beskärningsförinställningar ut (LinkedIn 1:1, 4:5, liggande). Om ingen bildgenerator är ansluten visas "Generator not connected" och paketet är ändå helt användbart. Ingen fejkad bild.
- LinkedIn Studio: post från befintliga assets eller från scratch, svenska/engelska varianter, bilagor ur biblioteket, val av godkänd filmversion, förhandsvisning för dator och mobil, alt-text, UTM/CTA, statusflöde utkast → granskning → godkänd → schemalagd → publicerad/misslyckad, schemaläggning med datum/tid/tidszon i kalender- och listvy, kampanjtaggar, CoreOS-koppling, kö med omförsök/felstatus, spårlogg, dubblera/omschemalägg.
- Publicering går bara genom en riktig auktoriserad LinkedIn-anslutning. Utan den står kön kvar som `SCHEDULED — CONNECTION REQUIRED`, aldrig "publicerad". "Connect LinkedIn" i inställningar med tydlig checklista för vad som krävs.

## Etapp 5 — Kundleverans, navigation, QA
- "Skicka till kund" från godkänt material: välj CoreOS-kontakt(er), se exakt mottagaradress, ämne/meddelande, filer/säkra länkar, giltighet, och bekräfta uttryckligen. Utskick sker helst genom CoreOS kommunikationsvägar; om det inte finns säkert tillgängligt skapas ett leveranspaket med status `READY TO SEND IN COREOS` plus djuplänk — inget låtsasutskick.
- Ny meny: Dashboard, Films, Social Creative, LinkedIn Studio, Media Library, Customer Materials, Schedule, Prompt Library, Integrations, Skills & QA, Settings.
- Test av hela flödet CREATE → REVIEW → APPROVE → SCHEDULE/SEND → PROOF, inloggningsskydd, uppladdning av bild och video, versioner, CoreOS-koppling, LinkedIn-schemaläggning utan anslutning, kundleverans, samt dator/tablet/mobil och tangentbord/fokus. Inga döda knappar, inga missvisande statusar. Grönt används bara för verifierat.

## Vad som krävs av dig
- Godkänn väg A (eller säg B).
- LinkedIn-publicering kräver en LinkedIn-app med rätt rättigheter och nycklar som du lägger in i projektets hemligheter. Innan det är verifierat påstår studion aldrig att LinkedIn är live.
- Bildgenerering kan aktiveras med ParkKeys egen AI-anslutning — säg till om du vill det i etapp 4, annars levereras promptpaketet utan bildgenerering.

## Teknisk sammanfattning
- Auth: browser-klient och serverkontroll pekas mot `https://xoabfpxdqqlutxwjgqii.supabase.co` med publishable key (samma mönster som CoreOS `runtime-config.ts` / `auth-middleware.ts`), token valideras serverside, behörighet mot CoreOS `team_members`, lösenordsgate enligt `PasswordSetupGate`.
- Film Studio-databasen: `authenticated`-grants dras in, all åtkomst via serverfunktioner med service-role efter identitets- och rollkontroll; audit-tabell för alla material-, delnings- och publiceringshändelser.
- Nya tabeller: `media_assets`, `media_versions`, `customer_material_links`, `coreos_material_links`, `social_posts`, `social_post_assets`, `social_schedules`, `publish_attempts`, `delivery_packages`, `delivery_recipients`, `integration_connections`, `audit_events`.
- Lagring: privat bucket + signerade URL:er; ingen publik bucket för kundmaterial.
