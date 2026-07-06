import { getFillUpsByVehicleId } from "@/db/queries/fillups";
import type { FillUp } from "@/db/schema";
import { withComputedMetrics, type WithMetrics } from "./consumption";

/**
 * The single source of truth for a vehicle's fill-ups with derived metrics.
 * Every feature (dashboard, fill-ups list, statistics) calls this and applies
 * its own presentation logic (search/sort/paginate, or aggregation) on top.
 */
export async function getVehicleFillUpsWithMetrics(vehicleId: number): Promise<WithMetrics<FillUp>[]> {
	const rows = await getFillUpsByVehicleId(vehicleId);
	return withComputedMetrics(rows);
}
