# Database

Drizzle ORM over Cloudflare D1 (SQLite). Schema in `src/db/schema/{vehicle,fillup,index}.ts`.

- `vehicles`: id, name, thumbnailUrl (nullable), createdAt.
- `fillUps`: id, vehicleId (FK, `onDelete: cascade`), createdAt, date (`YYYY-MM-DD` text, not a timestamp), odometerKm, liters, totalPrice, fuelType (enum: gasoline/ethanol/diesel/flex/cng, SQL `CHECK` constraint), isFullTank, notes (nullable). Indexes on vehicleId, date, odometerKm, and a compound (vehicleId, odometerKm) for the actual hot query pattern.
- Deleting a vehicle explicitly deletes its fill-ups first in the Server Action (`features/vehicles/actions/delete-vehicle.ts`) rather than relying solely on the FK cascade — defense in depth in case D1's `foreign_keys` pragma is ever off.

## Changing the schema

```bash
npm run db:generate        # drizzle-kit generate -> new SQL file in migrations/
npm run db:migrate:local   # apply to local D1 (.wrangler/state)
npm run db:migrate:remote  # apply to production D1 — don't run this yourself, let the user run it
```

## Seeding

`npm run db:seed` runs `scripts/generate-seed-sql.ts` (reads `data.json`, transforms fields — see [business-logic.md](./business-logic.md)) then pipes the generated SQL into `wrangler d1 execute --local`. It's idempotent per `(vehicle, odometerKm)`: re-running it only inserts rows that don't already exist, so it's safe to re-run after editing `data.json`.

`getDb()` in `src/db/index.ts` reads the D1 binding via `getCloudflareContext().env` — the exact binding name is whatever `wrangler.jsonc`'s `d1_databases[0].binding` currently says; check that file rather than assuming a name if something doesn't compile.
