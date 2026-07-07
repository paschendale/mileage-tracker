import { describe, expect, it } from "vitest";
import type { FuelType } from "@/db/schema";
import {
	computeFuelRecommendation,
	computeFuelTypeStats,
	computeMonthlyFuelPriceTrend,
	type FuelComparisonFillUp,
} from "./fuel-comparison";

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
		expect(ethanol.avgCostPerKm).toBeNull();
		expect(ethanol.avgFuelPrice).toBeNull();
		expect(ethanol.fillUpCount).toBe(0);
	});
});

describe("computeFuelRecommendation", () => {
	it("flags insufficient-data when a fuel has fewer than MIN_RELIABLE_INTERVALS intervals", () => {
		const rows = [
			row(1, 0, 40, 200, "gasoline", true, "2026-01-01"),
			row(2, 400, 38, 220, "gasoline", true, "2026-02-01"),
			row(3, 800, 36, 210, "gasoline", true, "2026-03-01"),
			// only one ethanol row ever -> zero ethanol intervals
			row(4, 1200, 35, 180, "ethanol", true, "2026-04-01"),
		];

		const recommendation = computeFuelRecommendation(rows);

		expect(recommendation.recommended).toBeNull();
		expect(recommendation.reason).toBe("insufficient-data");
	});

	it("recommends the fuel with the lower forward-looking cost per km", () => {
		// One continuous odometer sequence: gasoline block (0-1000km) then ethanol
		// block (1500-2500km), same shape as the "tie" test below but with ethanol
		// priced much cheaper this time.
		// Gasoline: distance 1500km / liters 109L, latest price 190/38 = 5.00/L
		//   -> cost/km = 5.00/(1500/109) ~= 0.3633
		// Ethanol: distance 1000km / liters 67L, latest price 99/33 = 3.00/L
		//   -> cost/km = 3.00/(1000/67) ~= 0.2010 (clearly cheaper)
		const rows = [
			row(1, 0, 40, 200, "gasoline", true, "2026-01-01"),
			row(2, 500, 35, 175, "gasoline", true, "2026-01-10"),
			row(3, 1000, 38, 190, "gasoline", true, "2026-01-20"),
			row(4, 1500, 36, 108, "ethanol", true, "2026-01-25"),
			row(5, 2000, 34, 102, "ethanol", true, "2026-02-01"),
			row(6, 2500, 33, 99, "ethanol", true, "2026-02-10"),
		];

		const recommendation = computeFuelRecommendation(rows);

		expect(recommendation.gasoline.avgCostPerKm).toBeCloseTo(0.3633, 3);
		expect(recommendation.ethanol.avgCostPerKm).toBeCloseTo(0.201, 3);
		expect(recommendation.recommended).toBe("ethanol");
		expect(recommendation.reason).toBe("ethanol-cheaper");
		expect(recommendation.deltaPercent).toBeGreaterThan(0);
	});

	it("reports a tie when both fuels' cost/km is within the tie threshold", () => {
		// One continuous odometer sequence (as a real vehicle's history must be): a
		// gasoline block (0-1000km) followed by an ethanol block (1500-2500km). The
		// 1000-1500km interval crosses fuels (opened by gasoline's last full tank,
		// closed by ethanol's first) and is correctly attributed to gasoline.
		// Gasoline: distance 1500km / liters 109L, latest price 190/38 = 5.00/L
		//   -> cost/km = 5.00/(1500/109) = 545/1500 = 0.363333...
		// Ethanol: distance 1000km / liters 67L, latest price (11990/67)/33 = 5.4229/L
		//   -> cost/km = (11990/2211)/(1000/67) = 11990/33000 = 0.363333... (exact match by construction)
		const rows = [
			row(1, 0, 40, 200, "gasoline", true, "2026-01-01"),
			row(2, 500, 35, 175, "gasoline", true, "2026-01-10"),
			row(3, 1000, 38, 190, "gasoline", true, "2026-01-20"),
			row(4, 1500, 36, 180, "ethanol", true, "2026-01-25"),
			row(5, 2000, 34, 170, "ethanol", true, "2026-02-01"),
			row(6, 2500, 33, 11990 / 67, "ethanol", true, "2026-02-10"),
		];

		const recommendation = computeFuelRecommendation(rows);

		expect(recommendation.gasoline.intervalCount).toBeGreaterThanOrEqual(2);
		expect(recommendation.ethanol.intervalCount).toBeGreaterThanOrEqual(2);
		expect(recommendation.gasoline.avgCostPerKm).toBeCloseTo(recommendation.ethanol.avgCostPerKm!, 5);
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
