import type { FillUp, FuelType, Vehicle } from "@/db/schema";
import { FUEL_TYPES } from "@/db/schema";
import type { WithMetrics } from "@/services/efficiency";
import {
	computeFuelEfficiencyTrend,
	computeFuelTypeStats,
	type FuelEfficiencyTrend,
	type FuelTypeStats,
} from "@/services/fuel-comparison";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import { detectOutliers } from "@/services/outliers";
import { computeDaysSinceLastFillUp } from "@/services/stats";

export type DashboardFillUp = WithMetrics<FillUp> & { isPersonalBest: boolean };

export interface DashboardData {
	vehicle: Vehicle;
	fillUps: DashboardFillUp[];
	daysSinceLastFillUp: number | null;
	perFuel: Record<FuelType, FuelTypeStats>;
	efficiencyTrend: Record<FuelType, FuelEfficiencyTrend>;
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

/** Same outlier-excluded "record holder per fuel type" rule as get-fillups.ts and get-statistics.ts. */
function withPersonalBest(fillUps: readonly WithMetrics<FillUp>[]): DashboardFillUp[] {
	const withPricePerLiter = fillUps.map((f) => ({
		...f,
		pricePerLiter: f.liters > 0 ? f.totalPrice / f.liters : 0,
	}));
	const outlierMap = detectOutliers(withPricePerLiter);

	const bestByFuelType = new Map<FuelType, number>();
	for (const f of fillUps) {
		if (f.efficiencyKmPerL === null || outlierMap.get(f.id)?.efficiencyKmPerL) continue;
		const current = bestByFuelType.get(f.fuelType);
		if (current === undefined || f.efficiencyKmPerL > current) bestByFuelType.set(f.fuelType, f.efficiencyKmPerL);
	}

	return fillUps.map((f) => ({
		...f,
		isPersonalBest: f.efficiencyKmPerL !== null && bestByFuelType.get(f.fuelType) === f.efficiencyKmPerL,
	}));
}

export async function getDashboardData(vehicle: Vehicle): Promise<DashboardData> {
	const fillUps = await getVehicleFillUpsWithMetrics(vehicle.id);

	const perFuel = Object.fromEntries(
		FUEL_TYPES.map((fuelType) => [fuelType, computeFuelTypeStats(fillUps, fuelType, vehicle.tankCapacityLiters)]),
	) as Record<FuelType, FuelTypeStats>;

	const efficiencyTrend = Object.fromEntries(
		FUEL_TYPES.map((fuelType) => [fuelType, computeFuelEfficiencyTrend(fillUps, fuelType)]),
	) as Record<FuelType, FuelEfficiencyTrend>;

	return {
		vehicle,
		fillUps: withPersonalBest(fillUps),
		daysSinceLastFillUp: computeDaysSinceLastFillUp(fillUps),
		perFuel,
		efficiencyTrend,
		lastFillUpFuelType: findLastFillUpFuelType(fillUps),
	};
}
