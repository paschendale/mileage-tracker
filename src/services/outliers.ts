import type { FuelType } from "@/db/schema";

export type OutlierField = "pricePerLiter" | "efficiencyKmPerL";

export interface FieldOutlier {
	field: OutlierField;
	value: number;
	mean: number;
	/** (value - mean) / mean * 100 — drives human-readable tooltip copy. */
	percentDeviation: number;
	zScore: number;
}

export type OutlierFlags = Partial<Record<OutlierField, FieldOutlier>>;

export interface OutlierInput {
	id: number;
	fuelType: FuelType;
	pricePerLiter: number;
	efficiencyKmPerL: number | null;
}

/** |z| at or above this flags a row as an outlier. */
const Z_SCORE_THRESHOLD = 2;

/** Below this many same-fuel data points for a field, skip detection entirely — too noisy to trust. */
const MIN_SAMPLE_SIZE = 5;

function mean(values: readonly number[]): number {
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Sample standard deviation (n-1) — these are historical samples, not the full population. */
function stddev(values: readonly number[], avg: number): number {
	if (values.length < 2) return 0;
	const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
	return Math.sqrt(variance);
}

function detectFieldOutliers<T extends OutlierInput>(
	rows: readonly T[],
	field: OutlierField,
	getValue: (row: T) => number | null,
): Map<number, FieldOutlier> {
	const flagged = new Map<number, FieldOutlier>();

	const byFuelType = new Map<FuelType, { id: number; value: number }[]>();
	for (const row of rows) {
		const value = getValue(row);
		if (value === null) continue;
		const bucket = byFuelType.get(row.fuelType) ?? [];
		bucket.push({ id: row.id, value });
		byFuelType.set(row.fuelType, bucket);
	}

	for (const bucket of byFuelType.values()) {
		if (bucket.length < MIN_SAMPLE_SIZE) continue;

		const values = bucket.map((b) => b.value);
		const avg = mean(values);
		const sd = stddev(values, avg);
		if (sd === 0) continue;

		for (const { id, value } of bucket) {
			const zScore = (value - avg) / sd;
			if (Math.abs(zScore) >= Z_SCORE_THRESHOLD) {
				flagged.set(id, { field, value, mean: avg, percentDeviation: ((value - avg) / avg) * 100, zScore });
			}
		}
	}

	return flagged;
}

/**
 * Flags fill-ups whose price/L or efficiency deviates significantly from that
 * vehicle's own historical distribution for the same fuel type — gasoline and
 * ethanol have very different normal ranges, so they're never compared against
 * each other. Computed on read, never persisted, matching the rest of this app's
 * derived-metrics convention.
 */
export function detectOutliers<T extends OutlierInput>(rows: readonly T[]): Map<number, OutlierFlags> {
	const priceOutliers = detectFieldOutliers(rows, "pricePerLiter", (r) => r.pricePerLiter);
	const efficiencyOutliers = detectFieldOutliers(rows, "efficiencyKmPerL", (r) => r.efficiencyKmPerL);

	const result = new Map<number, OutlierFlags>();
	for (const row of rows) {
		const flags: OutlierFlags = {};
		const price = priceOutliers.get(row.id);
		const efficiency = efficiencyOutliers.get(row.id);
		if (price) flags.pricePerLiter = price;
		if (efficiency) flags.efficiencyKmPerL = efficiency;
		if (price || efficiency) result.set(row.id, flags);
	}

	return result;
}
