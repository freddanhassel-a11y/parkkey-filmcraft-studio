<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# ParkKey™ Film Studio agent rules

All implementation, review and release work in this repository must follow [`docs/PARKKEY_SKILLS.md`](docs/PARKKEY_SKILLS.md).

The ParkKey skill system is mandatory. At minimum route work through `parkkey-master`, then apply the relevant specialist rules for video, brand/theme, visual content, design system, truth/proof, accessibility/release QA, AI governance, security/privacy and commercial communication.

Release truth is fail-closed: do not claim or display `CONNECTED`, `SENT`, `PUBLISHED`, `RENDERED`, `READY`, `LIVE` or equivalent without verified server/provider evidence. No real render means `No rendered file yet`; no LinkedIn capability means `SCHEDULED — CONNECTION REQUIRED`; unavailable customer send means `READY TO SEND IN COREOS`.

Do not weaken the canonical ParkKey/CoreOS authentication boundary, private storage, server-side authorization or audit trail to simplify implementation.

Release sync marker: 2026-09-14 — keep Lovable production aligned with GitHub `main` before deploy.
