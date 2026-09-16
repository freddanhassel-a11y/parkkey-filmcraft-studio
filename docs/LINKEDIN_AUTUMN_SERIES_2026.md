# ParkKey LinkedIn Höstserie 2026

Period: **16 september–2 oktober 2026**  
Timezone: **Europe/Stockholm**

## Truth state

This file describes the editorial plan seeded by `20260916150000_linkedin_autumn_series_2026.sql`.

- No item in this series is seeded as `PUBLISHED`.
- Schedules are seeded as `SCHEDULED — CONNECTION REQUIRED`.
- Every linked media record is an `image-brief` with no `storage_path` until a real approved asset exists.
- A post may only become truly published after the existing Film Studio LinkedIn adapter receives and stores a verified LinkedIn API post ID/URL.
- Named partner logos/integrations must not be implied unless separately verified.
- Canonical Parky™ must never be redesigned, recolored or reshaped.

## Schedule

| Date | Time | Theme | Caption / asset truth |
|---|---:|---|---|
| 16/9 | 17:30 | Ingen ny app. Bara belöningen. | Caption + 4:5 creative brief linked; final asset still required |
| 18/9 | 08:15 | Belöningen gör dagen | Caption + canonical Parky creative brief linked; final asset still required |
| 21/9 | 08:15 | Från parkeringshändelse till beteendeförändring | Generic parking context; no live operator claim |
| 23/9 | 08:15 | Belöningen kan stanna lokalt | Local-commerce creative brief; no invented merchant |
| 25/9 | 08:15 | Börja med en smal pilot | Pilot/KPI framework only; no fabricated results |
| 28/9 | 08:15 | Samma app. Mer värde. | Generic mobility operator UI; no named integration claim |
| 30/9 | 08:15 | Mät först. Skala sedan. | CoreOS proof framing; no fabricated KPI values |
| 2/10 | 08:15 | Vilket beteende vill ni förändra? | Pilot-dialogue CTA; one CTA only |

## Asset workflow

The migration creates one linked `media_assets` creative-brief row per post. These rows deliberately have no file path. In Film Studio, replace/complete each brief with the approved final image and keep the `social_post_assets` link intact before any publish attempt.
