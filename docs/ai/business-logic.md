# Business logic

## Consumption (`src/services/efficiency.ts`)

**Never stored — always derived on read** from a vehicle's fill-ups. This is why creating/editing/deleting a fill-up never needs cascading recalculation: mutations just `revalidatePath` the affected routes, and the next read recomputes everything fresh.

Rules, implemented in `withComputedMetrics()`:
- Distance since previous = `current.odometerKm - previous.odometerKm`, defined for every consecutive pair (full or partial), after sorting by odometer.
- Efficiency (`efficiencyKmPerL`) is defined **only** when a row and the row immediately before it (by odometer) are both full tanks: `(row[i].odometerKm - row[i-1].odometerKm) / row[i].liters` — the later row's own liters. There is no multi-row interval concept: a full tank immediately preceded by a partial gets `null` (that leg is discarded, not estimated), and the very first row in a vehicle's history is always `null` (no previous row to pair with).
- Worked example: Full@0km/40L, Full@450km/38L → `450/38 ≈ 11.84`, assigned to the 450km row only. A Partial@700km between two full tanks means the *next* full tank's leg is discarded entirely, not summed with the partial's liters.

Tests in `efficiency.test.ts` cover the happy path (two adjacent full tanks), the discarded-leg case (full tank preceded by a partial), the always-null first row, and a cross-check against a real 6-row slice of `data.json` (all rows full tank, so every consecutive pair qualifies).

## Statistics (`src/services/stats.ts`)

Single source of truth for every dashboard/statistics number — don't recompute these ad hoc elsewhere.

- **Avg km/L**: distance-weighted mean over exactly the rows with a defined `efficiencyKmPerL` (each an adjacent full-tank-to-full-tank leg) — `sum(distanceSincePreviousKm) / sum(liters)` across those rows, not an unweighted mean of per-leg values.
- **Avg fuel price**: `sum(totalPrice) / sum(liters)`. **Avg cost/km**: `sum(totalPrice) / (maxOdometer - minOdometer)`. Both use every row, independent of the leg/efficiency rule above.
- **Estimated autonomy**: mean of `distanceSincePreviousKm` over that same filtered row set (no tank-capacity field exists on `fillUps` itself, so this is the only data-grounded estimate — `vehicles.tankCapacityLiters`, where set, is used separately by `fuel-comparison.ts`/`trip-comparison.ts` to project an estimated range).
- **Monthly/yearly grouping**: `groupByMonth`/`groupByYear` key on `date.slice(0,7)` / `date.slice(0,4)` — `date` is always a plain `YYYY-MM-DD` string, never a `Date` object, specifically to avoid timezone bugs (lexical sort == chronological sort for that format).

These interpretations (autonomy, cost/km weighting, monthly span definition) aren't spec-literal — they're documented, reasonable choices. If a task touches these, keep the reasoning in mind rather than "simplifying" to an unweighted mean.

## Fuel & trip comparison (`src/services/fuel-comparison.ts`, `src/services/trip-comparison.ts`)

`computeFuelTypeStats`/`computeTripTypeStats` both filter to rows with a defined `efficiencyKmPerL` matching the given `fuelType`/`tripType` (a "leg" is attributed to whatever fuel/trip type is tagged on the row that closes it — the later row of the adjacent full-tank pair), then apply the same distance-weighted avg km/L and mean-distance autonomy formulas as above, scoped to that bucket. `totalSpent`/`totalLiters`/`fillUpCount`/`avgFuelPrice` for a bucket use *all* rows of that fuel/trip type (not just ones with a defined leg), since those aren't consumption math.

Trip type (`road`/`city`) is `NOT NULL` at the DB level with a default of `'city'` — historical fill-ups that predated this field were backfilled to `'city'` by migration `0004` (a table-rebuild, since SQLite can't `ALTER` a column with a CHECK constraint in place; the generated migration's `INSERT...SELECT` had to be hand-edited to `COALESCE("trip_type", 'city')`, since SQLite doesn't apply a column's DEFAULT when the SELECT explicitly yields the existing NULL). The fill-up form's Zod schema still requires an explicit choice for every new/edited fill-up — the DB default is a backfill safety net, not a form default; the form deliberately never pre-selects a value.

Both the Statistics and Dashboard pages render `perFuel`/`perTripType` (and, on the dashboard, `perFuelByTripType` — gasoline vs. ethanol computed separately within each trip type, powering two trip-scoped fuel recommendations) through one shared `ComparisonTable` component (`src/components/comparison-table.tsx`), always showing every group side by side rather than hiding one behind a toggle.

## Seed data (`data.json` + `scripts/generate-seed-sql.ts`)

Every row is seeded with `isFullTank = true` (matches how the source file's own `consumption_km_per_l` was computed — consecutive-row division). Field mapping: `alcohol`→`ethanol`, `cost_brl`→`totalPrice`, `odometer_km`→`odometerKm`, `note`→`notes`. The source's own `distance_since_last_km`/`consumption_km_per_l` are always dropped — never trust imported calculated fields. Seeded rows get `trip_type = 'city'` via the column's DB default — the seed script's INSERT statement never mentions `trip_type`.
