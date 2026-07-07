import { FUEL_TYPES, type FuelType } from "@/db/schema";
import { groupBy } from "@/utils/group-by";
import { findFullTankIntervals, sortByOdometer, type MinimalFillUp } from "./consumption";

export interface FuelComparisonFillUp extends MinimalFillUp {
	totalPrice: number;
	fuelType: FuelType;
}

export interface FuelTypeStats {
	fuelType: FuelType;
	/** Weighted avg km/L over full-tank intervals OPENED by this fuel. */
	avgKmPerL: number | null;
	/** tankCapacityLiters * avgKmPerL — "how far a full tank of this fuel lasts". Null if capacity is unknown. */
	estimatedAutonomyKm: number | null;
	/** Total distance covered by intervals opened by this fuel. */
	distanceTraveledKm: number;
	/** Sample size behind the two numbers above — gates recommendation reliability. */
	intervalCount: number;
	/** totalPrice/liters of the single most recent fill-up of this fuel. */
	latestPricePerLiter: number | null;
	/** latestPricePerLiter / avgKmPerL — "what would a km cost me if I filled up with this today". */
	avgCostPerKm: number | null;
	/** sum(totalPrice)/sum(liters) across every fill-up of this fuel (historical, not interval-gated). */
	avgFuelPrice: number | null;
	totalSpent: number;
	totalLiters: number;
	fillUpCount: number;
}

/**
 * The fuel that "powered" a full-tank interval is whichever fuel was filled at
 * the OPENING full tank, not the closing one — a flex-fuel car runs on what's
 * already in the tank until the next fill-up, regardless of what's poured in
 * at that next (closing) fill-up. Naively filtering the flat row array by each
 * row's own fuelType before reusing full-tank-interval math would misattribute
 * distance/consumption to the wrong fuel; intervals must be grouped by `open.fuelType`.
 */
export function computeFuelTypeStats(
	rows: readonly FuelComparisonFillUp[],
	fuelType: FuelType,
	tankCapacityLiters?: number | null,
): FuelTypeStats {
	const sorted = sortByOdometer(rows);
	const intervals = findFullTankIntervals(sorted).filter((interval) => interval.open.fuelType === fuelType);

	const distanceTraveledKm = intervals.reduce((sum, interval) => sum + interval.distanceKm, 0);
	const litersSum = intervals.reduce((sum, interval) => sum + interval.litersSum, 0);
	const avgKmPerL = litersSum > 0 ? distanceTraveledKm / litersSum : null;
	const estimatedAutonomyKm =
		tankCapacityLiters !== null && tankCapacityLiters !== undefined && avgKmPerL !== null
			? tankCapacityLiters * avgKmPerL
			: null;

	const fuelRows = rows.filter((r) => r.fuelType === fuelType);
	const totalSpent = fuelRows.reduce((sum, r) => sum + r.totalPrice, 0);
	const totalLiters = fuelRows.reduce((sum, r) => sum + r.liters, 0);
	const avgFuelPrice = totalLiters > 0 ? totalSpent / totalLiters : null;

	const latestRow = fuelRows.reduce<FuelComparisonFillUp | null>((latest, r) => {
		if (!latest) return r;
		if (r.date !== latest.date) return r.date > latest.date ? r : latest;
		return r.id > latest.id ? r : latest;
	}, null);
	const latestPricePerLiter = latestRow && latestRow.liters > 0 ? latestRow.totalPrice / latestRow.liters : null;
	const avgCostPerKm = latestPricePerLiter !== null && avgKmPerL ? latestPricePerLiter / avgKmPerL : null;

	return {
		fuelType,
		avgKmPerL,
		estimatedAutonomyKm,
		distanceTraveledKm,
		intervalCount: intervals.length,
		latestPricePerLiter,
		avgCostPerKm,
		avgFuelPrice,
		totalSpent,
		totalLiters,
		fillUpCount: fuelRows.length,
	};
}

/** Below this many full-tank intervals for a fuel, its avg km/L is too noisy to trust for a recommendation. */
export const MIN_RELIABLE_INTERVALS = 2;

/** Within this relative gap, treat the two fuels' cost/km as a tie rather than picking a "winner". */
const TIE_THRESHOLD = 0.01;

export type FuelRecommendationReason = "insufficient-data" | "gasoline-cheaper" | "ethanol-cheaper" | "tie";

export interface FuelRecommendation {
	recommended: FuelType | null;
	reason: FuelRecommendationReason;
	gasoline: FuelTypeStats;
	ethanol: FuelTypeStats;
	/** % the recommended fuel undercuts the other's cost/km. Null when there's no clear winner. */
	deltaPercent: number | null;
}

function isReliable(stats: FuelTypeStats): boolean {
	return stats.intervalCount >= MIN_RELIABLE_INTERVALS && stats.avgCostPerKm !== null;
}

export function computeFuelRecommendation(
	rows: readonly FuelComparisonFillUp[],
	tankCapacityLiters?: number | null,
): FuelRecommendation {
	const gasoline = computeFuelTypeStats(rows, "gasoline", tankCapacityLiters);
	const ethanol = computeFuelTypeStats(rows, "ethanol", tankCapacityLiters);

	if (!isReliable(gasoline) || !isReliable(ethanol)) {
		return { recommended: null, reason: "insufficient-data", gasoline, ethanol, deltaPercent: null };
	}

	const gasolineCostPerKm = gasoline.avgCostPerKm!;
	const ethanolCostPerKm = ethanol.avgCostPerKm!;
	const higher = Math.max(gasolineCostPerKm, ethanolCostPerKm);
	const lower = Math.min(gasolineCostPerKm, ethanolCostPerKm);

	if ((higher - lower) / higher < TIE_THRESHOLD) {
		return { recommended: null, reason: "tie", gasoline, ethanol, deltaPercent: 0 };
	}

	const recommended: FuelType = gasolineCostPerKm < ethanolCostPerKm ? "gasoline" : "ethanol";
	const reason: FuelRecommendationReason = recommended === "gasoline" ? "gasoline-cheaper" : "ethanol-cheaper";
	const deltaPercent = ((higher - lower) / higher) * 100;

	return { recommended, reason, gasoline, ethanol, deltaPercent };
}

export interface MonthlyFuelPricePoint {
	month: string; // 'YYYY-MM'
	gasoline: number | null;
	ethanol: number | null;
}

/**
 * Avg price/L per fuel per month (sum totalPrice / sum liters within the
 * month+fuel bucket) — a fuel with no purchases that month is left `null`
 * rather than interpolated, since we don't know what it would have cost.
 */
export function computeMonthlyFuelPriceTrend(rows: readonly FuelComparisonFillUp[]): MonthlyFuelPricePoint[] {
	const months = groupBy(rows, (r) => r.date.slice(0, 7));

	return [...months.entries()]
		.map(([month, monthRows]) => {
			const point: MonthlyFuelPricePoint = { month, gasoline: null, ethanol: null };
			for (const fuelType of FUEL_TYPES) {
				const fuelRows = monthRows.filter((r) => r.fuelType === fuelType);
				const liters = fuelRows.reduce((sum, r) => sum + r.liters, 0);
				if (liters > 0) {
					point[fuelType] = fuelRows.reduce((sum, r) => sum + r.totalPrice, 0) / liters;
				}
			}
			return point;
		})
		.sort((a, b) => a.month.localeCompare(b.month));
}
