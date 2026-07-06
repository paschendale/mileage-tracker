import { describe, expect, it } from "vitest";
import {
	computeAvgCostPerKm,
	computeAvgFuelPrice,
	computeAvgKmPerL,
	computeBestConsumption,
	computeDistanceTraveled,
	computeEstimatedAutonomyKm,
	computeTotalLiters,
	computeTotalSpent,
	computeWorstConsumption,
	groupByMonth,
	type StatsFillUp,
} from "./stats";

function row(partial: Partial<StatsFillUp> & Pick<StatsFillUp, "odometerKm" | "liters" | "totalPrice">): StatsFillUp {
	return {
		date: "2026-01-01",
		isFullTank: true,
		consumptionKmPerL: null,
		...partial,
	};
}

describe("stats", () => {
	const rows: StatsFillUp[] = [
		row({ odometerKm: 0, liters: 40, totalPrice: 200, date: "2026-01-01", isFullTank: true, consumptionKmPerL: null }),
		row({
			odometerKm: 700,
			liters: 10,
			totalPrice: 60,
			date: "2026-01-15",
			isFullTank: false,
			consumptionKmPerL: null,
		}),
		row({
			odometerKm: 900,
			liters: 25,
			totalPrice: 150,
			date: "2026-02-01",
			isFullTank: true,
			consumptionKmPerL: 900 / 35,
		}),
	];

	it("computes totals", () => {
		expect(computeTotalSpent(rows)).toBe(410);
		expect(computeTotalLiters(rows)).toBe(75);
		expect(computeDistanceTraveled(rows)).toBe(900);
	});

	it("computes weighted avg fuel price and cost/km", () => {
		expect(computeAvgFuelPrice(rows)).toBeCloseTo(410 / 75, 5);
		expect(computeAvgCostPerKm(rows)).toBeCloseTo(410 / 900, 5);
	});

	it("computes weighted avg km/L across the bounded full-tank region", () => {
		expect(computeAvgKmPerL(rows)).toBeCloseTo(900 / 35, 5);
	});

	it("computes best/worst consumption from non-null values only", () => {
		expect(computeBestConsumption(rows)).toBeCloseTo(900 / 35, 5);
		expect(computeWorstConsumption(rows)).toBeCloseTo(900 / 35, 5);
	});

	it("computes estimated autonomy as the mean full-tank interval distance", () => {
		expect(computeEstimatedAutonomyKm(rows)).toBe(900);
	});

	it("groups spending and liters by month", () => {
		const months = groupByMonth(rows);
		expect(months).toEqual([
			{ month: "2026-01", totalSpent: 260, totalLiters: 50 },
			{ month: "2026-02", totalSpent: 150, totalLiters: 25 },
		]);
	});

	it("returns null for stats that need data when given an empty list", () => {
		expect(computeAvgKmPerL([])).toBeNull();
		expect(computeAvgFuelPrice([])).toBeNull();
		expect(computeEstimatedAutonomyKm([])).toBeNull();
		expect(computeBestConsumption([])).toBeNull();
	});
});
