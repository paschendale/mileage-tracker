import { describe, expect, it } from "vitest";
import type { FuelType } from "@/db/schema";
import { detectOutliers, type OutlierInput } from "./outliers";

function row(id: number, fuelType: FuelType, pricePerLiter: number, efficiencyKmPerL: number | null = null): OutlierInput {
	return { id, fuelType, pricePerLiter, efficiencyKmPerL };
}

describe("detectOutliers", () => {
	it("skips detection when a fuel-type bucket has fewer than the minimum sample size", () => {
		// Only 4 gasoline rows -- below MIN_SAMPLE_SIZE (5) -- even though the last is a wild outlier.
		const rows = [
			row(1, "gasoline", 5.0),
			row(2, "gasoline", 5.1),
			row(3, "gasoline", 4.9),
			row(4, "gasoline", 50.0),
		];

		const flags = detectOutliers(rows);

		expect(flags.size).toBe(0);
	});

	it("skips detection when all values in a bucket are identical (zero stddev)", () => {
		const rows = [
			row(1, "gasoline", 5.0),
			row(2, "gasoline", 5.0),
			row(3, "gasoline", 5.0),
			row(4, "gasoline", 5.0),
			row(5, "gasoline", 5.0),
		];

		const flags = detectOutliers(rows);

		expect(flags.size).toBe(0);
	});

	it("flags a clear price outlier once the sample is large enough", () => {
		const rows = [
			row(1, "gasoline", 5.0),
			row(2, "gasoline", 5.1),
			row(3, "gasoline", 4.9),
			row(4, "gasoline", 5.05),
			row(5, "gasoline", 4.95),
			row(6, "gasoline", 15.0), // obviously mistyped price
		];

		const flags = detectOutliers(rows);

		expect(flags.has(6)).toBe(true);
		expect(flags.get(6)!.pricePerLiter).toBeDefined();
		expect(flags.get(6)!.pricePerLiter!.zScore).toBeGreaterThanOrEqual(2);
		expect(flags.has(1)).toBe(false);
	});

	it("flags a clear efficiency outlier independently of price", () => {
		const rows = [
			row(1, "ethanol", 3.0, 8.0),
			row(2, "ethanol", 3.0, 8.2),
			row(3, "ethanol", 3.0, 7.8),
			row(4, "ethanol", 3.0, 8.1),
			row(5, "ethanol", 3.0, 7.9),
			row(6, "ethanol", 3.0, 1.5), // implausibly low efficiency
		];

		const flags = detectOutliers(rows);

		expect(flags.has(6)).toBe(true);
		expect(flags.get(6)!.efficiencyKmPerL).toBeDefined();
		expect(flags.get(6)!.pricePerLiter).toBeUndefined();
	});

	it("never compares one fuel type's distribution against another's", () => {
		// Gasoline normally ~5.0/L, ethanol normally ~3.0/L -- neither is an outlier
		// within its own bucket, even though 3.0 would look extreme among gasoline prices.
		const rows = [
			row(1, "gasoline", 5.0),
			row(2, "gasoline", 5.1),
			row(3, "gasoline", 4.9),
			row(4, "gasoline", 5.05),
			row(5, "gasoline", 4.95),
			row(6, "ethanol", 3.0),
			row(7, "ethanol", 3.1),
			row(8, "ethanol", 2.9),
			row(9, "ethanol", 3.05),
			row(10, "ethanol", 2.95),
		];

		const flags = detectOutliers(rows);

		expect(flags.size).toBe(0);
	});
});
