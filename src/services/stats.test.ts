import { describe, expect, it } from "vitest";
import {
	computeAvgCostPerKm,
	computeAvgFuelPrice,
	computeAvgKmPerL,
	computeBestEfficiency,
	computeDistanceTraveled,
	computeEstimatedAutonomyKm,
	computeTotalLiters,
	computeTotalSpent,
	computeWorstEfficiency,
	groupByMonth,
	type StatsFillUp,
} from "./stats";

function row(partial: Partial<StatsFillUp> & Pick<StatsFillUp, "odometerKm" | "liters" | "totalPrice">): StatsFillUp {
	return {
		date: "2026-01-01",
		isFullTank: true,
		distanceSincePreviousKm: null,
		efficiencyKmPerL: null,
		...partial,
	};
}

describe("stats", () => {
	// row 1 opens the history (no previous row -> no efficiency). row 2 is a
	// partial in between (never gets efficiency). row 3 is a full tank whose
	// immediate predecessor (row 2) is a partial, so per the adjacent-pair
	// rule it also has no defined efficiency -- only row 4 (full tank whose
	// predecessor, row 3, is also full) has a defined leg: 300km / 25L.
	const rows: StatsFillUp[] = [
		row({ odometerKm: 0, liters: 40, totalPrice: 200, date: "2026-01-01", isFullTank: true }),
		row({
			odometerKm: 700,
			liters: 10,
			totalPrice: 60,
			date: "2026-01-15",
			isFullTank: false,
			distanceSincePreviousKm: 700,
		}),
		row({
			odometerKm: 900,
			liters: 15,
			totalPrice: 90,
			date: "2026-01-20",
			isFullTank: true,
			distanceSincePreviousKm: 200,
		}),
		row({
			odometerKm: 1200,
			liters: 25,
			totalPrice: 150,
			date: "2026-02-01",
			isFullTank: true,
			distanceSincePreviousKm: 300,
			efficiencyKmPerL: 300 / 25,
		}),
	];

	it("computes totals", () => {
		expect(computeTotalSpent(rows)).toBe(500);
		expect(computeTotalLiters(rows)).toBe(90);
		expect(computeDistanceTraveled(rows)).toBe(1200);
	});

	it("computes weighted avg fuel price and cost/km", () => {
		expect(computeAvgFuelPrice(rows)).toBeCloseTo(500 / 90, 5);
		expect(computeAvgCostPerKm(rows)).toBeCloseTo(500 / 1200, 5);
	});

	it("computes distance-weighted avg km/L across rows with defined efficiency", () => {
		expect(computeAvgKmPerL(rows)).toBeCloseTo(300 / 25, 5);
	});

	it("computes best/worst efficiency from non-null values only", () => {
		expect(computeBestEfficiency(rows)).toBeCloseTo(300 / 25, 5);
		expect(computeWorstEfficiency(rows)).toBeCloseTo(300 / 25, 5);
	});

	it("computes estimated autonomy as the mean distance across legs with defined efficiency", () => {
		expect(computeEstimatedAutonomyKm(rows)).toBe(300);
	});

	it("groups spending and liters by month", () => {
		const months = groupByMonth(rows);
		expect(months).toEqual([
			{ month: "2026-01", totalSpent: 350, totalLiters: 65 },
			{ month: "2026-02", totalSpent: 150, totalLiters: 25 },
		]);
	});

	it("returns null for stats that need data when given an empty list", () => {
		expect(computeAvgKmPerL([])).toBeNull();
		expect(computeAvgFuelPrice([])).toBeNull();
		expect(computeEstimatedAutonomyKm([])).toBeNull();
		expect(computeBestEfficiency([])).toBeNull();
	});
});
