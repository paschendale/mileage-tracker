import type { TripType } from "@/db/schema";
import { sortByOdometer, type MinimalFillUp, type WithMetrics } from "./efficiency";

export interface TripComparisonFillUp extends WithMetrics<MinimalFillUp> {
	totalPrice: number;
	tripType: TripType;
}

export interface TripTypeStats {
	tripType: TripType;
	/** Weighted avg km/L over legs (adjacent full-tank pairs) closed by this trip type. */
	avgKmPerL: number | null;
	/** tankCapacityLiters * avgKmPerL — "how far a full tank lasts on this trip type". Null if capacity is unknown. */
	estimatedAutonomyKm: number | null;
	/** Total distance covered by legs closed by this trip type. */
	distanceTraveledKm: number;
	/** Sample size behind the two numbers above. Field name matches FuelTypeStats for shared table components. */
	intervalCount: number;
	/** totalPrice/liters of the single most recent fill-up of this trip type. */
	latestPricePerLiter: number | null;
	/** date ('YYYY-MM-DD') of the single most recent fill-up of this trip type. */
	latestFillUpDate: string | null;
	/** latestPricePerLiter / avgKmPerL — "what would a km cost me on this trip type today". */
	avgCostPerKm: number | null;
	/** sum(totalPrice)/sum(liters) across every fill-up of this trip type (historical, leg-agnostic). */
	avgFuelPrice: number | null;
	totalSpent: number;
	totalLiters: number;
	fillUpCount: number;
}

/**
 * A "leg" is a row with a defined `efficiencyKmPerL` (an adjacent full-tank
 * pair), attributed to its own `tripType` — the driving that led up to the
 * closing fill-up of that leg. `totalSpent`/`totalLiters`/`fillUpCount`/
 * `avgFuelPrice` use every row of this trip type (not just legs), since those
 * aren't consumption math.
 */
export function computeTripTypeStats(
	rows: readonly TripComparisonFillUp[],
	tripType: TripType,
	tankCapacityLiters?: number | null,
): TripTypeStats {
	const legs = rows.filter((r) => r.efficiencyKmPerL !== null && r.tripType === tripType);

	const distanceTraveledKm = legs.reduce((sum, r) => sum + (r.distanceSincePreviousKm ?? 0), 0);
	const litersSum = legs.reduce((sum, r) => sum + r.liters, 0);
	const avgKmPerL = litersSum > 0 ? distanceTraveledKm / litersSum : null;
	const estimatedAutonomyKm =
		tankCapacityLiters !== null && tankCapacityLiters !== undefined && avgKmPerL !== null
			? tankCapacityLiters * avgKmPerL
			: null;

	const tripRows = rows.filter((r) => r.tripType === tripType);
	const totalSpent = tripRows.reduce((sum, r) => sum + r.totalPrice, 0);
	const totalLiters = tripRows.reduce((sum, r) => sum + r.liters, 0);
	const avgFuelPrice = totalLiters > 0 ? totalSpent / totalLiters : null;

	const latestRow = tripRows.reduce<TripComparisonFillUp | null>((latest, r) => {
		if (!latest) return r;
		if (r.date !== latest.date) return r.date > latest.date ? r : latest;
		return r.id > latest.id ? r : latest;
	}, null);
	const latestPricePerLiter = latestRow && latestRow.liters > 0 ? latestRow.totalPrice / latestRow.liters : null;
	const latestFillUpDate = latestRow?.date ?? null;
	const avgCostPerKm = latestPricePerLiter !== null && avgKmPerL ? latestPricePerLiter / avgKmPerL : null;

	return {
		tripType,
		avgKmPerL,
		estimatedAutonomyKm,
		distanceTraveledKm,
		intervalCount: legs.length,
		latestPricePerLiter,
		latestFillUpDate,
		avgCostPerKm,
		avgFuelPrice,
		totalSpent,
		totalLiters,
		fillUpCount: tripRows.length,
	};
}

export interface TripEfficiencyPoint {
	date: string;
	road: number | null;
	city: number | null;
}

/**
 * One point per leg (row with a defined efficiencyKmPerL), sorted by odometer,
 * value placed under whichever trip type closed that leg and null for the
 * other — feeds a 2-line chart via MultiSeriesLineChart, whose connectNulls
 * handles each line skipping over the other trip type's points.
 */
export function computeTripEfficiencyPoints(rows: readonly TripComparisonFillUp[]): TripEfficiencyPoint[] {
	const legs = sortByOdometer(rows).filter((r) => r.efficiencyKmPerL !== null);

	return legs.map((r) => ({
		date: r.date,
		road: r.tripType === "road" ? r.efficiencyKmPerL! : null,
		city: r.tripType === "city" ? r.efficiencyKmPerL! : null,
	}));
}
