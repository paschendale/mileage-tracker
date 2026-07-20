import { FUEL_TYPES, TRIP_TYPES, type FuelType, type TripType, type Vehicle } from "@/db/schema";
import {
	computeFuelTypeStats,
	computeMonthlyFuelPriceTrend,
	type FuelTypeStats,
	type MonthlyFuelPricePoint,
} from "@/services/fuel-comparison";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import { detectOutliers } from "@/services/outliers";
import { computeTripTypeStats, type TripTypeStats } from "@/services/trip-comparison";
import {
	computeAvgMonthlyDistance,
	computeAvgMonthlySpending,
	computeBestEfficiency,
	computeDistanceTraveled,
	computeFillUpCount,
	computeTotalLiters,
	computeTotalSpent,
	computeWorstEfficiency,
	groupByMonth,
	groupByYear,
	type MonthlyAggregate,
	type YearlyAggregate,
} from "@/services/stats";

export interface FuelStatistics extends FuelTypeStats {
	/** Best/worst measured efficiency for this fuel, excluding fill-ups flagged as efficiency outliers. */
	bestEfficiency: number | null;
	worstEfficiency: number | null;
}

export interface TripStatistics extends TripTypeStats {
	/** Best/worst measured efficiency for this trip type, excluding fill-ups flagged as efficiency outliers. */
	bestEfficiency: number | null;
	worstEfficiency: number | null;
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
	perTripType: Record<TripType, TripStatistics>;
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
			// A row flagged as an efficiency outlier (like a mistyped odometer reading)
			// shouldn't get to masquerade as this fuel's "best" or "worst" fill-up.
			const cleanRows = fillUps.filter(
				(f) => f.fuelType === fuelType && !outlierMap.get(f.id)?.efficiencyKmPerL,
			);
			const fuelStatistics: FuelStatistics = {
				...stats,
				bestEfficiency: computeBestEfficiency(cleanRows),
				worstEfficiency: computeWorstEfficiency(cleanRows),
			};
			return [fuelType, fuelStatistics];
		}),
	) as Record<FuelType, FuelStatistics>;

	const perTripType = Object.fromEntries(
		TRIP_TYPES.map((tripType) => {
			const stats = computeTripTypeStats(fillUps, tripType, vehicle.tankCapacityLiters);
			// Same outlier exclusion as perFuel, reused as-is: outlier detection
			// answers "is this a data-entry mistake for this vehicle/fuel", which
			// is orthogonal to trip type.
			const cleanRows = fillUps.filter((f) => f.tripType === tripType && !outlierMap.get(f.id)?.efficiencyKmPerL);
			const tripStatistics: TripStatistics = {
				...stats,
				bestEfficiency: computeBestEfficiency(cleanRows),
				worstEfficiency: computeWorstEfficiency(cleanRows),
			};
			return [tripType, tripStatistics];
		}),
	) as Record<TripType, TripStatistics>;

	return {
		vehicle,
		distanceTraveled: computeDistanceTraveled(fillUps),
		totalSpent: computeTotalSpent(fillUps),
		totalLiters: computeTotalLiters(fillUps),
		fillUpCount: computeFillUpCount(fillUps),
		avgMonthlyDistance: computeAvgMonthlyDistance(fillUps),
		avgMonthlySpending: computeAvgMonthlySpending(fillUps),
		perFuel,
		perTripType,
		monthly: groupByMonth(fillUps),
		yearly: groupByYear(fillUps),
		priceTrend: computeMonthlyFuelPriceTrend(fillUps),
	};
}
