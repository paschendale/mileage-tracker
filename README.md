# Mileage Tracker

A personal, single-user fuel consumption tracker. Next.js (App Router) + Drizzle ORM + Cloudflare D1, deployed entirely on Cloudflare Workers via the OpenNext adapter.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- TailwindCSS v4 + shadcn/ui (Base UI primitives)
- Drizzle ORM + Cloudflare D1
- next-safe-action + Zod for Server Actions
- Recharts for charts
- `@opennextjs/cloudflare` for the Cloudflare Workers deploy target (not the deprecated, Edge-only `@cloudflare/next-on-pages`)

## Business logic

Consumption is **never** stored — it's always derived from a vehicle's fill-ups on read, in `src/services/consumption.ts`. Distance since previous is defined for every consecutive fill-up; fuel consumption is only ever defined between two full-tank fill-ups, with any partial fill-ups in between contributing their liters to that interval without producing their own consumption value. Because nothing is cached, creating/editing/deleting a fill-up never requires cascading recalculation — every mutating Server Action just calls `revalidatePath` on the affected routes.

All dashboard/statistics numbers are computed by `src/services/stats.ts` from that same derived data (weighted averages, monthly/yearly grouping, etc.) — see the file for the exact formulas and their rationale.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure secrets

Copy the example env file and set your own token:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set `AUTH_TOKEN` to whatever you want your login token to be. This file is gitignored and never committed.

### 3. Apply database migrations (local D1)

```bash
npm run db:migrate:local
```

This applies every migration in `migrations/` to the local D1 instance (stored under `.wrangler/state`).

### 4. Seed the database

```bash
npm run db:seed
```

Reads `data.json` from the repo root, creates the "HRV" vehicle if it doesn't exist, and imports every fill-up (mapping `alcohol` → `ethanol`, dropping the source file's own `distance_since_last_km`/`consumption_km_per_l` fields since those are always recomputed by the app). Safe to re-run — it's idempotent per `(vehicle, odometer)` and won't duplicate rows.

To seed a fresh set of fill-ups, edit or replace `data.json` and re-run `npm run db:seed`.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). This runs the plain Next.js dev server with `initOpenNextCloudflareForDev()` wired in `next.config.ts` so `getCloudflareContext()` (D1, env vars) works locally without a full Workers build.

### Running tests

```bash
npm test
```

Vitest unit tests for the consumption engine and statistics aggregations, including a cross-check against a real slice of `data.json`.

### Linting / type-checking

```bash
npm run lint
npx tsc --noEmit
```

## Database migrations

Schema lives in `src/db/schema/`. After changing it:

```bash
npm run db:generate        # drizzle-kit generate -> new SQL file in migrations/
npm run db:migrate:local   # apply to local D1
npm run db:migrate:remote  # apply to production D1 (run this yourself when ready)
```

## Deploying to Cloudflare

This project deploys as a Cloudflare **Worker** (not classic Pages) via the OpenNext Cloudflare adapter — Cloudflare's current recommended path for Next.js App Router + Server Actions + D1.

1. **D1 database**: `wrangler.jsonc` already points at a database named `mileage-tracker-db` with a specific `database_id`. If you're setting this up under your own Cloudflare account, create your own database and update `database_id` in `wrangler.jsonc`:
   ```bash
   npx wrangler d1 create mileage-tracker-db
   ```
2. **Apply migrations to production**:
   ```bash
   npm run db:migrate:remote
   ```
3. **Seed production** (optional, only if you want the same historical data live):
   ```bash
   npm run db:seed:remote
   ```
4. **Set the production secret** (never put this in `wrangler.jsonc`):
   ```bash
   npx wrangler secret put AUTH_TOKEN
   ```
5. **Preview the actual Worker build locally** before deploying:
   ```bash
   npm run preview
   ```
6. **Deploy**:
   ```bash
   npm run deploy
   ```

### Known issue: harmless console error on the deployed Worker build

When served through the actual `wrangler dev`/deployed Worker build (not plain `next dev`), next-themes' inline flash-prevention script (embedded in every page's `<head>` to set the correct light/dark class before hydration) throws a `ReferenceError: __name is not defined` in the browser console. This is an upstream bundling artifact in `@opennextjs/cloudflare`'s static-asset processing — it does **not** occur with plain `next build`/`next start`, and it does **not** break anything: verified with Playwright that hydration, the login flow, dropdown menus, and the theme toggle all work correctly despite it. The only real-world consequence is a possible brief flash of the wrong theme on a cold load in production, plus the console error itself. Worth revisiting if a future `@opennextjs/cloudflare` release changes its static asset bundling.
