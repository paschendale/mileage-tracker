import { describe, expect, it } from "vitest";
import type { FuelType } from "@/db/schema";
import {
	computeFuelRecommendation,
	computeFuelTypeStats,
	computeMonthlyFuelPriceTrend,
	type FuelComparisonFillUp,
	type FuelTypeStats,
} from "./fuel-comparison";

function fuelTypeStats(overrides: Partial<FuelTypeStats> & Pick<FuelTypeStats, "fuelType">): FuelTypeStats {
	return {
		avgKmPerL: null,
		estimatedAutonomyKm: null,
		distanceTraveledKm: 0,
		intervalCount: 0,
		latestPricePerLiter: null,
		latestFillUpDate: null,
		avgCostPerKm: null,
		avgFuelPrice: null,
		totalSpent: 0,
		totalLiters: 0,
		fillUpCount: 0,
		...overrides,
	};
}

function row(
	id: number,
	odometerKm: number,
	liters: number,
	totalPrice: number,
	fuelType: FuelType,
	isFullTank: boolean,
	date = "2026-01-01",
): FuelComparisonFillUp {
	return { id, odometerKm, liters, totalPrice, fuelType, isFullTank, date };
}

describe("computeFuelTypeStats", () => {
	it("attributes an interval to the OPENING full tank's fuel, not the closing one", () => {
		// Gasoline@0km opens, ethanol@500km closes: 500km were driven on gasoline,
		// even though the closing fill-up (which conventionally displays consumption) is ethanol.
		const rows = [
			row(1, 0, 40, 200, "gasoline", true, "2026-01-01"),
			row(2, 500, 35, 250, "ethanol", true, "2026-01-10"),
		];

		const gasoline = computeFuelTypeStats(rows, "gasoline");
		const ethanol = computeFuelTypeStats(rows, "ethanol");

		expect(gasoline.intervalCount).toBe(1);
		expect(gasoline.distanceTraveledKm).toBe(500);
		expect(gasoline.avgKmPerL).toBeCloseTo(500 / 35, 5);

		expect(ethanol.intervalCount).toBe(0);
		expect(ethanol.distanceTraveledKm).toBe(0);
		expect(ethanol.avgKmPerL).toBeNull();
	});

	it("sums liters of partials in an interval opened by one fuel and closed with the same fuel", () => {
		const rows = [
			row(1, 0, 40, 200, "ethanol", true, "2026-01-01"),
			row(2, 200, 8, 45, "ethanol", false, "2026-01-05"),
			row(3, 600, 30, 160, "ethanol", true, "2026-01-15"),
		];

		const ethanol = computeFuelTypeStats(rows, "ethanol");

		expect(ethanol.intervalCount).toBe(1);
		expect(ethanol.distanceTraveledKm).toBe(600);
		expect(ethanol.avgKmPerL).toBeCloseTo(600 / (8 + 30), 5);
	});

	it("computes estimated autonomy as tank capacity times measured avg km/L", () => {
		const rows = [
			row(1, 0, 40, 200, "ethanol", true, "2026-01-01"),
			row(2, 200, 8, 45, "ethanol", false, "2026-01-05"),
			row(3, 600, 30, 160, "ethanol", true, "2026-01-15"),
		];
		const avgKmPerL = 600 / (8 + 30);

		const withCapacity = computeFuelTypeStats(rows, "ethanol", 50);
		expect(withCapacity.estimatedAutonomyKm).toBeCloseTo(50 * avgKmPerL, 5);

		// Without a known tank capacity there's nothing to multiply by, so it's
		// left null (shown as "—") rather than guessed at.
		const withoutCapacity = computeFuelTypeStats(rows, "ethanol");
		expect(withoutCapacity.estimatedAutonomyKm).toBeNull();
	});

	it("computes historical avgFuelPrice and latestPricePerLiter across all rows of a fuel, interval-agnostic", () => {
		const rows = [
			row(1, 0, 40, 200, "gasoline", true, "2026-01-01"),
			row(2, 400, 38, 220, "gasoline", true, "2026-02-01"),
		];

		const gasoline = computeFuelTypeStats(rows, "gasoline");

		expect(gasoline.avgFuelPrice).toBeCloseTo((200 + 220) / (40 + 38), 5);
		expect(gasoline.latestPricePerLiter).toBeCloseTo(220 / 38, 5);
		expect(gasoline.latestFillUpDate).toBe("2026-02-01");
		expect(gasoline.totalSpent).toBe(420);
		expect(gasoline.totalLiters).toBe(78);
		expect(gasoline.fillUpCount).toBe(2);
	});

	it("returns nulls and zero counts when a fuel type has no rows at all", () => {
		const rows = [row(1, 0, 40, 200, "gasoline", true, "2026-01-01")];

		const ethanol = computeFuelTypeStats(rows, "ethanol");

		expect(ethanol.avgKmPerL).toBeNull();
		expect(ethanol.estimatedAutonomyKm).toBeNull();
		expect(ethanol.latestPricePerLiter).toBeNull();
		expect(ethanol.latestFillUpDate).toBeNull();
		expect(ethanol.avgCostPerKm).toBeNull();
		expect(ethanol.avgFuelPrice).toBeNull();
		expect(ethanol.fillUpCount).toBe(0);
	});
});

