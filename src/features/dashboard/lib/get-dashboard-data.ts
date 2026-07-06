import type { Vehicle } from "@/db/schema";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import type { WithMetrics } from "@/services/consumption";
import type { FillUp } from "@/db/schema";
import {
	computeAvgCostPerKm,
	computeAvgFuelPrice,
	computeAvgKmPerL,
	computeDaysSinceLastFillUp,
	computeDistanceTraveled,
	computeEstimatedAutonomyKm,
	computeFillUpCount,
	computeTotalLiters,
	computeTotalSpent,
} from "@/services/stats";

export interface DashboardData {
	vehicle: Vehicle;
	fillUps: WithMetrics<FillUp>[];
	avgKmPerL: number | null;
	avgFuelPrice: number | null;
	avgCostPerKm: number | null;
	totalSpent: number;
	totalLiters: number;
	distanceTraveled: number;
	fillUpCount: number;
	daysSinceLastFillUp: number | null;
	estimatedAutonomyKm: number | null;
}

export async function getDashboardData(vehicle: Vehicle): Promise<DashboardData> {
	const fillUps = await getVehicleFillUpsWithMetrics(vehicle.id);

	return {
		vehicle,
		fillUps,
		avgKmPerL: computeAvgKmPerL(fillUps),
		avgFuelPrice: computeAvgFuelPrice(fillUps),
		avgCostPerKm: computeAvgCostPerKm(fillUps),
		totalSpent: computeTotalSpent(fillUps),
		totalLiters: computeTotalLiters(fillUps),
		distanceTraveled: computeDistanceTraveled(fillUps),
		fillUpCount: computeFillUpCount(fillUps),
		daysSinceLastFillUp: computeDaysSinceLastFillUp(fillUps),
		estimatedAutonomyKm: computeEstimatedAutonomyKm(fillUps),
	};
}
