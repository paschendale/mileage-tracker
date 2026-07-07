import type { FillUp, FuelType, Vehicle } from "@/db/schema";
import { FUEL_TYPES } from "@/db/schema";
import type { WithMetrics } from "@/services/consumption";
import { computeFuelTypeStats, type FuelTypeStats } from "@/services/fuel-comparison";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import { computeDaysSinceLastFillUp } from "@/services/stats";

export interface DashboardData {
	vehicle: Vehicle;
	fillUps: WithMetrics<FillUp>[];
	daysSinceLastFillUp: number | null;
	perFuel: Record<FuelType, FuelTypeStats>;
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
		FUEL_TYPES.map((fuelType) => [fuelType, computeFuelTypeStats(fillUps, fuelType, vehicle.tankCapacityLiters)]),
	) as Record<FuelType, FuelTypeStats>;

	return {
		vehicle,
		fillUps,
		daysSinceLastFillUp: computeDaysSinceLastFillUp(fillUps),
		perFuel,
		lastFillUpFuelType: findLastFillUpFuelType(fillUps),
	};
}
