import { describe, expect, it } from "vitest";
import { withComputedMetrics } from "./efficiency";

interface Row {
	id: number;
	odometerKm: number;
	liters: number;
	date: string;
	isFullTank: boolean;
}

function row(id: number, odometerKm: number, liters: number, isFullTank: boolean, date = "2026-01-01"): Row {
	return { id, odometerKm, liters, isFullTank, date };
}

describe("withComputedMetrics", () => {
	it("computes efficiency for two immediately adjacent full tanks", () => {
		const rows = [row(1, 0, 40, true), row(2, 450, 38, true)];

		const result = withComputedMetrics(rows);

		expect(result[1]!.efficiencyKmPerL).toBeCloseTo(450 / 38, 5);
		expect(result[1]!.distanceSincePreviousKm).toBe(450);
	});

	it("discards the leg into a full tank when the immediately preceding row is a partial", () => {
		const rows = [row(1, 450, 40, true), row(2, 700, 10, false), row(3, 900, 25, true)];

		const result = withComputedMetrics(rows);

		// row 2 (partial) never gets efficiency; row 3 is a full tank, but its
		// immediate predecessor (row 2) is a partial, so the leg is discarded
		// entirely rather than estimated from summed liters.
		expect(result[1]!.efficiencyKmPerL).toBeNull();
		expect(result[2]!.efficiencyKmPerL).toBeNull();

		// distanceSincePreviousKm is unaffected by tank status — always defined.
		expect(result[0]!.distanceSincePreviousKm).toBeNull();
		expect(result[1]!.distanceSincePreviousKm).toBe(250);
		expect(result[2]!.distanceSincePreviousKm).toBe(200);
	});

	it("the very first row in a vehicle's history is always null, regardless of tank status", () => {
		const rows = [row(1, 0, 40, true), row(2, 477, 41.26, true)];

		const result = withComputedMetrics(rows);

		// row 1 has no previous row to pair with — no more mirroring special case.
		expect(result[0]!.efficiencyKmPerL).toBeNull();
		expect(result[1]!.efficiencyKmPerL).toBeCloseTo(477 / 41.26, 5);
	});

	it("discards a leg when the immediately preceding row is a partial, across a chain of partials", () => {
		const rows = [
			row(1, 0, 40, true),
			row(2, 200, 8, false),
			row(3, 350, 12, false),
			row(4, 600, 30, true),
		];

		const result = withComputedMetrics(rows);

		// row 4 is a full tank, but row 3 (its immediate predecessor) is a
		// partial, so the leg into row 4 is discarded, not estimated.
		expect(result[1]!.efficiencyKmPerL).toBeNull();
		expect(result[2]!.efficiencyKmPerL).toBeNull();
		expect(result[3]!.efficiencyKmPerL).toBeNull();
	});

	it("leaves efficiency null when there's no adjacent full-tank pair at all", () => {
		const rows = [row(1, 0, 40, false), row(2, 300, 35, true), row(3, 600, 10, false)];

		const result = withComputedMetrics(rows);

		expect(result[0]!.efficiencyKmPerL).toBeNull();
		// row 2 is full, but row 1 (its predecessor) is a partial -> discarded.
		expect(result[1]!.efficiencyKmPerL).toBeNull();
		// row 3 is a partial -> never gets efficiency.
		expect(result[2]!.efficiencyKmPerL).toBeNull();
	});

	it("cross-validates against a real slice of data.json (all rows treated as full tanks)", () => {
		// First 6 entries from data.json, seeded with isFullTank = true per the
		// project's seed decision. With every row a full tank, every consecutive
		// pair is adjacent-full-to-full, matching how the source file's own
		// consumption_km_per_l values were computed.
		const rows = [
			row(1, 0, 39.15, true, "2025-11-07"),
			row(2, 477, 41.26, true, "2025-11-12"),
			row(3, 904, 42.09, true, "2025-11-18"),
			row(4, 988, 7.23, true, "2025-11-20"),
			row(5, 1220, 17.04, true, "2025-11-20"),
			row(6, 1612, 31.39, true, "2025-11-20"),
		];

		const result = withComputedMetrics(rows);

		expect(result[1]!.efficiencyKmPerL).toBeCloseTo(11.56, 1);
		expect(result[2]!.efficiencyKmPerL).toBeCloseTo(10.14, 1);
		expect(result[3]!.efficiencyKmPerL).toBeCloseTo(11.62, 1);
		expect(result[4]!.efficiencyKmPerL).toBeCloseTo(13.62, 1);
		expect(result[5]!.efficiencyKmPerL).toBeCloseTo(12.49, 1);
	});

	it("sorts unordered input by odometer before computing, and pairs by adjacency after sorting", () => {
		const rows = [row(3, 900, 25, true), row(1, 450, 40, true), row(2, 700, 10, false)];

		const result = withComputedMetrics(rows);

		expect(result.map((r) => r.id)).toEqual([1, 2, 3]);
		// After sorting: id1(450,full) -> id2(700,partial) -> id3(900,full).
		// row id3's immediate predecessor (id2) is a partial, so the leg is
		// discarded — this demonstrates sort-then-adjacency, not sort-then-sum.
		expect(result[2]!.efficiencyKmPerL).toBeNull();
	});
});
