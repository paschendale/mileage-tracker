import type { FillUp, FuelType, Vehicle } from "@/db/schema";
import { FUEL_TYPES } from "@/db/schema";
import type { WithMetrics } from "@/services/consumption";
import { computeFuelRecommendation, computeFuelTypeStats, type FuelRecommendation, type FuelTypeStats } from "@/services/fuel-comparison";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
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
	perFuel: Record<FuelType, FuelTypeStats>;
	recommendation: FuelRecommendation;
	/** Fuel type of the most recent fill-up — the fuel switcher's default selection. */
	lastFillUpFuelType: FuelType;
}

function findLastFillUpFuelType(fillUps: readonly WithMetrics<FillUp>[]): FuelType {
	const latest = fillUps.reduce<WithMetrics<FillUp> | null>((latest, f) => {
		if (!latest) return f;
		if (f.date !== latest.date) return f.date > latest.date ? f : latest;
		return f.id > latest.id ? f : latest;
	}, null);
	return latest?.fuelType ?? FUEL_TYPES[0];
}

export async function getDashboardData(vehicle: Vehicle): Promise<DashboardData> {
	const fillUps = await getVehicleFillUpsWithMetrics(vehicle.id);

	const perFuel = Object.fromEntries(
		FUEL_TYPES.map((fuelType) => [fuelType, computeFuelTypeStats(fillUps, fuelType)]),
	) as Record<FuelType, FuelTypeStats>;

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
		perFuel,
		recommendation: computeFuelRecommendation(fillUps),
		lastFillUpFuelType: findLastFillUpFuelType(fillUps),
	};
}
