# ParkKey Film Studio

ParkKey Film Studio is published independently from Lovable.

## Production

Canonical production runtime:

`https://parkkey-filmcraft-studio.parkkey-coreos-nordic-2026.workers.dev`

The production build is created from GitHub `main` and deployed to Cloudflare Workers by the ParkKey release workflow in `freddanhassel-a11y/parkkey-os`.

**Publishing does not require Lovable credits and does not wait for Lovable to sync GitHub.** Lovable can still be used as an editor when desired, but it is not the production release dependency.

The release workflow:

- checks out the latest `parkkey-filmcraft-studio/main`
- installs locked dependencies
- builds the TanStack/Nitro application for Cloudflare
- deploys the Worker
- smoke-tests `/auth` and `/studio`
- runs automatically every hour and can also be dispatched manually

## Development

```sh
git clone https://github.com/freddanhassel-a11y/parkkey-filmcraft-studio.git
cd parkkey-filmcraft-studio
bun install --frozen-lockfile
bun run dev
```

## Stack

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Supabase auth/data services
- Cloudflare Workers production runtime
