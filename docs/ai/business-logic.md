# Business logic

## Consumption (`src/services/consumption.ts`)

**Never stored — always derived on read** from a vehicle's fill-ups. This is why creating/editing/deleting a fill-up never needs cascading recalculation: mutations just `revalidatePath` the affected routes, and the next read recomputes everything fresh.

Rules, implemented in `withComputedMetrics()`:
- Distance since previous = `current.odometerKm - previous.odometerKm`, defined for every consecutive pair (full or partial), after sorting by odometer.
- Consumption is defined **only** between two full-tank fill-ups. Walk the indices of `isFullTank` rows; for each consecutive pair, sum the `liters` of every row strictly after the opening full tank through the closing full tank inclusive (partials + the closing fill), divide the odometer delta by that sum, assign the result to the closing row only. Every other row's consumption is `null`.
- Worked example from the spec (also a test case): Full@450km/40L, Partial@700km/10L, Full@900km/25L → `(900-450)/(10+25) ≈ 12.857`, assigned to the 900km row.

Tests in `consumption.test.ts` cover the worked example, a 2-partial chain, boundary cases (no closing full tank), and a cross-check against a real 6-row slice of `data.json`.

## Statistics (`src/services/stats.ts`)

Single source of truth for every dashboard/statistics number — don't recompute these ad hoc elsewhere.

- **Avg km/L**: weighted by the bounded full-tank region — `(lastFullOdometer - firstFullOdometer) / litersInThatRegion`, not an unweighted mean of per-interval values.
- **Avg fuel price**: `sum(totalPrice) / sum(liters)`. **Avg cost/km**: `sum(totalPrice) / (maxOdometer - minOdometer)`.
- **Estimated autonomy**: mean of the per-interval distance between consecutive full tanks (no tank-capacity field exists, so this is the only data-grounded estimate).
- **Monthly/yearly grouping**: `groupByMonth`/`groupByYear` key on `date.slice(0,7)` / `date.slice(0,4)` — `date` is always a plain `YYYY-MM-DD` string, never a `Date` object, specifically to avoid timezone bugs (lexical sort == chronological sort for that format).

These interpretations (autonomy, cost/km weighting, monthly span definition) aren't spec-literal — they're documented, reasonable choices. If a task touches these, keep the reasoning in mind rather than "simplifying" to an unweighted mean.

## Seed data (`data.json` + `scripts/generate-seed-sql.ts`)

Every row is seeded with `isFullTank = true` (matches how the source file's own `consumption_km_per_l` was computed — consecutive-row division). Field mapping: `alcohol`→`ethanol`, `cost_brl`→`totalPrice`, `odometer_km`→`odometerKm`, `note`→`notes`. The source's own `distance_since_last_km`/`consumption_km_per_l` are always dropped — never trust imported calculated fields.
