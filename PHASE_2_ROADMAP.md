# ParkKey Film Studio — Phase 2 to Production

## Overview

This document outlines the Phase 2 development roadmap for ParkKey Film Studio. Phase 1 (Lovable foundation) is complete. Phase 2 removes Lovable dependencies and implements the production-ready feature set.

**Key Principle**: Never fake `CONNECTED`, `SENT`, `PUBLISHED`, `RENDERED`, or `LIVE` states. Use truth states: `DEMO`, `EXAMPLE`, `HYPOTHESIS`, `TARGET`, `PROPOSED`, `IN DISCUSSION`, `CONFIRMED`, `VERIFIED`, `LIVE`.

---

## Priority 1: Customer Delivery Center

### Scope
- Deliver `APPROVED` material only to CoreOS customers/contacts
- User selects: customer, contact, recipient, subject, message, files/links, optional expiry
- Clear confirmation before external delivery
- Server-side email integration (if available) or `READY TO SEND IN COREOS` status
- Full audit trail: user, timestamp, material version, recipient, result

### Files
- `src/server/delivery/` — server-side logic
- `src/routes/studio/delivery/` — UI routes
- `src/db/schema/delivery_log.sql` — audit table

### Status in UI
```
DRAFT
  ↓
INTERNAL REVIEW (approval gate)
  ↓
APPROVED (only then allow delivery)
  ↓
READY TO SEND IN COREOS (or SCHEDULED / SENT if email connected)
  ↓
Audit log entry
```

---

## Priority 2: Unified Approval Workflow

### Scope
State machine for film, image, social post, customer material:
```
DRAFT → INTERNAL REVIEW → APPROVED → SCHEDULED / READY TO SEND → PUBLISHED / SENT
                                                                        ↓
                                                                     FAILED
```

AI-generated content never leaves `DRAFT` without `APPROVED` status.

### Files
- `src/server/approval/` — state machine, transitions, logging
- `src/db/schema/approval_log.sql` — transition audit table
- `src/types/approval.ts` — TypeScript types

### Implementation
- Enforce at database level (RLS rules)
- Log every state transition with user + timestamp
- Provide rollback capability for `FAILED` → `DRAFT`

---

## Priority 3: LinkedIn Studio

### Scope
- Multilingual copy (SV/EN)
- Media, alt-text, CTA, UTM parameters
- Preview + campaign linking
- Publish only via verified OAuth connection
- Capability detection (scope validation)
- Status: `SCHEDULED — CONNECTION REQUIRED` if missing permissions
- `PUBLISHED` only after API confirmation + real post ID/URL
- Retry, duplicate, reschedule

### Files
- `src/server/linkedin/` — API integration, capability detection
- `src/routes/studio/social/linkedin/` — UI components
- `src/db/schema/linkedin_posts.sql` — post metadata table
- `src/integrations/linkedin/` — OAuth flow, token management

### Status in UI
```
DRAFT
  ↓
PREVIEW (show mock post)
  ↓
SCHEDULED → [CONNECTION CHECK]
  ↓
PUBLISHED (only after POST_ID confirmed)
```

---

## Priority 4: Social Calendar

### Scope
- Week/month view
- Thumbnails, channel, campaign, scheduled time, status
- Drag-and-drop reschedule (log every change)
- Duplicate to different aspect ratios: 1:1, 4:5, landscape, video
- Multi-channel scheduling (LinkedIn, Instagram, TikTok ready)

### Files
- `src/routes/studio/social/calendar/` — calendar components
- `src/server/social/calendar/` — reschedule logic, versioning
- `src/db/schema/social_posts.sql` — schema for all posts

### UI States
- Locked (awaiting approval)
- Editable (DRAFT)
- Scheduled (SCHEDULED)
- Published (PUBLISHED)
- Failed (FAILED)

---

## Priority 5: Production Readiness Dashboard

### Scope
Visible integration status on dashboard:
```
CoreOS              → [●] CONNECTED / [◯] NOT CONNECTED / [⚠] DEGRADED / [?] MANUAL CHECK / [✗] FAILED
Image AI            → [●] CONNECTED / [◯] NOT CONNECTED / [⚠] DEGRADED / [?] MANUAL CHECK / [✗] FAILED
LinkedIn            → [●] CONNECTED / [◯] NOT CONNECTED / [⚠] DEGRADED / [?] MANUAL CHECK / [✗] FAILED
Video Renderer      → [●] CONNECTED / [◯] NOT CONNECTED / [⚠] DEGRADED / [?] MANUAL CHECK / [✗] FAILED
Customer Delivery   → [●] CONNECTED / [◯] NOT CONNECTED / [⚠] DEGRADED / [?] MANUAL CHECK / [✗] FAILED
```

**No green status without verified connection.**

### Files
- `src/server/integrations/status.ts` — health check logic
- `src/components/dashboard/ProductionReadiness.tsx` — UI component
- `src/db/schema/integration_status.sql` — status history table

