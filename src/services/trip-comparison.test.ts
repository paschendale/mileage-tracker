import { describe, expect, it } from "vitest";
import type { TripType } from "@/db/schema";
import { withComputedMetrics } from "./efficiency";
import { computeTripTypeStats, type TripComparisonFillUp } from "./trip-comparison";

interface RawRow {
	id: number;
	odometerKm: number;
	liters: number;
	totalPrice: number;
	tripType: TripType;
	isFullTank: boolean;
	date: string;
}

function row(
	id: number,
	odometerKm: number,
	liters: number,
	totalPrice: number,
	tripType: TripType,
	isFullTank: boolean,
	date = "2026-01-01",
): RawRow {
	return { id, odometerKm, liters, totalPrice, tripType, isFullTank, date };
}

/** Mirrors production: withComputedMetrics runs first, then services consume the result. */
function withMetrics(rows: readonly RawRow[]): TripComparisonFillUp[] {
	return withComputedMetrics(rows);
}

describe("computeTripTypeStats", () => {
	it("attributes a leg to the CLOSING fill-up's trip type", () => {
		const rows = withMetrics([
			row(1, 0, 40, 200, "road", true, "2026-01-01"),
			row(2, 500, 35, 250, "city", true, "2026-01-10"),
		]);

		const road = computeTripTypeStats(rows, "road");
		const city = computeTripTypeStats(rows, "city");

		expect(city.intervalCount).toBe(1);
		expect(city.distanceTraveledKm).toBe(500);
		expect(city.avgKmPerL).toBeCloseTo(500 / 35, 5);

		expect(road.intervalCount).toBe(0);
		expect(road.distanceTraveledKm).toBe(0);
		expect(road.avgKmPerL).toBeNull();
	});

	it("discards the leg into a full tank whose immediate predecessor is a partial", () => {
		const rows = withMetrics([
			row(1, 0, 40, 200, "road", true, "2026-01-01"),
			row(2, 200, 8, 45, "road", false, "2026-01-05"),
			row(3, 600, 30, 160, "road", true, "2026-01-15"),
		]);

		const road = computeTripTypeStats(rows, "road");

		expect(road.intervalCount).toBe(0);
		expect(road.distanceTraveledKm).toBe(0);
		expect(road.avgKmPerL).toBeNull();
	});

	it("computes estimated autonomy as tank capacity times measured avg km/L", () => {
		const rows = withMetrics([
			row(1, 0, 40, 200, "city", true, "2026-01-01"),
			row(2, 450, 38, 210, "city", true, "2026-01-15"),
		]);
		const avgKmPerL = 450 / 38;

		const withCapacity = computeTripTypeStats(rows, "city", 50);
		expect(withCapacity.estimatedAutonomyKm).toBeCloseTo(50 * avgKmPerL, 5);

		const withoutCapacity = computeTripTypeStats(rows, "city");
		expect(withoutCapacity.estimatedAutonomyKm).toBeNull();
	});

	it("computes historical avgFuelPrice and latestPricePerLiter across all rows of a trip type, leg-agnostic", () => {
		const rows = withMetrics([
			row(1, 0, 40, 200, "road", true, "2026-01-01"),
			row(2, 400, 38, 220, "road", true, "2026-02-01"),
		]);

		const road = computeTripTypeStats(rows, "road");

		expect(road.avgFuelPrice).toBeCloseTo((200 + 220) / (40 + 38), 5);
		expect(road.latestPricePerLiter).toBeCloseTo(220 / 38, 5);
		expect(road.latestFillUpDate).toBe("2026-02-01");
		expect(road.totalSpent).toBe(420);
		expect(road.totalLiters).toBe(78);
		expect(road.fillUpCount).toBe(2);
	});

	it("returns nulls and zero counts when a trip type has no rows at all", () => {
		const rows = withMetrics([row(1, 0, 40, 200, "road", true, "2026-01-01")]);

		const city = computeTripTypeStats(rows, "city");

		expect(city.avgKmPerL).toBeNull();
		expect(city.estimatedAutonomyKm).toBeNull();
		expect(city.latestPricePerLiter).toBeNull();
		expect(city.latestFillUpDate).toBeNull();
		expect(city.avgCostPerKm).toBeNull();
		expect(city.avgFuelPrice).toBeNull();
		expect(city.fillUpCount).toBe(0);
	});
});