describe("computeFuelRecommendation", () => {
	it("matches the spec's worked example: cost/km, break-even price, and personalized ratio", () => {
		// From the spec: gasoline 12.79 km/L, ethanol 11.36 km/L, prices 6.49/4.79.
		const gasoline = fuelTypeStats({ fuelType: "gasoline", avgKmPerL: 12.79, intervalCount: 24 });
		const ethanol = fuelTypeStats({ fuelType: "ethanol", avgKmPerL: 11.36, intervalCount: 18 });

		const recommendation = computeFuelRecommendation(gasoline, ethanol, { gasoline: 6.49, ethanol: 4.79 });

		expect(recommendation.gasolineCostPerKm).toBeCloseTo(0.507, 3);
		expect(recommendation.ethanolCostPerKm).toBeCloseTo(0.422, 3);
		expect(recommendation.breakEvenEthanolPricePerLiter).toBeCloseTo(5.76, 2);
		expect(recommendation.personalizedEthanolRatio).toBeCloseTo(0.888, 3);
		expect(recommendation.todayPriceRatio).toBeCloseTo(4.79 / 6.49, 5);
		expect(recommendation.recommended).toBe("ethanol");
		expect(recommendation.reason).toBe("ethanol-cheaper");
		expect(recommendation.confidence).toBe("high");
	});

	it("returns insufficient-data when either fuel has zero full-tank intervals", () => {
		const gasoline = fuelTypeStats({ fuelType: "gasoline", avgKmPerL: 12, intervalCount: 10 });
		const ethanol = fuelTypeStats({ fuelType: "ethanol", avgKmPerL: null, intervalCount: 0 });

		const recommendation = computeFuelRecommendation(gasoline, ethanol, { gasoline: 6, ethanol: 4 });

		expect(recommendation.recommended).toBeNull();
		expect(recommendation.reason).toBe("insufficient-data");
		expect(recommendation.confidence).toBeNull();
		expect(recommendation.gasolineCostPerKm).toBeNull();
	});

	it("classifies confidence off the lower of the two fuels' interval counts", () => {
		const make = (fuelType: FuelType, intervalCount: number) => fuelTypeStats({ fuelType, avgKmPerL: 10, intervalCount });
		const prices = { gasoline: 5, ethanol: 5 };

		expect(computeFuelRecommendation(make("gasoline", 3), make("ethanol", 20), prices).confidence).toBe("low");
		expect(computeFuelRecommendation(make("gasoline", 8), make("ethanol", 20), prices).confidence).toBe("medium");
		expect(computeFuelRecommendation(make("gasoline", 20), make("ethanol", 16), prices).confidence).toBe("high");
	});

	it("recommends gasoline when it has the lower cost/km", () => {
		const gasoline = fuelTypeStats({ fuelType: "gasoline", avgKmPerL: 12, intervalCount: 10 });
		const ethanol = fuelTypeStats({ fuelType: "ethanol", avgKmPerL: 8, intervalCount: 10 });

		// gasoline cost/km = 5/12 ~= 0.417, ethanol cost/km = 5/8 = 0.625 -> gasoline cheaper
		const recommendation = computeFuelRecommendation(gasoline, ethanol, { gasoline: 5, ethanol: 5 });

		expect(recommendation.recommended).toBe("gasoline");
		expect(recommendation.reason).toBe("gasoline-cheaper");
		expect(recommendation.deltaPercent).toBeGreaterThan(0);
	});

	it("reports a tie when both fuels' cost/km is within the tie threshold", () => {
		const gasoline = fuelTypeStats({ fuelType: "gasoline", avgKmPerL: 10, intervalCount: 10 });
		const ethanol = fuelTypeStats({ fuelType: "ethanol", avgKmPerL: 7, intervalCount: 10 });

		// gasoline cost/km = 10/10 = 1.0, ethanol cost/km = 7/7 = 1.0 -> exact match by construction
		const recommendation = computeFuelRecommendation(gasoline, ethanol, { gasoline: 10, ethanol: 7 });

		expect(recommendation.recommended).toBeNull();
		expect(recommendation.reason).toBe("tie");
		expect(recommendation.deltaPercent).toBe(0);
	});
});

describe("computeMonthlyFuelPriceTrend", () => {
	it("computes a per-fuel avg price/L per month, leaving a fuel null in months with no purchase", () => {
		const rows = [
			row(1, 0, 40, 200, "gasoline", true, "2026-01-05"), // 5.00/L
			row(2, 400, 38, 209, "gasoline", true, "2026-01-20"), // 5.50/L
			row(3, 800, 35, 210, "ethanol", true, "2026-02-01"), // 6.00/L
		];

		const trend = computeMonthlyFuelPriceTrend(rows);

		expect(trend).toEqual([
			{ month: "2026-01", gasoline: (200 + 209) / (40 + 38), ethanol: null },
			{ month: "2026-02", gasoline: null, ethanol: 6 },
		]);
	});

	it("returns an empty array for no rows", () => {
		expect(computeMonthlyFuelPriceTrend([])).toEqual([]);
	});
});
