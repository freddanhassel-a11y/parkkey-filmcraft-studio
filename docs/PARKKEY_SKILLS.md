# ParkKey™ Film Studio — mandatory skill routing

This repository is governed by the same ParkKey™ skill system used in the Lovable workspace. Treat these skills as product and release requirements, not optional inspiration.

## Mandatory skills

- `parkkey-master` — routes every ParkKey task, protects current product truth, blocks deprecated narratives and requires proof/security/accessibility release gates.
- `parkkey-video` — cinematic film direction, storyboard/shot continuity, readable UI, prompt quality, motion storytelling and render/export QA.
- `parkkey-brand-theme` — ParkKey visual identity, typography, Parky™ usage, premium cinematic direction and accessible colour usage.
- `parkkey-visual-content` — agency-grade campaign, presentation and proof visuals.
- `parkkey-design-system` — semantic tokens, reusable components, accessible states and purposeful motion.
- `parkkey-truth-proof` — evidence states, provenance and fail-closed wording for product/integration/customer claims.
- `parkkey-accessibility-release-qa` — WCAG 2.2 AA baseline, browser/responsive/keyboard QA and PASS/FAIL/MANUAL CHECK release reporting.
- `parkkey-ai-governance` — human oversight, provenance, transparency and safe AI-generated content workflows.
- `parkkey-security-privacy` — authentication, RLS, private media, personal-data boundaries, server-only secrets and production security.
- `parkkey-commercial-comms` — concise evidence-led campaign/customer/LinkedIn communication with one clear next action.

## Film Studio non-negotiables

### Brand

- Forest Green `#0F3D2E`
- Park Green `#8CC63E`
- Pale Cream `#F5F5EB`
- Graphite `#1E1E1E`
- Montserrat on branded surfaces
- premium midnight/navy extensions are allowed
- restrained gold warmth is allowed
- glass effects only when legible and purposeful
- never generic neon/crypto/SaaS styling

### Parky™ continuity

Parky™ is the canonical reward-facing guide. Keep proportions, fuzzy lime-green body, pale cream face/belly, large dark glossy eyes with green irises, small smile, loop/antenna, green key emblem and short limbs consistent across scenes. Parky must have a narrative role through eye-line, blink, gesture and guidance/reward moments. Generative drift is a QA failure.

### Product workflow

Primary workflow:

`CREATE → REVIEW → APPROVE → SCHEDULE/SEND → PROOF`

Film render lifecycle:

`PROMPT READY → READY TO RENDER → RENDERING → READY FOR QA → APPROVED → EXPORTED`

No invalid jumps. AI-generated/customer-facing material must not leave the system before `APPROVED`.

### Truth states

Never fake or infer operational success. Do not display green for unknown/unverified states.

Use explicit truth labels where relevant:

`DEMO`, `EXAMPLE`, `HYPOTHESIS`, `TARGET`, `PROPOSED`, `IN DISCUSSION`, `CONFIRMED`, `VERIFIED`, `LIVE`.

Never set `CONNECTED`, `SENT`, `PUBLISHED`, `RENDERED`, `READY`, `LIVE` or equivalent unless the server has verified the corresponding provider/action/result.

If no real render exists, show `No rendered file yet`. If no provider is connected, show `NOT CONNECTED`. LinkedIn remains `SCHEDULED — CONNECTION REQUIRED` until actual OAuth/API capabilities are verified.

### Security

- Same canonical ParkKey/CoreOS authentication and approved team-member boundary.
- No separate Film Studio password registry.
- Server-side authorization on all protected actions.
- No service-role secret or provider secret in client code.
- Private storage for unpublished/customer assets; signed URLs for preview/download where appropriate.
- Browser must not have unrestricted CoreOS table access.
- Customer delivery requires approved material, explicit recipient/contents preview and explicit confirmation.
- If secure send is unavailable, use `READY TO SEND IN COREOS`; never fake `SENT`.

### Visual / film quality bar

AAA means publication-ready, clear, cinematic, credible and technically truthful — not merely visually busy.

Prefer sunny Nordic city/community/mobility scenes, real human movement, environmental motion, longer motivated camera moves, natural interactions and premium transitions. Avoid slideshow/Ken Burns, fake typing, repeated screen poking, pseudo-text, invented logos and decorative tech effects.

For the canonical `Parky-testet — AAA/Guldägget master` keep the established brief: 30–35 seconds, mobile-first interaction, sunny Nordic autumn city, canonical animated Parky AI assistant, no voiceover/subtitles/SFX, warm premium organic music, active city background and clean ParkKey end frame with `ParkKey.org/test` CTA.

### Release gate

Before merge/release, verify at minimum:

1. production build passes;
2. TypeScript/typecheck passes;
3. lint passes;
4. route protection and auth boundaries are intact;
5. no fake integration/render/delivery/publish state exists;
6. responsive behaviour at 390 / 768 / 1280;
7. keyboard/focus and reduced-motion basics;
8. first canonical film project remains intact;
9. no secrets are introduced to the repository/client bundle;
10. anything requiring a real private session/provider is reported as `MANUAL CHECK`, never as a guessed PASS.

## Git/Lovable sync rule

This repository is connected to Lovable. Do not rewrite published history. Do not force-push, rebase/amend/squash already-pushed commits. Keep synced branches buildable and truth-safe so Lovable never receives an intentionally broken or misleading state.
