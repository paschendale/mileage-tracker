# Deployment

Deploys as a Cloudflare **Worker** (not classic Pages) via `@opennextjs/cloudflare` — the current Cloudflare-recommended path for Next.js App Router + Server Actions + D1. `@cloudflare/next-on-pages` (deprecated, Edge-runtime only) is deliberately not used.

Full step-by-step is in the repo root `README.md` — read that for the actual commands (create D1, migrate remote, set the `AUTH_TOKEN` secret, preview, deploy). Don't run `db:migrate:remote`, `db:seed:remote`, `wrangler secret put`, or `npm run deploy` yourself unless the user explicitly asks — these touch the user's real Cloudflare account/production data.

`wrangler.jsonc` holds the D1 binding name/database_id/database_name — these may have been changed by the user directly (e.g. pointing at their own Cloudflare account's database). Read the current file rather than assuming values from git history or older docs.

See [gotchas.md](./gotchas.md) for the one known (harmless) console error specific to the actual Worker build.