### Health Checks
- CoreOS: can list customers? (test query)
- Image AI: API responding? (test generation)
- LinkedIn: token valid? (OAuth refresh check)
- Video Renderer: API up? (health endpoint)
- Customer Delivery: email service active? (test send disabled)

---

## Priority 6: Video Render Pipeline

### Scope
Provider-agnostic video rendering for **"Parky-testet — AAA/Guldägget master"**.

**Preserve**: storyboard, Parky continuity, prompts, reference assets.

**Structure**:
```
Storyboard → Scene Renders → Review → Master Render → Export (1920×1080, 30fps, H.264 MP4)
```

### Files
- `src/server/render/` — render queue, provider abstraction
- `src/routes/studio/project/render/` — render UI
- `src/db/schema/render_jobs.sql` — job tracking
- `src/integrations/render/` — provider interfaces (stub ready for Firefly, etc.)

### Status in UI
```
No connected renderer:
  → "No rendered file yet"
  → "VIDEO RENDERER — NOT CONNECTED"
  
Connected:
  → Render progress bar
  → "Rendering... 45%"
  
Complete:
  → Download link (real MP4, never fake)
  → Export options
```

### Parky Design Rules (IMMUTABLE)
- Small, lime-green, round/fuzzy figure
- Cream face/belly
- Large dark glossy eyes with green iris
- Small mouth
- Loop/antenna on head
- Green key emblem on chest
- Short arms/legs

### Creative Direction (IMMUTABLE)
- Sunny Nordic autumn city
- Real motion (no animation style)
- Long tracking/dolly/gimbal shots
- Animated Parky as AI assistant (reactions: blinking, eye-line, body motion, hand gestures)
- **NO voiceover, NO subtitles, NO SFX**
- Warm premium organic music only:
  - Acoustic piano
  - Muted/nylon guitar
  - Live-feel soft percussion
  - Warm bass
  - Very sparse strings/pad
- **NO tech-chime, synth-plink, digital beeps, or AI-feeling synth**

---

## Priority 7: CoreOS Writeback

### Scope
- Link approved material back to CoreOS customer/pilot/opportunity
- Stable IDs + versions
- **Do NOT duplicate customer master data in Film Studio**

### Files
- `src/server/coreos/writeback.ts` — writeback logic
- `src/db/schema/coreos_links.sql` — link metadata table

### Workflow
```
Film APPROVED
  ↓
User selects CoreOS customer + opportunity
  ↓
Writeback: link film ID + version to opportunity
  ↓
Audit log + confirmation
```

---

## Security

### Requirements (All Server-Side)
- ✅ No service roles in frontend
- ✅ Private storage buckets
- ✅ Signed URLs for downloads
- ✅ RLS / server authorization
- ✅ No direct browser access to CoreOS tables
- ✅ No secrets in client code

### Implementation
- `src/server/auth/` — Supabase + custom auth flow
- `src/server/security/` — middleware for permission checks
- Environment variables: server-side only (`.env.server`)

---

## QA Checklist

- [ ] Auth redirect/logout/session expiry
- [ ] Uploads (image/video)
- [ ] Private preview/download
- [ ] Versioning
- [ ] CoreOS lookup/writeback
- [ ] Approval states (transitions, audit logging)
- [ ] LinkedIn disconnected state handling
- [ ] Delivery confirmation (audit trail)
- [ ] Audit events (all actions logged)
- [ ] Responsiveness (390/768/1280)
- [ ] Keyboard navigation/focus
- [ ] WCAG 2.2 AA baseline
- [ ] TypeCheck passes (`tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Production build works (`npm run preview`)

---

## Definition of Done

✅ Film Studio workflow is fully operational:
```
CREATE → REVIEW → APPROVE → SCHEDULE/SEND → PROOF
```

✅ No faked integrations or states  
✅ Phase 1 + Parky-testet project intact  
✅ All code passes TypeCheck, lint, build  
✅ Security implemented server-side  
✅ QA baseline met  
✅ Audit trail complete  
✅ PR reviewed and approved by team

---

## Branch & PR Strategy

### Branch
```
feat/film-studio-production-phase-2
```

### Pre-PR Checklist
- [ ] `npm run type-check` passes
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] Existing tests pass (if any)
- [ ] Blocking errors fixed
- [ ] Clear commit messages
- [ ] No secrets in code

### PR Content
- ✅ What was implemented
- ✅ Which integrations are live vs. stubbed
- ✅ Credentials/OAuth required
- ✅ Database migrations
- ✅ Security changes
- ✅ QA results
- ✅ Manual verification steps

---

## Commit Style

Follow conventional commits:
```
feat: add customer delivery center
refactor: remove Lovable dependencies
docs: add Phase 2 roadmap
fix: approval state machine transitions
chore: update dependencies
```

---

## Next Steps

1. ✅ Create `feat/film-studio-production-phase-2` branch
2. ✅ Remove Lovable dependencies (package.json, vite.config.ts)
3. → Implement Priority 1–7 in order
4. → QA testing
5. → Open PR with full documentation
6. → Team review + merge

---

**Last Updated**: 2026-09-13  
**Status**: Phase 2 Foundation Ready
