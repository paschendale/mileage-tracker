import { describe, expect, it } from "vitest";
import { withComputedMetrics } from "./consumption";

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
	it("matches the spec's worked example: full, partial, full", () => {
		const rows = [row(1, 450, 40, true), row(2, 700, 10, false), row(3, 900, 25, true)];

		const result = withComputedMetrics(rows);

		// The opening full tank (450km) mirrors the interval it opens, since it can
		// never be anyone's "closing" row and would otherwise be permanently null.
		expect(result[0]!.consumptionKmPerL).toBeCloseTo((900 - 450) / (10 + 25), 5);
		expect(result[1]!.consumptionKmPerL).toBeNull();
		expect(result[2]!.consumptionKmPerL).toBeCloseTo((900 - 450) / (10 + 25), 5);

		expect(result[0]!.distanceSincePreviousKm).toBeNull();
		expect(result[1]!.distanceSincePreviousKm).toBe(250);
		expect(result[2]!.distanceSincePreviousKm).toBe(200);
	});

	it("mirrors the first interval's consumption onto the very first full tank of a vehicle's history", () => {
		// This is the case that can never otherwise get a value: it has no
		// preceding full tank, so under the base rule it would stay null forever.
		const rows = [row(1, 0, 40, true), row(2, 477, 41.26, true)];

		const result = withComputedMetrics(rows);

		expect(result[1]!.consumptionKmPerL).toBeCloseTo(477 / 41.26, 5);
		expect(result[0]!.consumptionKmPerL).toBeCloseTo(477 / 41.26, 5);
	});

	it("does not mirror onto the first row when it isn't itself a full tank", () => {
		const rows = [row(1, 0, 40, false), row(2, 300, 35, true), row(3, 600, 30, true)];

		const result = withComputedMetrics(rows);

		// row 1 opens no interval of its own (it's a partial before the first full
		// tank) -- it has nothing to mirror and correctly stays null.
		expect(result[0]!.consumptionKmPerL).toBeNull();
		expect(result[2]!.consumptionKmPerL).toBeCloseTo(300 / 30, 5);
	});

	it("handles a chain of two consecutive partials between two full tanks", () => {
		const rows = [
			row(1, 0, 40, true),
			row(2, 200, 8, false),
			row(3, 350, 12, false),
			row(4, 600, 30, true),
		];

		const result = withComputedMetrics(rows);

		// distance 600-0=600, liters = 8 + 12 + 30 (partials + closing full)
		expect(result[3]!.consumptionKmPerL).toBeCloseTo(600 / (8 + 12 + 30), 5);
		expect(result[1]!.consumptionKmPerL).toBeNull();
		expect(result[2]!.consumptionKmPerL).toBeNull();
	});

	it("leaves consumption null before the first full tank and with no closing full tank", () => {
		const rows = [row(1, 0, 40, false), row(2, 300, 35, true), row(3, 600, 10, false)];

		const result = withComputedMetrics(rows);

		expect(result[0]!.consumptionKmPerL).toBeNull();
		// only one full tank exists, so no interval can be closed
		expect(result[1]!.consumptionKmPerL).toBeNull();
		expect(result[2]!.consumptionKmPerL).toBeNull();
	});

	it("cross-validates against a real slice of data.json (all rows treated as full tanks)", () => {
		// First 6 entries from data.json, seeded with isFullTank = true per the
		// project's seed decision. With every row a full tank, the algorithm
		// degenerates to simple consecutive-row division — matching how the
		// source file's own consumption_km_per_l values were computed.
		const rows = [
			row(1, 0, 39.15, true, "2025-11-07"),
			row(2, 477, 41.26, true, "2025-11-12"),
			row(3, 904, 42.09, true, "2025-11-18"),
			row(4, 988, 7.23, true, "2025-11-20"),
			row(5, 1220, 17.04, true, "2025-11-20"),
			row(6, 1612, 31.39, true, "2025-11-20"),
		];

		const result = withComputedMetrics(rows);

		expect(result[1]!.consumptionKmPerL).toBeCloseTo(11.56, 1);
		expect(result[2]!.consumptionKmPerL).toBeCloseTo(10.14, 1);
		expect(result[3]!.consumptionKmPerL).toBeCloseTo(11.62, 1);
		expect(result[4]!.consumptionKmPerL).toBeCloseTo(13.62, 1);
		expect(result[5]!.consumptionKmPerL).toBeCloseTo(12.49, 1);
	});

	it("sorts unordered input by odometer before computing", () => {
		const rows = [row(3, 900, 25, true), row(1, 450, 40, true), row(2, 700, 10, false)];

		const result = withComputedMetrics(rows);

		expect(result.map((r) => r.id)).toEqual([1, 2, 3]);
		expect(result[2]!.consumptionKmPerL).toBeCloseTo((900 - 450) / (10 + 25), 5);
	});
});
