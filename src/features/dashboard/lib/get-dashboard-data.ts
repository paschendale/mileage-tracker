import { FUEL_TYPES, TRIP_TYPES, type FillUp, type FuelType, type TripType, type Vehicle } from "@/db/schema";
import type { WithMetrics } from "@/services/efficiency";
import { computeFuelTypeStats, type FuelTypeStats } from "@/services/fuel-comparison";
import { getVehicleFillUpsWithMetrics } from "@/services/fillups";
import { detectOutliers } from "@/services/outliers";
import { computeDaysSinceLastFillUp } from "@/services/stats";
import { computeTripTypeStats, type TripTypeStats } from "@/services/trip-comparison";

export type DashboardFillUp = WithMetrics<FillUp> & { isPersonalBest: boolean };

export interface DashboardData {
	vehicle: Vehicle;
	fillUps: DashboardFillUp[];
	daysSinceLastFillUp: number | null;
	/** Unfiltered — gasoline vs. ethanol across all driving. */
	perFuel: Record<FuelType, FuelTypeStats>;
	/** Unfiltered — road vs. city across both fuels. */
	perTripType: Record<TripType, TripTypeStats>;
	/** Gasoline vs. ethanol, computed separately within each trip type's rows — powers the split recommendation. */
	perFuelByTripType: Record<TripType, Record<FuelType, FuelTypeStats>>;
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

	const perTripType = Object.fromEntries(
		TRIP_TYPES.map((tripType) => [tripType, computeTripTypeStats(fillUps, tripType, vehicle.tankCapacityLiters)]),
	) as Record<TripType, TripTypeStats>;

	const perFuelByTripType = Object.fromEntries(
		TRIP_TYPES.map((tripType) => {
			const tripRows = fillUps.filter((f) => f.tripType === tripType);
			return [
				tripType,
				Object.fromEntries(
					FUEL_TYPES.map((fuelType) => [
						fuelType,
						computeFuelTypeStats(tripRows, fuelType, vehicle.tankCapacityLiters),
					]),
				) as Record<FuelType, FuelTypeStats>,
			];
		}),
	) as Record<TripType, Record<FuelType, FuelTypeStats>>;

	return {
		vehicle,
		fillUps: withPersonalBest(fillUps),
		daysSinceLastFillUp: computeDaysSinceLastFillUp(fillUps),
		perFuel,
		perTripType,
		perFuelByTripType,
	};
}
