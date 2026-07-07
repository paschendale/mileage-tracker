import { FUEL_TYPES, type FuelType, type Vehicle } from "@/db/schema";
import {
	computeFuelTypeStats,
	computeMonthlyFuelPriceTrend,
	type FuelTypeStats,
	type MonthlyFuelPricePoint,
} from "@/services/fuel-comparison";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import { detectOutliers } from "@/services/outliers";
import {
	computeAvgMonthlyDistance,
	computeAvgMonthlySpending,
	computeBestConsumption,
	computeDistanceTraveled,
	computeFillUpCount,
	computeTotalLiters,
	computeTotalSpent,
	computeWorstConsumption,
	groupByMonth,
	groupByYear,
	type MonthlyAggregate,
	type YearlyAggregate,
} from "@/services/stats";

export interface FuelStatistics extends FuelTypeStats {
	/** Best/worst measured consumption for this fuel, excluding fill-ups flagged as consumption outliers. */
	bestConsumption: number | null;
	worstConsumption: number | null;
}

export interface StatisticsData {
	vehicle: Vehicle;
	/** Vehicle-level totals — fuel-agnostic, since these describe overall usage/cost regardless of what's in the tank. */
	distanceTraveled: number;
	totalSpent: number;
	totalLiters: number;
	fillUpCount: number;
	avgMonthlyDistance: number | null;
	avgMonthlySpending: number | null;
	perFuel: Record<FuelType, FuelStatistics>;
	monthly: MonthlyAggregate[];
	yearly: YearlyAggregate[];
	priceTrend: MonthlyFuelPricePoint[];
}

export async function getStatisticsData(vehicle: Vehicle): Promise<StatisticsData> {
	const fillUps = await getVehicleFillUpsWithMetrics(vehicle.id);

	const withPricePerLiter = fillUps.map((f) => ({
		...f,
		pricePerLiter: f.liters > 0 ? f.totalPrice / f.liters : 0,
	}));
	const outlierMap = detectOutliers(withPricePerLiter);

	const perFuel = Object.fromEntries(
		FUEL_TYPES.map((fuelType) => {
			const stats = computeFuelTypeStats(fillUps, fuelType, vehicle.tankCapacityLiters);
			// A row flagged as a consumption outlier (like a mistyped odometer reading)
			// shouldn't get to masquerade as this fuel's "best" or "worst" fill-up.
			const cleanRows = fillUps.filter(
				(f) => f.fuelType === fuelType && !outlierMap.get(f.id)?.consumptionKmPerL,
			);
			const fuelStatistics: FuelStatistics = {
				...stats,
				bestConsumption: computeBestConsumption(cleanRows),
				worstConsumption: computeWorstConsumption(cleanRows),
			};
			return [fuelType, fuelStatistics];
		}),
	) as Record<FuelType, FuelStatistics>;

	return {
		vehicle,
		distanceTraveled: computeDistanceTraveled(fillUps),
		totalSpent: computeTotalSpent(fillUps),
		totalLiters: computeTotalLiters(fillUps),
		fillUpCount: computeFillUpCount(fillUps),
		avgMonthlyDistance: computeAvgMonthlyDistance(fillUps),
		avgMonthlySpending: computeAvgMonthlySpending(fillUps),
		perFuel,
		monthly: groupByMonth(fillUps),
		yearly: groupByYear(fillUps),
		priceTrend: computeMonthlyFuelPriceTrend(fillUps),
	};
}
