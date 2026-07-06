# Architecture

Next.js 16 (App Router) + React 19 + TypeScript strict, TailwindCSS v4 + shadcn/ui (built on **Base UI**, not Radix — see [gotchas.md](./gotchas.md)), Drizzle ORM + Cloudflare D1, next-safe-action + Zod, Recharts, deployed as a Cloudflare Worker via `@opennextjs/cloudflare`.

## Folder layout

```
src/
  app/              routes only — (auth)/login, (app)/{dashboard,fillups,statistics,vehicles}
  components/       generic shared UI (ui/ = shadcn primitives, layout/, charts/, skeletons/)
  features/         feature-owned components/actions/schemas/queries (auth, vehicles, fillups, dashboard, statistics)
  services/         pure business logic — consumption.ts, stats.ts, fillups.ts (no DB imports except fillups.ts's orchestration)
  db/               schema/ (Drizzle tables), queries/ (raw row fetchers, no business logic), index.ts (getDb())
  lib/              auth.ts, safe-action.ts, selected-vehicle.ts, format.ts, constants.ts
  hooks/, utils/    small generic helpers (use-debounced-value, pagination, group-by)
```

Each feature under `src/features/<name>/` owns its own `components/`, `actions/`, `schemas/`, `queries/` — don't reach across features; go through `services/` or `db/queries/` instead.

## Data flow for a page

Server Component page → `db/queries/*` (raw rows) or `services/fillups.ts` (`getVehicleFillUpsWithMetrics`, rows + derived consumption) → `services/stats.ts` (aggregates) → render. Mutations go through `authActionClient`-wrapped Server Actions in each feature's `actions/`, which call `revalidatePath` on every affected route (see [business-logic.md](./business-logic.md) for why that's cheap here).

## Vehicle selection

`src/lib/selected-vehicle.ts`'s `getSelectedVehicleContext()` resolves the active vehicle server-side from a plain (non-HttpOnly) `selected_vehicle_id` cookie, falling back to the first vehicle by `createdAt`. The client-side switcher (`features/vehicles/components/vehicle-switcher.tsx`) writes both that cookie and a `mt:selectedVehicleId` localStorage key (localStorage is the spec's source of truth; the cookie just lets Server Components read it during SSR). `vehicle-context-sync.tsx` reconciles the two on mount if they disagree.
