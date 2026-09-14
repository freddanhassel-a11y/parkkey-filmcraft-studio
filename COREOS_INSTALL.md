# ParkKey Film Studio — CoreOS installation

This package is a verified production distribution of ParkKey Film Studio.

## Integrity

1. Download both the `.tar.gz` package and matching `.sha256` file from the GitHub Actions artifact.
2. Verify the checksum before installation:

```bash
sha256sum -c parkkey-film-studio-<SHA>.sha256
```

3. Inspect `BUILD_INFO.txt` inside the archive and confirm `SOURCE_SHA` matches the intended GitHub `main` commit.

## Runtime

The package contains the Nitro production output under `.output/` plus the dependency lockfile and package metadata. Runtime secrets are intentionally not bundled.

Required runtime configuration must be injected by the deployment environment. Never store service-role keys, LinkedIn tokens, provider secrets or private media credentials in the repository or artifact.

## Start

Use the deployment target's Nitro/Cloudflare adapter and `.output/server/wrangler.json` for Cloudflare Worker deployment, or the target-specific Nitro runtime for another supported environment.

## Production truth rules

- LinkedIn must remain `NOT CONNECTED`, `MANUAL CHECK` or equivalent until OAuth scope, principal and token are verified server-side.
- A social item becomes `PUBLISHED` only after a real provider response with a post identifier/URL.
- Video becomes rendered/ready only after an actual MP4 is verified by the server-side render boundary.
- Customer material must remain unapproved until brand review and approval are complete.
