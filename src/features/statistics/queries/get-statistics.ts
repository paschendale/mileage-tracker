import type { Vehicle } from "@/db/schema";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import {
	computeAvgCostPerKm,
	computeAvgFuelPrice,
	computeAvgKmPerL,
	computeAvgMonthlyDistance,
	computeAvgMonthlySpending,
	computeBestConsumption,
	computeDistanceTraveled,
	computeTotalLiters,
	computeWorstConsumption,
	groupByMonth,
	groupByYear,
	type MonthlyAggregate,
	type YearlyAggregate,
} from "@/services/stats";

export interface StatisticsData {
	vehicle: Vehicle;
	avgKmPerL: number | null;
	bestConsumption: number | null;
	worstConsumption: number | null;
	avgFuelPrice: number | null;
	avgCostPerKm: number | null;
	distanceTraveled: number;
	totalLiters: number;
	avgMonthlyDistance: number | null;
	avgMonthlySpending: number | null;
	monthly: MonthlyAggregate[];
	yearly: YearlyAggregate[];
}

export async function getStatisticsData(vehicle: Vehicle): Promise<StatisticsData> {
	const fillUps = await getVehicleFillUpsWithMetrics(vehicle.id);

	return {
		vehicle,
		avgKmPerL: computeAvgKmPerL(fillUps),
		bestConsumption: computeBestConsumption(fillUps),
		worstConsumption: computeWorstConsumption(fillUps),
		avgFuelPrice: computeAvgFuelPrice(fillUps),
		avgCostPerKm: computeAvgCostPerKm(fillUps),
		distanceTraveled: computeDistanceTraveled(fillUps),
		totalLiters: computeTotalLiters(fillUps),
		avgMonthlyDistance: computeAvgMonthlyDistance(fillUps),
		avgMonthlySpending: computeAvgMonthlySpending(fillUps),
		monthly: groupByMonth(fillUps),
		yearly: groupByYear(fillUps),
	};
}
